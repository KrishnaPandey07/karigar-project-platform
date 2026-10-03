const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');

jest.mock('../src/utils/prisma', () => {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customerProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    vendorProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    serviceRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    serviceArea: {
      findMany: jest.fn(),
    },
    vendorService: {
      findMany: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(require('../src/utils/prisma'));
      }
      return Promise.all(callback);
    }),
  };
});

describe('Phase 3: Customer Module & Blueprint Endpoints Tests', () => {
  const customerUserId = 'cust-user-123';
  const customerProfileId = 'cust-prof-123';
  const vendorUserId = 'vendor-user-123';
  const vendorProfileId = 'vendor-prof-123';

  const customerToken = jwt.sign(
    { userId: customerUserId, email: 'customer@example.com', role: 'CUSTOMER' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const vendorToken = jwt.sign(
    { userId: vendorUserId, email: 'vendor@example.com', role: 'VENDOR' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Default customer auth lookup
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === customerUserId) {
        return Promise.resolve({
          id: customerUserId,
          email: 'customer@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          passwordHash: '$2a$10$hashedPasswordHere123',
          customerProfile: { id: customerProfileId, fullName: 'Alice Johnson' },
        });
      }
      if (where.id === vendorUserId) {
        return Promise.resolve({
          id: vendorUserId,
          email: 'vendor@example.com',
          role: 'VENDOR',
          isActive: true,
          isVerified: true,
          vendorProfile: { id: vendorProfileId, businessName: 'Apex Spark Electricians' },
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('1. Favorites Module & RBAC Protection', () => {
    it('should reject unauthenticated guest request to /favorites with 401', async () => {
      const res = await request(app).get('/api/v1/favorites');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject VENDOR user from accessing /favorites with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 409 CONFLICT if vendor is already favorited by the customer', async () => {
      prisma.customerProfile.findUnique.mockResolvedValueOnce({ id: customerProfileId });
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: vendorProfileId,
        businessName: 'Apex Spark Electricians',
        isSuspended: false,
        user: { isActive: true },
      });

      // Mock duplicate favorite exists
      prisma.favorite.findUnique.mockResolvedValueOnce({
        id: 'fav-1',
        customerId: customerProfileId,
        vendorId: vendorProfileId,
      });

      const res = await request(app)
        .post(`/api/v1/favorites/${vendorProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should successfully add vendor to favorites for CUSTOMER', async () => {
      prisma.customerProfile.findUnique.mockResolvedValueOnce({ id: customerProfileId });
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: vendorProfileId,
        businessName: 'Apex Spark Electricians',
        isSuspended: false,
        user: { isActive: true },
      });
      prisma.favorite.findUnique.mockResolvedValueOnce(null); // not favorited yet
      prisma.favorite.create.mockResolvedValueOnce({
        id: 'fav-1',
        customerId: customerProfileId,
        vendorId: vendorProfileId,
        vendor: { id: vendorProfileId, businessName: 'Apex Spark Electricians' },
      });

      const res = await request(app)
        .post(`/api/v1/favorites/${vendorProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('favorite');
    });

    it('a favorited vendor that gets suspended disappears from the list', async () => {
      prisma.customerProfile.findUnique.mockResolvedValueOnce({ id: customerProfileId });
      // When prisma.favorite.findMany is called with isSuspended: false, no suspended rows return
      prisma.favorite.findMany.mockImplementation(({ where }) => {
        expect(where.vendor.isSuspended).toBe(false);
        // Returns empty list because the favorited pro was suspended
        return Promise.resolve([]);
      });

      const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.favorites).toHaveLength(0);
    });
  });

  describe('2. Users Self-Service & Soft Delete Conflict', () => {
    it('should reject password change with 401 when old password is incorrect', async () => {
      const realPasswordHash = await bcrypt.hash('CorrectOldPassword123!', 10);
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === customerUserId) {
          return Promise.resolve({
            id: customerUserId,
            email: 'customer@example.com',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
            passwordHash: realPasswordHash,
            customerProfile: { id: customerProfileId, fullName: 'Alice Johnson' },
          });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          oldPassword: 'WrongOldPassword!',
          newPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should successfully change password when old password is correct', async () => {
      const realPasswordHash = await bcrypt.hash('CorrectOldPassword123!', 10);
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === customerUserId) {
          return Promise.resolve({
            id: customerUserId,
            email: 'customer@example.com',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
            passwordHash: realPasswordHash,
            customerProfile: { id: customerProfileId, fullName: 'Alice Johnson' },
          });
        }
        return Promise.resolve(null);
      });
      prisma.user.update.mockResolvedValueOnce({ id: customerUserId });
      prisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          oldPassword: 'CorrectOldPassword123!',
          newPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/updated successfully/i);
    });

    it('should return 409 CONFLICT on DELETE /users/me if user has active service requests', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === customerUserId) {
          return Promise.resolve({
            id: customerUserId,
            email: 'customer@example.com',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
            customerProfile: { id: customerProfileId, fullName: 'Alice Johnson' },
            vendorProfile: null,
          });
        }
        return Promise.resolve(null);
      });

      // Mock an active service request in progress
      prisma.serviceRequest.findFirst.mockResolvedValueOnce({
        id: 'req-active-99',
        status: 'IN_PROGRESS',
      });

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/active service requests/i);
    });

    it('should soft-delete user account when there are no active service requests', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === customerUserId) {
          return Promise.resolve({
            id: customerUserId,
            email: 'customer@example.com',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
            customerProfile: { id: customerProfileId, fullName: 'Alice Johnson' },
            vendorProfile: null,
          });
        }
        return Promise.resolve(null);
      });
      prisma.serviceRequest.findFirst.mockResolvedValueOnce(null); // No active requests
      prisma.user.update.mockResolvedValueOnce({ id: customerUserId, isActive: false, status: 'DELETED' });
      prisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/deactivated successfully/i);
    });
  });

  describe('3. Public Catalog & 404 for Suspended Vendor', () => {
    it('should return 404 for a suspended vendor on GET /api/v1/vendors/:id', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: 'suspended-vendor-id',
        isSuspended: true, // Suspended!
        user: { isActive: true },
      });

      const res = await request(app).get('/api/v1/vendors/suspended-vendor-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return public vendor profile with ratings and services for active vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValueOnce({
        id: vendorProfileId,
        businessName: 'Apex Spark Electricians',
        bio: 'Expert electrician',
        phone: '+1-555-0199',
        address: '124 Main St, Brooklyn, NY',
        lat: 40.6928,
        lng: -73.9903,
        isVerified: true,
        isAvailable: true,
        responseTimeAvg: 15,
        ratingAvg: 4.9,
        ratingCount: 42,
        isSuspended: false,
        profileViews: 10,
        galleryUrls: ['https://example.com/work1.jpg'],
        user: { isActive: true },
        vendorServices: [
          {
            id: 'vs-1',
            serviceId: 's-1',
            priceType: 'RANGE',
            priceMin: 50,
            priceMax: 150,
            service: { name: 'Ceiling Fan Installation', category: { name: 'Electrical', slug: 'electrical' } },
          },
        ],
        serviceAreas: [{ id: 'sa-1', city: 'Brooklyn', radiusKm: 15 }],
        availabilities: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }],
      });
      prisma.vendorProfile.update.mockResolvedValueOnce({ id: vendorProfileId });

      const res = await request(app).get(`/api/v1/vendors/${vendorProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendor.businessName).toBe('Apex Spark Electricians');
      expect(res.body.data.vendor).toHaveProperty('avg_rating', 4.9);
      expect(res.body.data.vendor).toHaveProperty('gallery');
      expect(res.body.data.vendor).toHaveProperty('hours');
    });

    it('GET /api/v1/categories should return categories with active vendor counts', async () => {
      prisma.category.findMany.mockResolvedValueOnce([
        {
          id: 'cat-1',
          name: 'Electrical & Wiring',
          slug: 'electrical-wiring',
          icon: 'zap',
          description: 'Wiring and fixtures',
          services: [{ id: 's-1' }, { id: 's-2' }],
        },
      ]);

      prisma.vendorService.findMany.mockResolvedValueOnce([
        { vendorId: 'v-1' },
        { vendorId: 'v-2' },
      ]);

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toHaveLength(1);
      expect(res.body.data.categories[0]).toHaveProperty('vendorCount', 2);
    });

    it('GET /api/v1/locations should return list of service areas', async () => {
      prisma.serviceArea.findMany.mockResolvedValueOnce([
        { id: 'sa-1', city: 'Brooklyn', postalCode: '11201', radiusKm: 15 },
        { id: 'sa-2', city: 'Manhattan', postalCode: '10001', radiusKm: 12 },
      ]);

      const res = await request(app).get('/api/v1/locations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.locations).toHaveLength(2);
    });
  });
});
