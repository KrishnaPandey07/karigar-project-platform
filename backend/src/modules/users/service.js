const bcrypt = require('bcryptjs');
const prisma = require('../../utils/prisma');
const {
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} = require('../../utils/errors');

class UserService {
  /**
   * Get current user's profile with location
   */
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        status: true,
        createdAt: true,
        customerProfile: {
          include: {
            defaultLocation: true,
          },
        },
        vendorProfile: {
          include: {
            serviceAreas: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user details (Customer self-service)
   */
  async updateUserProfile(userId, updateData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, vendorProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const {
      fullName,
      name,
      phone,
      address,
      defaultLocationId,
      defaultLat,
      defaultLng,
    } = updateData;

    const resolvedName = fullName || name;

    if (user.role === 'CUSTOMER') {
      const dataToUpdate = {};
      if (resolvedName !== undefined) dataToUpdate.fullName = resolvedName;
      if (phone !== undefined) dataToUpdate.phone = phone;
      if (address !== undefined) dataToUpdate.address = address;
      if (defaultLocationId !== undefined) dataToUpdate.defaultLocationId = defaultLocationId;
      if (defaultLat !== undefined) dataToUpdate.defaultLat = defaultLat;
      if (defaultLng !== undefined) dataToUpdate.defaultLng = defaultLng;

      await prisma.customerProfile.upsert({
        where: { userId },
        update: dataToUpdate,
        create: {
          userId,
          fullName: resolvedName || 'Valued Customer',
          phone,
          address,
          defaultLocationId,
          defaultLat,
          defaultLng,
        },
      });
    } else if (user.role === 'VENDOR') {
      const vendorData = {};
      if (resolvedName !== undefined) vendorData.businessName = resolvedName;
      if (phone !== undefined) vendorData.phone = phone;
      if (address !== undefined) vendorData.address = address;
      if (defaultLat !== undefined) vendorData.lat = defaultLat;
      if (defaultLng !== undefined) vendorData.lng = defaultLng;

      if (Object.keys(vendorData).length > 0) {
        await prisma.vendorProfile.update({
          where: { userId },
          data: vendorData,
        });
      }
    }

    return this.getUserProfile(userId);
  }

  /**
   * Change user password (Requires old password verification)
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens except current session for security
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Soft-delete user account (Sets status=DELETED, isActive=false)
   * Throws 409 Conflict if user has active service requests.
   */
  async softDeleteAccount(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, vendorProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check for active service requests
    const activeStatuses = ['REQUESTED', 'SUBMITTED', 'PENDING_QUOTE', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'];

    let activeRequest = null;
    if (user.customerProfile) {
      activeRequest = await prisma.serviceRequest.findFirst({
        where: {
          customerId: user.customerProfile.id,
          status: { in: activeStatuses },
        },
      });
    }

    if (!activeRequest && user.vendorProfile) {
      activeRequest = await prisma.serviceRequest.findFirst({
        where: {
          vendorId: user.vendorProfile.id,
          status: { in: activeStatuses },
        },
      });
    }

    if (activeRequest) {
      throw new ConflictError(
        'Cannot deactivate account while you have active service requests. Please complete or cancel them first.',
        [
          {
            code: 'ACTIVE_REQUESTS_EXIST',
            requestId: activeRequest.id,
            status: activeRequest.status,
          },
        ]
      );
    }

    // Soft delete: status=DELETED, isActive=false, deletedAt timestamp
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          status: 'DELETED',
          deletedAt: new Date(),
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      }),
    ]);

    return {
      success: true,
      message: 'Your account has been deactivated successfully. We are sorry to see you go.',
    };
  }

  /**
   * Get Customer Dashboard summary
   */
  async getCustomerDashboard(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true },
    });

    if (!user || !user.customerProfile) {
      throw new NotFoundError('Customer profile not found');
    }

    const customerId = user.customerProfile.id;

    // 1. Active Requests
    const activeStatuses = ['REQUESTED', 'SUBMITTED', 'PENDING_QUOTE', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'];
    const activeRequests = await prisma.serviceRequest.findMany({
      where: {
        customerId,
        status: { in: activeStatuses },
      },
      include: {
        service: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            avatarUrl: true,
            ratingAvg: true,
          },
        },
        quotes: {
          where: { status: 'PENDING' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 2. Saved / Favorited Vendors (excluding suspended vendors)
    const savedFavorites = await prisma.favorite.findMany({
      where: {
        customerId,
        vendor: {
          isSuspended: false,
          user: { isActive: true },
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            address: true,
            ratingAvg: true,
            ratingCount: true,
            isVerified: true,
            isAvailable: true,
            avatarUrl: true,
            vendorServices: {
              take: 2,
              include: { service: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 3. Pending Reviews: Completed requests without a review
    const pendingReviews = await prisma.serviceRequest.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
        review: null,
      },
      include: {
        service: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    return {
      activeRequests,
      savedVendors: savedFavorites.map((f) => f.vendor),
      pendingReviews,
      stats: {
        activeRequestsCount: activeRequests.length,
        savedVendorsCount: savedFavorites.length,
        pendingReviewsCount: pendingReviews.length,
      },
    };
  }
}

module.exports = new UserService();
