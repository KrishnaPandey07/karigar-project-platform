const prisma = require('../../utils/prisma');
const { NotFoundError } = require('../../utils/errors');

class CatalogService {
  /**
   * Get all active categories with distinct active vendor counts per category
   */
  async getCategoriesWithVendorCounts() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = await Promise.all(
      categories.map(async (cat) => {
        const serviceIds = cat.services.map((s) => s.id);

        let vendorCount = 0;
        if (serviceIds.length > 0) {
          const distinctVendors = await prisma.vendorService.findMany({
            where: {
              serviceId: { in: serviceIds },
              isAvailable: true,
              vendor: {
                isSuspended: false,
                user: { isActive: true },
              },
            },
            distinct: ['vendorId'],
            select: { vendorId: true },
          });
          vendorCount = distinctVendors.length;
        }

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          servicesCount: cat.services.length,
          vendorCount,
        };
      })
    );

    return result;
  }

  /**
   * Get services, optionally filtered by category
   */
  async getServices({ category_id, category_slug }) {
    const where = { isActive: true };

    if (category_id) {
      where.categoryId = category_id;
    } else if (category_slug) {
      where.category = { slug: category_slug };
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * List / search areas used by the LocationPicker
   */
  async getLocations({ query, q } = {}) {
    const searchTerm = q || query;
    const where = {};
    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { city: { contains: searchTerm.trim(), mode: 'insensitive' } },
        { postalCode: { contains: searchTerm.trim(), mode: 'insensitive' } },
      ];
    }

    let locations = await prisma.serviceArea.findMany({
      where,
      select: {
        id: true,
        city: true,
        postalCode: true,
        radiusKm: true,
      },
      distinct: ['city', 'postalCode'],
      take: 30,
      orderBy: { city: 'asc' },
    });

    // Provide helpful standard Indian metropolitan demo districts if empty
    if (!locations || locations.length === 0) {
      locations = [
        { id: 'loc-del-cp', city: 'Delhi (Connaught Place)', postalCode: '110001', radiusKm: 20 },
        { id: 'loc-mum-bandra', city: 'Mumbai (Bandra West)', postalCode: '400050', radiusKm: 15 },
        { id: 'loc-blr-koramangala', city: 'Bengaluru (Koramangala)', postalCode: '560034', radiusKm: 15 },
        { id: 'loc-hyd-hitec', city: 'Hyderabad (Hitec City)', postalCode: '500081', radiusKm: 18 },
        { id: 'loc-che-tnagar', city: 'Chennai (T. Nagar)', postalCode: '600017', radiusKm: 15 },
        { id: 'loc-kol-saltlake', city: 'Kolkata (Salt Lake)', postalCode: '700091', radiusKm: 15 },
        { id: 'loc-pun-kothrud', city: 'Pune (Kothrud)', postalCode: '411038', radiusKm: 15 },
        { id: 'loc-ahm-navrangpura', city: 'Ahmedabad (Navrangpura)', postalCode: '380009', radiusKm: 15 },
        { id: 'loc-jai-malviya', city: 'Jaipur (Malviya Nagar)', postalCode: '302017', radiusKm: 15 },
        { id: 'loc-lko-gomtinagar', city: 'Lucknow (Gomti Nagar)', postalCode: '226010', radiusKm: 15 },
        { id: 'loc-chd-sector17', city: 'Chandigarh (Sector 17)', postalCode: '160017', radiusKm: 15 },
        { id: 'loc-koc-kakkanad', city: 'Kochi (Kakkanad)', postalCode: '682030', radiusKm: 15 },
      ];
    }

    return locations;
  }

  /**
   * Get public vendor profile
   * Returns 404 if vendor is not found OR suspended.
   * Increments profile_views counter.
   */
  async getPublicVendor(vendorId) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        user: { select: { isActive: true } },
        vendorServices: {
          where: { isAvailable: true },
          include: {
            service: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true, icon: true },
                },
              },
            },
          },
        },
        serviceAreas: true,
        availabilities: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    // 404 if not found, suspended, or inactive account
    if (!vendor || vendor.isSuspended || !vendor.user?.isActive) {
      throw new NotFoundError('Vendor profile not found or currently suspended');
    }

    // Increment profile views asynchronously (optimistic)
    prisma.vendorProfile
      .update({
        where: { id: vendorId },
        data: { profileViews: { increment: 1 } },
      })
      .catch((err) => console.warn('Profile view increment warning:', err.message));

    // Construct response matching blueprint Section 3 & 6 specifications
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      bio: vendor.bio,
      phone: vendor.phone,
      address: vendor.address,
      lat: vendor.lat,
      lng: vendor.lng,
      isVerified: vendor.isVerified,
      isAvailable: vendor.isAvailable,
      dutyStatus: vendor.dutyStatus || (vendor.isAvailable ? 'AVAILABLE' : 'OFF_DUTY'),
      responseTimeAvg: vendor.responseTimeAvg,
      avg_rating: vendor.ratingAvg,
      review_count: vendor.ratingCount,
      avatarUrl: vendor.avatarUrl,
      bannerUrl: vendor.bannerUrl,
      gallery: vendor.galleryUrls || [],
      profile_views: vendor.profileViews + 1,
      createdAt: vendor.createdAt,
      services: vendor.vendorServices.map((vs) => ({
        id: vs.id,
        serviceId: vs.serviceId,
        name: vs.service?.name,
        category: vs.service?.category?.name,
        categorySlug: vs.service?.category?.slug,
        priceType: vs.priceType,
        priceMin: Number(vs.priceMin),
        priceMax: Number(vs.priceMax),
        description: vs.description,
      })),
      hours: vendor.availabilities.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      serviceArea: vendor.serviceAreas?.[0] || null,
    };
  }

  /**
   * Get top-rated vendors for landing page and discovery
   */
  async getTopVendors(limit = 10) {
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        isSuspended: false,
        user: { isActive: true },
      },
      include: {
        vendorServices: {
          where: { isAvailable: true },
          take: 3,
          include: {
            service: { select: { name: true, category: { select: { name: true, slug: true } } } },
          },
        },
        serviceAreas: { take: 1 },
      },
      orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
      take: Number(limit) || 10,
    });

    return vendors.map((v) => ({
      id: v.id,
      businessName: v.businessName,
      bio: v.bio,
      address: v.address,
      phone: v.phone,
      lat: v.lat,
      lng: v.lng,
      isVerified: v.isVerified,
      isAvailable: v.isAvailable,
      dutyStatus: v.dutyStatus || (v.isAvailable ? 'AVAILABLE' : 'OFF_DUTY'),
      avg_rating: v.ratingAvg,
      review_count: v.ratingCount,
      avatarUrl: v.avatarUrl,
      services: v.vendorServices.map((vs) => ({
        name: vs.service?.name,
        category: vs.service?.category?.name,
        priceMin: Number(vs.priceMin),
        priceMax: Number(vs.priceMax),
        priceType: vs.priceType,
      })),
      serviceArea: v.serviceAreas?.[0] || null,
    }));
  }
}

module.exports = new CatalogService();
