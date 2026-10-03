const prisma = require('../../utils/prisma');
const { NotFoundError, ConflictError } = require('../../utils/errors');

class FavoriteService {
  async getFavorites(userId) {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        customerId: customer.id,
        // Suspended vendors are hidden from the list
        vendor: {
          isSuspended: false,
          user: { isActive: true },
        },
      },
      include: {
        vendor: {
          include: {
            vendorServices: {
              where: { isAvailable: true },
              include: {
                service: {
                  select: { name: true, category: { select: { name: true, slug: true } } },
                },
              },
            },
            serviceAreas: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      favoriteId: f.id,
      favoritedAt: f.createdAt,
      vendor: {
        id: f.vendor.id,
        businessName: f.vendor.businessName,
        bio: f.vendor.bio,
        phone: f.vendor.phone,
        address: f.vendor.address,
        lat: f.vendor.lat,
        lng: f.vendor.lng,
        isVerified: f.vendor.isVerified,
        isAvailable: f.vendor.isAvailable, // marked unavailable if vendor toggled off
        avg_rating: f.vendor.ratingAvg,
        review_count: f.vendor.ratingCount,
        avatarUrl: f.vendor.avatarUrl,
        services: f.vendor.vendorServices.map((vs) => ({
          id: vs.id,
          name: vs.service?.name,
          category: vs.service?.category?.name,
          priceType: vs.priceType,
          priceMin: Number(vs.priceMin),
          priceMax: Number(vs.priceMax),
        })),
        serviceArea: f.vendor.serviceAreas?.[0] || null,
      },
    }));
  }

  async addFavorite(userId, vendorId) {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    // Verify vendor exists and is not suspended
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: { select: { isActive: true } } },
    });

    if (!vendor || vendor.isSuspended || !vendor.user?.isActive) {
      throw new NotFoundError('Vendor not found or currently suspended');
    }

    // Check if already favorited -> 409 Conflict
    const existing = await prisma.favorite.findUnique({
      where: {
        customerId_vendorId: {
          customerId: customer.id,
          vendorId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Vendor is already in your favorites');
    }

    const favorite = await prisma.favorite.create({
      data: {
        customerId: customer.id,
        vendorId,
      },
      include: {
        vendor: {
          select: { id: true, businessName: true },
        },
      },
    });

    return {
      favorite,
      message: `${vendor.businessName} has been added to your favorites`,
    };
  }

  async removeFavorite(userId, vendorId) {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    const deleted = await prisma.favorite.deleteMany({
      where: {
        customerId: customer.id,
        vendorId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Vendor was not found in your favorites list');
    }

    return {
      success: true,
      message: 'Vendor removed from favorites successfully',
    };
  }
}

module.exports = new FavoriteService();
