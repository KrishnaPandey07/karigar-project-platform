const prisma = require('../../utils/prisma');
const { calculateHaversineDistance, getBoundingBox } = require('../../utils/haversine');
const { calculateRankingScore } = require('../../utils/ranking');
const { DEFAULT_TIMEZONE, DEFAULT_SEARCH_RADIUS_KM } = require('../../config/ranking');

// Common typo corrections dictionary for trade names
const TYPO_MAP = {
  plummer: 'plumb',
  plumer: 'plumb',
  electrcian: 'electric',
  electrishan: 'electric',
  electrisian: 'electric',
  electricn: 'electric',
  talor: 'tailor',
  taylor: 'tailor',
  tuter: 'tutor',
  tootor: 'tutor',
  cleener: 'clean',
  cleening: 'clean',
  mechanic: 'repair',
};

class SearchService {
  /**
   * Determine if vendor is currently open based on weekly schedule, time offs, and live toggle
   */
  isVendorOpenNow(vendor, now = new Date(), timezone = DEFAULT_TIMEZONE) {
    if (!vendor.isAvailable) {
      return false;
    }

    try {
      // 1. Check blackout periods (time off) first
      if (vendor.timeOffs && vendor.timeOffs.length > 0) {
        const inTimeOff = vendor.timeOffs.some((to) => {
          const start = new Date(to.startDate).getTime();
          const end = new Date(to.endDate).getTime();
          const currentMs = now.getTime();
          return currentMs >= start && currentMs <= end;
        });

        if (inTimeOff) {
          return false;
        }
      }

      // 2. Check current day of week and time in target timezone
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const parts = timeFormatter.formatToParts(now);
      const hourPart = parts.find((p) => p.type === 'hour')?.value || '00';
      const minutePart = parts.find((p) => p.type === 'minute')?.value || '00';
      const currentTime = `${hourPart}:${minutePart}`;

      // Date().getDay() in target timezone
      const weekdayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
      }).format(now);

      const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const currentDayOfWeek = weekdayMap[weekdayStr] ?? now.getDay();

      // 2. Check weekly hours for today
      if (!vendor.availabilities || vendor.availabilities.length === 0) {
        // If no explicit schedule declared, default to open if available toggle is on
        return true;
      }

      const todaySchedules = vendor.availabilities.filter(
        (a) => a.isActive && a.dayOfWeek === currentDayOfWeek
      );

      if (todaySchedules.length === 0) {
        return false;
      }

      const withinHours = todaySchedules.some(
        (slot) => currentTime >= slot.startTime && currentTime <= slot.endTime
      );

      return withinHours;
    } catch {
      return vendor.isAvailable;
    }
  }

  /**
   * Search and Rank Vendors
   * Blueprint Sections 8 & 9
   */
  async searchVendors(params = {}, userId = null) {
    const {
      q,
      category,
      service,
      area_id,
      radius = DEFAULT_SEARCH_RADIUS_KM,
      min_rating,
      price_min,
      price_max,
      verified,
      available_now,
      sort = 'best_match',
      page = 1,
      limit = 10,
    } = params;

    let userLat = params.lat;
    let userLng = params.lng;

    // If area_id is provided without coordinates, resolve from ServiceArea
    if ((userLat === undefined || userLng === undefined) && area_id) {
      const area = await prisma.serviceArea.findUnique({ where: { id: area_id } });
      if (area && area.vendor) {
        userLat = area.vendor.lat;
        userLng = area.vendor.lng;
      }
    }

    const hasCoordinates =
      userLat !== undefined &&
      userLng !== undefined &&
      !isNaN(userLat) &&
      !isNaN(userLng);

    // Normalize query string and handle typos
    let cleanQuery = q ? q.trim().toLowerCase() : '';
    if (cleanQuery) {
      // Check if query matches known typo
      for (const [typo, replacement] of Object.entries(TYPO_MAP)) {
        if (cleanQuery.includes(typo)) {
          cleanQuery = cleanQuery.replace(typo, replacement);
        }
      }
    }

    // 1. Candidate Selection Query
    // Active vendors only, not suspended, with at least one active service
    const where = {
      isSuspended: false,
      user: { isActive: true },
      vendorServices: {
        some: {
          isAvailable: true,
        },
      },
    };

    // Category filter
    if (category) {
      where.vendorServices.some = {
        ...where.vendorServices.some,
        service: {
          category: {
            OR: [
              { slug: { contains: category, mode: 'insensitive' } },
              { name: { contains: category, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    // Service filter
    if (service) {
      where.vendorServices.some = {
        ...where.vendorServices.some,
        service: {
          OR: [
            { slug: { contains: service, mode: 'insensitive' } },
            { name: { contains: service, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Verified only filter
    if (verified === true) {
      where.isVerified = true;
    }

    // Fetch candidate vendors
    const candidates = await prisma.vendorProfile.findMany({
      where,
      include: {
        user: { select: { isActive: true } },
        vendorServices: {
          where: { isAvailable: true },
          include: {
            service: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
        availabilities: { where: { isActive: true } },
        timeOffs: true,
        serviceAreas: { take: 1 },
      },
    });

    const now = new Date();

    // 2. In-Memory Filtering, Distance, Availability, and Price Extraction
    let results = [];

    for (const v of candidates) {
      // Must have at least one active service
      if (!v.vendorServices || v.vendorServices.length === 0) {
        continue;
      }

      // Keyword matching across business name, bio, and services
      if (cleanQuery) {
        const matchesBusiness = v.businessName.toLowerCase().includes(cleanQuery);
        const matchesBio = v.bio ? v.bio.toLowerCase().includes(cleanQuery) : false;
        const matchesService = v.vendorServices.some(
          (vs) =>
            vs.service?.name?.toLowerCase().includes(cleanQuery) ||
            vs.service?.description?.toLowerCase().includes(cleanQuery) ||
            vs.service?.category?.name?.toLowerCase().includes(cleanQuery)
        );

        if (!matchesBusiness && !matchesBio && !matchesService) {
          continue;
        }
      }

      // Geo Filter: Bounding Box and Exact Haversine Distance
      let distanceKm = null;
      if (hasCoordinates) {
        distanceKm = calculateHaversineDistance(userLat, userLng, v.lat, v.lng);
        // Exclude if beyond radius
        if (radius !== undefined && distanceKm > radius) {
          continue;
        }
      }

      // Calculate Availability ("Open Now")
      const openNow = this.isVendorOpenNow(v, now);
      if (available_now === true && !openNow) {
        continue;
      }

      // Min Rating Filter
      if (min_rating !== undefined && v.ratingAvg < min_rating) {
        continue;
      }

      // Calculate Starting Price
      const minPrices = v.vendorServices.map((vs) => Number(vs.priceMin)).filter((p) => p > 0);
      const startingPrice = minPrices.length > 0 ? Math.min(...minPrices) : 0;

      // Price Filters
      if (price_min !== undefined && startingPrice < price_min) {
        continue;
      }
      if (price_max !== undefined && startingPrice > price_max) {
        continue;
      }

      // Calculate Pure Function Ranking Score
      const searchContext = {
        radiusKm: radius,
        userLat,
        userLng,
        maxPriceBenchmark: 1000,
      };

      const vendorDataForRanking = {
        ...v,
        distanceKm,
        openNow,
        startingPrice,
      };

      const { score, scoreBreakdown } = calculateRankingScore(vendorDataForRanking, searchContext);

      results.push({
        id: v.id,
        businessName: v.businessName,
        bio: v.bio,
        avatarUrl: v.avatarUrl,
        phone: v.phone,
        address: v.address,
        lat: v.lat,
        lng: v.lng,
        distanceKm,
        avgRating: v.ratingAvg,
        reviewCount: v.ratingCount,
        verified: v.isVerified,
        isAvailable: v.isAvailable,
        dutyStatus: v.dutyStatus || (v.isAvailable ? 'AVAILABLE' : 'OFF_DUTY'),
        openNow,
        startingPrice,
        score,
        scoreBreakdown,
        services: v.vendorServices.map((vs) => ({
          id: vs.id,
          name: vs.service?.name,
          category: vs.service?.category?.name,
          priceType: vs.priceType,
          priceMin: Number(vs.priceMin),
          priceMax: Number(vs.priceMax),
        })),
        serviceArea: v.serviceAreas?.[0] || null,
      });
    }

    // 3. Sorting
    switch (sort) {
      case 'nearest':
        results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        break;
      case 'highest_rated':
        results.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
        break;
      case 'lowest_price':
        results.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'most_reviewed':
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'best_match':
      default:
        results.sort((a, b) => b.score - a.score);
        break;
    }

    // 4. Pagination
    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedVendors = results.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    // 5. Zero Results Hint & Logging
    let hint = null;
    if (total === 0) {
      hint = `No service providers found within ${radius} km. Try expanding your search radius to 30 km or explore nearby categories like Electrical, Plumbing, or Tailoring.`;

      // Log zero-result searches to search_logs
      if (prisma.searchLog && typeof prisma.searchLog.create === 'function') {
        try {
          const logPromise = prisma.searchLog.create({
            data: {
              query: cleanQuery || null,
              category: category || null,
              service: service || null,
              lat: userLat || null,
              lng: userLng || null,
              radiusKm: radius,
              resultsCount: 0,
              userId: userId || null,
            },
          });
          if (logPromise && typeof logPromise.catch === 'function') {
            logPromise.catch((err) => console.warn('SearchLog error:', err.message));
          }
        } catch (logErr) {
          // ignore log errors in search flow
        }
      }
    }

    return {
      vendors: paginatedVendors,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hint,
      },
    };
  }

  /**
   * Search Suggestions Autocomplete
   * Returns grouped matching services, categories, and top vendor names
   */
  async getSuggestions(query) {
    if (!query || !query.trim()) {
      return { services: [], categories: [], vendors: [] };
    }

    const q = query.trim().toLowerCase();

    const [services, categories, vendors] = await Promise.all([
      prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true, category: { select: { name: true } } },
        take: 5,
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true, icon: true },
        take: 3,
      }),
      prisma.vendorProfile.findMany({
        where: {
          isSuspended: false,
          user: { isActive: true },
          businessName: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, businessName: true, ratingAvg: true, isVerified: true },
        take: 4,
      }),
    ]);

    return {
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category?.name,
        type: 'service',
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: 'category',
      })),
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.businessName,
        rating: v.ratingAvg,
        verified: v.isVerified,
        type: 'vendor',
      })),
    };
  }
}

module.exports = new SearchService();
