const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config');
const prisma = require('../../utils/prisma');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} = require('../../utils/errors');

class AuthService {
  /**
   * Helper: Hash arbitrary token using SHA-256 for secure DB lookup
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Helper: Generate JWT Access Token (15m expiry)
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
    );
  }

  /**
   * Helper: Generate JWT Refresh Token (7d expiry)
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        tokenVersion: crypto.randomBytes(8).toString('hex'),
      },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Register a new user with Customer or Vendor profile in a single atomic transaction
   */
  async register(data) {
    let email = (data.email || '').trim().toLowerCase();
    const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');

    // If no email was provided (common for local Indian vendors & artisans), generate phone-based internal email
    if (!email) {
      if (!cleanPhone) {
        throw new BadRequestError('Phone number is required when email is not provided');
      }
      email = `${cleanPhone}@karigar.local`;
    }

    // Check if user already exists with this email or phone
    let existing = await prisma.user.findUnique({
      where: { email },
    });

    if (!existing && cleanPhone && prisma.user.findFirst) {
      existing = await prisma.user.findFirst({
        where: {
          OR: [
            { vendorProfile: { phone: { contains: cleanPhone.slice(-10) } } },
            { customerProfile: { phone: { contains: cleanPhone.slice(-10) } } },
          ],
        },
      });
    }

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: data.role,
          isActive: true,
          isVerified: false,
        },
      });

      if (data.role === 'CUSTOMER') {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            phone: data.phone || null,
            address: data.address || null,
            defaultLat: data.lat || null,
            defaultLng: data.lng || null,
          },
        });
      } else if (data.role === 'VENDOR') {
        const vendorProfile = await tx.vendorProfile.create({
          data: {
            userId: user.id,
            businessName: data.businessName,
            bio: data.bio || null,
            phone: data.phone,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            isVerified: false,
            isAvailable: true,
          },
        });

        // Initialize pending verification request
        await tx.vendorVerification.create({
          data: {
            vendorId: vendorProfile.id,
            status: 'PENDING',
          },
        });

        // Create local ServiceArea so this artisan's city/area becomes active
        const addressCity = data.address ? data.address.split(',')[0].trim() : 'Local Area';
        await tx.serviceArea.create({
          data: {
            vendorId: vendorProfile.id,
            city: addressCity,
            postalCode: 'India',
            radiusKm: 25,
          },
        });

        // Auto-assign primary service based on vendor's name/trade keywords so they are immediately searchable
        const nameLower = (data.businessName || '').toLowerCase();
        let matchedService = null;

        const allServices = await tx.service.findMany({ take: 30 });
        if (allServices && allServices.length > 0) {
          if (nameLower.includes('electr') || nameLower.includes('बिजली')) {
            matchedService = allServices.find((s) => s.slug.includes('fan') || s.slug.includes('wiring'));
          } else if (nameLower.includes('plumb') || nameLower.includes('नल') || nameLower.includes('पाइप')) {
            matchedService = allServices.find((s) => s.slug.includes('tap') || s.slug.includes('leak'));
          } else if (nameLower.includes('tailor') || nameLower.includes('दर्जी') || nameLower.includes('सिलाई')) {
            matchedService = allServices.find((s) => s.slug.includes('kurti') || s.slug.includes('stitching'));
          } else if (nameLower.includes('garden') || nameLower.includes('माली')) {
            matchedService = allServices.find((s) => s.slug.includes('garden') || s.slug.includes('lawn'));
          } else if (nameLower.includes('halwai') || nameLower.includes('हलवाई') || nameLower.includes('cater')) {
            matchedService = allServices.find((s) => s.slug.includes('halwai') || s.slug.includes('catering'));
          } else if (nameLower.includes('maid') || nameLower.includes('cook') || nameLower.includes('रसोइ') || nameLower.includes('सफाई')) {
            matchedService = allServices.find((s) => s.slug.includes('cleaning') || s.slug.includes('maid'));
          } else if (nameLower.includes('carpent') || nameLower.includes('बढ़ई') || nameLower.includes('खाती')) {
            matchedService = allServices.find((s) => s.slug.includes('wood') || s.slug.includes('furniture'));
          } else if (nameLower.includes('paint') || nameLower.includes('पेंट')) {
            matchedService = allServices.find((s) => s.slug.includes('paint') || s.slug.includes('putty'));
          } else if (nameLower.includes('driver') || nameLower.includes('ड्राइवर')) {
            matchedService = allServices.find((s) => s.slug.includes('driver'));
          } else if (nameLower.includes('pandit') || nameLower.includes('पंडित') || nameLower.includes('पूजा')) {
            matchedService = allServices.find((s) => s.slug.includes('pandit') || s.slug.includes('pooja'));
          }

          if (!matchedService) {
            matchedService = allServices[0];
          }

          if (matchedService) {
            await tx.vendorService.create({
              data: {
                vendorId: vendorProfile.id,
                serviceId: matchedService.id,
                priceMin: matchedService.priceMinDefault || 250,
                priceMax: matchedService.priceMaxDefault || 800,
                isAvailable: true,
              },
            });
          }
        }
      }

      // Generate email verification token
      const rawVerificationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawVerificationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tx.emailVerification.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return { user, rawVerificationToken };
    });

    // Auto-login after registration: generate access & refresh tokens
    const accessToken = this.generateAccessToken(result.user);
    const rawRefreshToken = this.generateRefreshToken(result.user);
    const refreshHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt,
      },
    });

    const userProfile = await this.getCurrentUser(result.user.id);

    return {
      user: userProfile,
      accessToken,
      refreshToken: rawRefreshToken,
      verificationToken: result.rawVerificationToken, // useful for testing & email service
    };
  }

  /**
   * Login user with mobile number or email & password
   */
  async login({ identifier, email, phone, password }) {
    const target = (identifier || email || phone || '').trim();
    if (!target) {
      throw new UnauthorizedError('Please enter your mobile number or email');
    }

    const isEmail = target.includes('@');
    const cleanDigits = target.replace(/[^0-9]/g, '');

    let user = null;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: target.toLowerCase() },
        include: {
          customerProfile: true,
          vendorProfile: true,
        },
      });
    } else {
      // Find user by phone number in vendorProfile, customerProfile, or synthetic email
      const searchTen = cleanDigits.slice(-10);
      const part1 = searchTen.slice(0, 5);
      const part2 = searchTen.slice(5);

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: `${cleanDigits}@karigar.local` },
            ...(searchTen ? [
              { vendorProfile: { phone: { contains: searchTen } } },
              { customerProfile: { phone: { contains: searchTen } } },
              { email: { contains: searchTen } },
              // Match formatted phone like "+91-98111-22334" or "98111-22334"
              {
                vendorProfile: {
                  AND: [
                    { phone: { contains: part1 } },
                    { phone: { contains: part2 } },
                  ],
                },
              },
              {
                customerProfile: {
                  AND: [
                    { phone: { contains: part1 } },
                    { phone: { contains: part2 } },
                  ],
                },
              },
            ] : []),
            { vendorProfile: { phone: { contains: target } } },
            { customerProfile: { phone: { contains: target } } },
          ],
        },
        include: {
          customerProfile: true,
          vendorProfile: true,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedError('Invalid mobile number/email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled. Please contact support.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid mobile number/email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = this.generateRefreshToken(user);
    const refreshHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt,
      },
    });

    // Remove passwordHash from user object
    // eslint-disable-next-line no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Refresh Token with rotation: revoke old token, issue new token pair
   */
  async refreshAccessToken(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, config.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash,
      },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      // Possible token reuse or revoked token: invalidate all tokens for this user for security
      if (storedToken && storedToken.revoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: decoded.userId },
          data: { revoked: true },
        });
      }
      throw new UnauthorizedError('Refresh token is invalid, expired, or revoked');
    }

    // Mark current refresh token as revoked (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customerProfile: true,
        vendorProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or disabled');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRawRefreshToken = this.generateRefreshToken(user);
    const newRefreshHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newRefreshHash,
        expiresAt: newExpiresAt,
      },
    });

    // eslint-disable-next-line no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  /**
   * Logout user by revoking the refresh token
   */
  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return true;

    try {
      const tokenHash = this.hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    } catch (err) {
      console.warn('Logout revocation warning:', err.message);
    }
    return true;
  }

  /**
   * Verify email address with token
   */
  async verifyEmail(rawToken) {
    const tokenHash = this.hashToken(rawToken);

    const record = await prisma.emailVerification.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        verifiedAt: null,
      },
    });

    if (!record) {
      throw new BadRequestError('Invalid or expired email verification link');
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: true },
      }),
    ]);

    return { success: true, message: 'Email successfully verified' };
  }

  /**
   * Request password reset token
   */
  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent user enumeration, return ok even if user does not exist
    if (!user) {
      return { message: 'If that email exists in our system, a password reset link has been dispatched.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: 'If that email exists in our system, a password reset link has been dispatched.',
      resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(rawToken, newPassword) {
    const tokenHash = this.hashToken(rawToken);

    const record = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!record) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing refresh sessions for security
      prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { revoked: true },
      }),
    ]);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Get user profile by userId
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        customerProfile: true,
        vendorProfile: {
          include: {
            vendorServices: { include: { service: true } },
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
}

module.exports = new AuthService();
