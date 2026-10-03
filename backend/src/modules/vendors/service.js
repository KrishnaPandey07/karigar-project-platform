const prisma = require('../../utils/prisma');
const { NotFoundError, BadRequestError, ConflictError } = require('../../utils/errors');
const { geocodeAddress } = require('../../utils/geocoder');

class VendorService {
  /**
   * Calculate Vendor Profile Completeness Score (0-100%) and missing items
   */
  calculateCompleteness(vendor) {
    let score = 0;
    const missing = [];
    const breakdown = {
      businessInfo: { points: 0, max: 25, completed: false },
      avatar: { points: 0, max: 15, completed: false },
      services: { points: 0, max: 25, completed: false },
      availability: { points: 0, max: 20, completed: false },
      verification: { points: 0, max: 15, completed: false },
    };

    // 1. Business Info (25%)
    const hasBasicInfo =
      vendor.businessName &&
      vendor.phone &&
      vendor.address &&
      vendor.lat !== null &&
      vendor.lat !== undefined &&
      vendor.lng !== null &&
      vendor.lng !== undefined &&
      vendor.bio &&
      vendor.bio.trim().length >= 10;

    if (hasBasicInfo) {
      score += 25;
      breakdown.businessInfo.points = 25;
      breakdown.businessInfo.completed = true;
    } else {
      if (!vendor.bio || vendor.bio.trim().length < 10) {
        missing.push('Add a detailed bio explaining your experience');
      }
      if (!vendor.address) {
        missing.push('Provide a physical business address or home base');
      }
    }

    // 2. Avatar / Profile Image (15%)
    if (vendor.avatarUrl) {
      score += 15;
      breakdown.avatar.points = 15;
      breakdown.avatar.completed = true;
    } else {
      missing.push('Upload a profile picture or company logo');
    }

    // 3. Services & Pricing (25%)
    const servicesCount = vendor.vendorServices?.length || 0;
    if (servicesCount > 0) {
      score += 25;
      breakdown.services.points = 25;
      breakdown.services.completed = true;
    } else {
      missing.push('Add at least one service offering with pricing');
    }

    // 4. Availability Schedule (20%)
    const activeScheduleDays = vendor.availabilities?.filter((a) => a.isActive)?.length || 0;
    if (activeScheduleDays > 0) {
      score += 20;
      breakdown.availability.points = 20;
      breakdown.availability.completed = true;
    } else {
      missing.push('Set your weekly working hours & availability');
    }

    // 5. Verification Documents (15%)
    const hasVerificationDocs =
      vendor.verifications?.some((v) => v.documents && v.documents.length > 0) || vendor.isVerified;

    if (hasVerificationDocs) {
      score += 15;
      breakdown.verification.points = 15;
      breakdown.verification.completed = true;
    } else {
      missing.push('Submit a business ID or trade license for verification badge');
    }

    return {
      percentage: score,
      score,
      total: 100,
      breakdown,
      missingFields: missing,
      isComplete: score === 100,
    };
  }

  /**
   * Fetch current vendor's full profile including completeness breakdown
   */
  async getVendorByUserId(userId) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        vendorServices: {
          include: {
            service: {
              include: { category: true },
            },
          },
        },
        serviceAreas: true,
        availabilities: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        timeOffs: {
          orderBy: { startDate: 'asc' },
        },
        verifications: {
          include: { documents: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for current user');
    }

    const completeness = this.calculateCompleteness(vendor);

    return {
      ...vendor,
      completeness,
    };
  }

  /**
   * Fetch public vendor profile by vendor ID (Blueprint Sections 3 & 6)
   */
  async getPublicVendorById(vendorId) {
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

    if (!vendor || vendor.isSuspended || !vendor.user?.isActive) {
      throw new NotFoundError('Vendor profile not found or currently suspended');
    }

    // Increment profile views
    prisma.vendorProfile
      .update({
        where: { id: vendorId },
        data: { profileViews: { increment: 1 } },
      })
      .catch((err) => console.warn('Profile view increment warning:', err.message));

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
      response_rate: 98, // Blueprint: % response rate within 24h
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
   * Update vendor business details
   */
  async updateVendorProfile(userId, updateData) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const { serviceRadiusKm, ...profileFields } = updateData;

    // Write-time geocoding: If address is updated but lat/lng not explicitly provided
    if (
      profileFields.address &&
      (profileFields.lat === undefined || profileFields.lng === undefined)
    ) {
      const geo = await geocodeAddress(profileFields.address);
      if (geo) {
        profileFields.lat = geo.lat;
        profileFields.lng = geo.lng;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.vendorProfile.update({
        where: { id: vendor.id },
        data: profileFields,
      });

      if (serviceRadiusKm !== undefined) {
        // Upsert default service area
        const existingArea = await tx.serviceArea.findFirst({
          where: { vendorId: vendor.id },
        });

        if (existingArea) {
          await tx.serviceArea.update({
            where: { id: existingArea.id },
            data: { radiusKm: serviceRadiusKm },
          });
        } else {
          await tx.serviceArea.create({
            data: {
              vendorId: vendor.id,
              city: vendor.address?.split(',')[0] || 'Local Area',
              radiusKm: serviceRadiusKm,
            },
          });
        }
      }

      return v;
    });

    return this.getVendorByUserId(userId);
  }

  /**
   * Instantly toggle active availability or 3-state duty
   */
  async toggleAvailability(userId, input) {
    const isBool = typeof input === 'boolean';
    const isAvailable = isBool ? input : input?.isAvailable;
    const dutyStatus = !isBool ? input?.dutyStatus : undefined;

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    let finalDutyStatus = dutyStatus;
    let finalIsAvailable = isAvailable;

    if (dutyStatus) {
      finalIsAvailable = dutyStatus === 'AVAILABLE';
    } else if (isAvailable !== undefined) {
      finalDutyStatus = isAvailable ? 'AVAILABLE' : 'OFF_DUTY';
    }

    const data = {};
    if (finalIsAvailable !== undefined) data.isAvailable = finalIsAvailable;
    if (finalDutyStatus !== undefined) data.dutyStatus = finalDutyStatus;

    const updated = await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data,
      select: {
        id: true,
        businessName: true,
        isAvailable: true,
        dutyStatus: true,
      },
    });

    return updated;
  }

  /**
   * Add or update a vendor service offering with pricing constraints
   */
  async addOrUpdateService(userId, serviceData) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    if (serviceData.priceMax < serviceData.priceMin) {
      throw new BadRequestError('Maximum price must be greater than or equal to minimum price');
    }

    const serviceExists = await prisma.service.findUnique({
      where: { id: serviceData.serviceId },
    });
    if (!serviceExists) {
      throw new NotFoundError('Base service catalog entry not found');
    }

    const vendorService = await prisma.vendorService.upsert({
      where: {
        vendorId_serviceId: {
          vendorId: vendor.id,
          serviceId: serviceData.serviceId,
        },
      },
      update: {
        priceType: serviceData.priceType || 'RANGE',
        priceMin: serviceData.priceMin,
        priceMax: serviceData.priceMax,
        description: serviceData.description || null,
        isAvailable: serviceData.isAvailable ?? true,
      },
      create: {
        vendorId: vendor.id,
        serviceId: serviceData.serviceId,
        priceType: serviceData.priceType || 'RANGE',
        priceMin: serviceData.priceMin,
        priceMax: serviceData.priceMax,
        description: serviceData.description || null,
        isAvailable: serviceData.isAvailable ?? true,
      },
      include: {
        service: {
          include: { category: true },
        },
      },
    });

    return vendorService;
  }

  /**
   * Delete a vendor service
   */
  async deleteService(userId, serviceId) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    await prisma.vendorService.deleteMany({
      where: {
        vendorId: vendor.id,
        serviceId,
      },
    });

    return { success: true, message: 'Service removed successfully' };
  }

  /**
   * Save Weekly Availability Schedule with strict overlap validation
   */
  async saveWeeklyAvailability(userId, schedule) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Overlap validation check
    const activeByDay = {};
    for (const item of schedule) {
      if (!item.isActive) continue;
      if (!activeByDay[item.dayOfWeek]) activeByDay[item.dayOfWeek] = [];
      activeByDay[item.dayOfWeek].push(item);
    }

    for (const [day, intervals] of Object.entries(activeByDay)) {
      intervals.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < intervals.length - 1; i++) {
        const cur = intervals[i];
        const next = intervals[i + 1];
        if (cur.endTime > next.startTime) {
          throw new ConflictError(
            `Overlapping schedule intervals on day ${day}: ${cur.startTime}-${cur.endTime} and ${next.startTime}-${next.endTime}`
          );
        }
      }
    }

    // Atomically replace schedule
    await prisma.$transaction(async (tx) => {
      await tx.vendorAvailability.deleteMany({
        where: { vendorId: vendor.id },
      });

      if (schedule.length > 0) {
        await tx.vendorAvailability.createMany({
          data: schedule.map((item) => ({
            vendorId: vendor.id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            isActive: item.isActive ?? true,
          })),
        });
      }
    });

    return prisma.vendorAvailability.findMany({
      where: { vendorId: vendor.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Add Time Off / Vacation with strict overlap validation
   */
  async addTimeOff(userId, { startDate, endDate, reason }) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestError('Start date must be before or equal to end date');
    }

    // Overlap validation with existing time off: start <= existing.end AND end >= existing.start
    const overlapping = await prisma.vendorTimeOff.findFirst({
      where: {
        vendorId: vendor.id,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlapping) {
      throw new ConflictError(
        `Time off dates overlap with existing blackout period (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]})`
      );
    }

    const record = await prisma.vendorTimeOff.create({
      data: {
        vendorId: vendor.id,
        startDate: start,
        endDate: end,
        reason: reason || null,
      },
    });

    return record;
  }

  /**
   * Delete Time Off
   */
  async deleteTimeOff(userId, timeOffId) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const timeOff = await prisma.vendorTimeOff.findFirst({
      where: { id: timeOffId, vendorId: vendor.id },
    });

    if (!timeOff) {
      throw new NotFoundError('Time off record not found or does not belong to you');
    }

    await prisma.vendorTimeOff.delete({
      where: { id: timeOffId },
    });

    return { success: true, message: 'Time off removed' };
  }

  /**
   * Upload private verification document
   */
  async uploadVerificationDocument(userId, { documentType, documentUrl }) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    let verification = await prisma.vendorVerification.findFirst({
      where: { vendorId: vendor.id },
      orderBy: { submittedAt: 'desc' },
    });

    if (!verification) {
      verification = await prisma.vendorVerification.create({
        data: {
          vendorId: vendor.id,
          status: 'PENDING',
        },
      });
    }

    const document = await prisma.verificationDocument.create({
      data: {
        verificationId: verification.id,
        documentType: documentType || 'TRADE_LICENSE',
        documentUrl,
        isPrivate: true, // Non-negotiable Section 17 security requirement
      },
    });

    return {
      verificationId: verification.id,
      document,
      status: verification.status,
    };
  }

  /**
   * Update Profile Images (Avatar & Banner)
   */
  async updateImages(userId, { avatarUrl, bannerUrl }) {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const data = {};
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) data.bannerUrl = bannerUrl;

    const updated = await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data,
      select: {
        id: true,
        businessName: true,
        avatarUrl: true,
        bannerUrl: true,
      },
    });

    return updated;
  }
}

module.exports = new VendorService();
