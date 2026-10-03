const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

jest.mock('../src/utils/prisma', () => {
  return {
    vendorProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    serviceArea: {
      findUnique: jest.fn(),
    },
    searchLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  };
});

describe('Search & Discovery Integration Tests (Blueprint Sections 8, 9, 13)', () => {
  const baseVendor1 = {
    id: 'vendor-1',
    businessName: 'Master Plumber Pros',
    bio: 'Emergency leak repair and pipe fitting specialists',
    phone: '+1-555-0101',
    address: '100 Main St, Brooklyn, NY',
    lat: 40.7128,
    lng: -74.006,
    isVerified: true,
    isAvailable: true,
    ratingAvg: 4.8,
    ratingCount: 35,
    responseTimeAvg: 15,
    isSuspended: false,
    user: { isActive: true },
    vendorServices: [
      {
        id: 'vs-1',
        serviceId: 's-1',
        priceType: 'RANGE',
        priceMin: 80,
        priceMax: 200,
        isAvailable: true,
        service: {
          name: 'Pipe Leak Repair',
          description: 'Fix leaking copper and PVC pipes',
          category: { name: 'Plumbing & Repairs', slug: 'plumbing-pipefitting' },
        },
      },
    ],
    availabilities: [
      { dayOfWeek: 0, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 2, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 3, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 4, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 5, startTime: '00:00', endTime: '23:59', isActive: true },
      { dayOfWeek: 6, startTime: '00:00', endTime: '23:59', isActive: true },
    ],
    timeOffs: [],
    serviceAreas: [{ city: 'Brooklyn', radiusKm: 15 }],
  };

  const baseVendorFarAway = {
    id: 'vendor-far',
    businessName: 'Far Away Electricians',
    bio: 'Electricians 100km away',
    phone: '+1-555-0102',
    address: '500 Far St, Albany, NY',
    lat: 42.6526, // ~220 km north of NYC
    lng: -73.7562,
    isVerified: false,
    isAvailable: true,
    ratingAvg: 4.2,
    ratingCount: 10,
    responseTimeAvg: 45,
    isSuspended: false,
    user: { isActive: true },
    vendorServices: [
      {
        id: 'vs-2',
        serviceId: 's-2',
        priceType: 'FIXED',
        priceMin: 120,
        priceMax: 120,
        isAvailable: true,
        service: {
          name: 'Circuit Breaker Replacement',
          description: 'Panel repair',
          category: { name: 'Electrical', slug: 'electrical-wiring' },
        },
      },
    ],
    availabilities: [],
    timeOffs: [],
    serviceAreas: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Radius & Candidate Filtering', () => {
    it('should exclude vendors outside the specified search radius', async () => {
      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1, baseVendorFarAway]);

      // Search near NYC with 25 km radius
      const res = await request(app).get('/api/v1/search/vendors').query({
        lat: 40.7128,
        lng: -74.006,
        radius: 25,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const vendors = res.body.data.vendors;
      expect(vendors).toHaveLength(1);
      expect(vendors[0].id).toBe('vendor-1');
      expect(vendors[0].distanceKm).toBeLessThanOrEqual(25);
    });

    it('should filter by verified only when verified=true', async () => {
      const unverifiedVendorNearby = {
        ...baseVendor1,
        id: 'vendor-unverified',
        isVerified: false,
      };

      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        verified: 'true',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // All returned vendors must be verified
      res.body.data.vendors.forEach((v) => {
        expect(v.verified).toBe(true);
      });
    });

    it('suspended vendors must NEVER appear in candidate results', async () => {
      // Mock db query ensuring where clause has isSuspended: false
      prisma.vendorProfile.findMany.mockImplementation(({ where }) => {
        expect(where.isSuspended).toBe(false);
        return Promise.resolve([baseVendor1]);
      });

      const res = await request(app).get('/api/v1/search/vendors').query({
        q: 'plumber',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendors[0].id).toBe('vendor-1');
    });

    it('vendors with NO active services must not be returned in search', async () => {
      const vendorNoServices = {
        ...baseVendor1,
        id: 'vendor-no-service',
        vendorServices: [],
      };

      prisma.vendorProfile.findMany.mockResolvedValueOnce([vendorNoServices]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        q: 'leak',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.vendors).toHaveLength(0);
    });
  });

  describe('2. Typo Tolerance & Security Robustness', () => {
    it('should handle typo queries like "plummer" and match plumbers', async () => {
      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        q: 'plummer', // typo!
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendors).toHaveLength(1);
      expect(res.body.data.vendors[0].businessName).toBe('Master Plumber Pros');
    });

    it('should safely handle SQL injection payloads in q without crashing or leaking', async () => {
      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        q: "' OR 1=1; DROP TABLE users; --",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should safely handle extreme queries and radius of 0', async () => {
      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        lat: 40.7128,
        lng: -74.006,
        radius: 0,
        q: 'A'.repeat(500),
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Availability & Schedule Checks', () => {
    it('should return openNow flag and respect available_now filter', async () => {
      const offlineVendor = {
        ...baseVendor1,
        id: 'vendor-offline',
        isAvailable: false, // offline toggle
      };

      prisma.vendorProfile.findMany.mockResolvedValueOnce([baseVendor1, offlineVendor]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        available_now: 'true',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendors).toHaveLength(1);
      expect(res.body.data.vendors[0].id).toBe('vendor-1');
      expect(res.body.data.vendors[0].openNow).toBe(true);
    });

    it('should mark vendor closed if currently inside a time-off period', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      const vendorOnVacation = {
        ...baseVendor1,
        id: 'vendor-vacation',
        timeOffs: [{ startDate: yesterday, endDate: tomorrow, reason: 'Annual holiday' }],
      };

      prisma.vendorProfile.findMany.mockResolvedValueOnce([vendorOnVacation]);

      const res = await request(app).get('/api/v1/search/vendors').query({
        available_now: 'true',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.vendors).toHaveLength(0);
    });
  });

  describe('4. Autocomplete Suggestions API', () => {
    it('GET /api/v1/search/suggestions should return matching services, categories, and vendors', async () => {
      prisma.service.findMany.mockResolvedValueOnce([
        { id: 's-1', name: 'Pipe Leak Repair', slug: 'pipe-leak-repair', category: { name: 'Plumbing' } },
      ]);
      prisma.category.findMany.mockResolvedValueOnce([
        { id: 'c-1', name: 'Plumbing & Repairs', slug: 'plumbing-pipefitting', icon: 'wrench' },
      ]);
      prisma.vendorProfile.findMany.mockResolvedValueOnce([
        { id: 'v-1', businessName: 'Master Plumber Pros', ratingAvg: 4.8, isVerified: true },
      ]);

      const res = await request(app).get('/api/v1/search/suggestions').query({
        q: 'plumb',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestions).toHaveProperty('services');
      expect(res.body.data.suggestions).toHaveProperty('categories');
      expect(res.body.data.suggestions).toHaveProperty('vendors');
      expect(res.body.data.suggestions.services).toHaveLength(1);
    });

    it('should return 422/400 validation error if query param q is empty', async () => {
      const res = await request(app).get('/api/v1/search/suggestions');
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
