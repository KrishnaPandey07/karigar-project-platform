const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');

// Mock Prisma
jest.mock('../src/utils/prisma', () => {
  return {
    user: {
      findUnique: jest.fn(),
    },
    vendorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    vendorService: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    vendorAvailability: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    vendorTimeOff: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    vendorVerification: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    verificationDocument: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
});

describe('Phase 2: Vendor Module & Business Rules Tests', () => {
  const vendorUserId = 'vendor-user-123';
  const vendorProfileId = 'vendor-prof-123';

  const vendorToken = jwt.sign(
    { userId: vendorUserId, email: 'vendor@example.com', role: 'VENDOR' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const customerToken = jwt.sign(
    { userId: 'cust-123', email: 'cust@example.com', role: 'CUSTOMER' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for user lookup during auth middleware
    prisma.user.findUnique.mockResolvedValue({
      id: vendorUserId,
      email: 'vendor@example.com',
      role: 'VENDOR',
      isActive: true,
      isVerified: true,
      vendorProfile: { id: vendorProfileId, businessName: 'Apex Spark Electricians' },
    });
  });

  describe('RBAC Role Guard', () => {
    it('should forbid CUSTOMER from accessing vendor private endpoints', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'cust-123',
        email: 'cust@example.com',
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true,
      });

      const res = await request(app)
        .get('/api/v1/vendors/me/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/vendors/me/profile & Completeness Calculation', () => {
    it('should return vendor profile with calculated profile_completeness score', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: vendorProfileId,
        userId: vendorUserId,
        businessName: 'Apex Spark Electricians',
        bio: 'Licensed master electrician with 15 years experience in wiring, repairs, and diagnostics.',
        phone: '+1-555-0199',
        address: '124 Main St, Brooklyn, NY',
        lat: 40.6928,
        lng: -73.9903,
        isVerified: true,
        isAvailable: true,
        responseTimeAvg: 20,
        ratingAvg: 4.8,
        ratingCount: 15,
        avatarUrl: 'https://example.com/avatar.jpg',
        vendorServices: [
          { id: 'vs-1', priceMin: 50, priceMax: 150, priceType: 'RANGE' },
        ],
        availabilities: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
        ],
        verifications: [
          { status: 'APPROVED', documents: [{ id: 'doc-1' }] },
        ],
        timeOffs: [],
      });

      const res = await request(app)
        .get('/api/v1/vendors/me/profile')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendor).toHaveProperty('completeness');
      expect(res.body.data.vendor.completeness.score).toBe(100);
      expect(res.body.data.vendor.completeness.isComplete).toBe(true);
      expect(res.body.data.vendor.completeness.missingFields).toHaveLength(0);
    });

    it('should compute partial completeness and list missing fields when profile is incomplete', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: vendorProfileId,
        userId: vendorUserId,
        businessName: 'New Vendor',
        bio: null, // missing bio
        phone: '+1-555-0199',
        address: '123 Test St',
        lat: 40.7,
        lng: -74.0,
        avatarUrl: null, // missing avatar
        vendorServices: [], // no services
        availabilities: [], // no schedule
        verifications: [], // no docs
        timeOffs: [],
      });

      const res = await request(app)
        .get('/api/v1/vendors/me/profile')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vendor.completeness.score).toBeLessThan(100);
      expect(res.body.data.vendor.completeness.missingFields.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/v1/vendors/me/availability (Toggle Availability)', () => {
    it('should toggle vendor availability status immediately', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({ id: vendorProfileId });
      prisma.vendorProfile.update.mockResolvedValueOnce({
        id: vendorProfileId,
        businessName: 'Apex Spark Electricians',
        isAvailable: false,
      });

      const res = await request(app)
        .patch('/api/v1/vendors/me/availability')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
    });
  });

  describe('POST /api/v1/vendors/me/services (Services & Pricing Constraints)', () => {
    it('should reject service pricing when priceMax is less than priceMin', async () => {
      const res = await request(app)
        .post('/api/v1/vendors/me/services')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          serviceId: 'b7b25867-68b1-4eb2-a185-8f6b21659a85',
          priceType: 'RANGE',
          priceMin: 200,
          priceMax: 100, // Invalid: priceMax < priceMin
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully add/update service when priceMax >= priceMin', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({ id: vendorProfileId });
      prisma.service.findUnique.mockResolvedValueOnce({ id: 'b7b25867-68b1-4eb2-a185-8f6b21659a85' });
      prisma.vendorService.upsert.mockResolvedValueOnce({
        id: 'vs-1',
        vendorId: vendorProfileId,
        serviceId: 'b7b25867-68b1-4eb2-a185-8f6b21659a85',
        priceType: 'RANGE',
        priceMin: 100,
        priceMax: 250,
      });

      const res = await request(app)
        .post('/api/v1/vendors/me/services')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          serviceId: 'b7b25867-68b1-4eb2-a185-8f6b21659a85',
          priceType: 'RANGE',
          priceMin: 100,
          priceMax: 250,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.priceMin).toBe(100);
    });
  });

  describe('PUT /api/v1/vendors/me/schedule (Weekly Availability with Overlap Validation)', () => {
    it('should reject overlapping intervals on the same day', async () => {
      const res = await request(app)
        .put('/api/v1/vendors/me/schedule')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          schedule: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', isActive: true },
            { dayOfWeek: 1, startTime: '13:00', endTime: '18:00', isActive: true }, // Overlap: 13:00 < 14:00
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject endTime before or equal to startTime', async () => {
      const res = await request(app)
        .put('/api/v1/vendors/me/schedule')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          schedule: [
            { dayOfWeek: 2, startTime: '17:00', endTime: '09:00', isActive: true },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid non-overlapping schedule', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({ id: vendorProfileId });
      prisma.$transaction.mockResolvedValueOnce([]);
      prisma.vendorAvailability.findMany.mockResolvedValueOnce([
        { id: 'va-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isActive: true },
        { id: 'va-2', dayOfWeek: 1, startTime: '13:00', endTime: '18:00', isActive: true },
      ]);

      const res = await request(app)
        .put('/api/v1/vendors/me/schedule')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          schedule: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isActive: true },
            { dayOfWeek: 1, startTime: '13:00', endTime: '18:00', isActive: true },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilities).toHaveLength(2);
    });
  });

  describe('POST /api/v1/vendors/me/time-off (Time Off with Overlap Validation)', () => {
    it('should return 409 CONFLICT if time off overlaps with existing period', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({ id: vendorProfileId });
      // Mock existing overlapping time off
      prisma.vendorTimeOff.findFirst.mockResolvedValueOnce({
        id: 'to-1',
        startDate: new Date('2026-10-10T00:00:00Z'),
        endDate: new Date('2026-10-15T00:00:00Z'),
      });

      const res = await request(app)
        .post('/api/v1/vendors/me/time-off')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          startDate: '2026-10-12T00:00:00Z',
          endDate: '2026-10-18T00:00:00Z',
          reason: 'Vacation',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should successfully add time off when there is no overlap', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({ id: vendorProfileId });
      prisma.vendorTimeOff.findFirst.mockResolvedValueOnce(null); // No overlap
      prisma.vendorTimeOff.create.mockResolvedValueOnce({
        id: 'to-2',
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-05T00:00:00Z'),
        reason: 'Holiday',
      });

      const res = await request(app)
        .post('/api/v1/vendors/me/time-off')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          startDate: '2026-11-01T00:00:00Z',
          endDate: '2026-11-05T00:00:00Z',
          reason: 'Holiday',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timeOff.reason).toBe('Holiday');
    });
  });
});
