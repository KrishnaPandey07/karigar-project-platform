const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');

jest.mock('../src/utils/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    vendorProfile: {
      update: jest.fn(),
    },
    serviceRequest: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    review: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    vendorVerification: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    report: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    adminAuditLog: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    },
  };

  mockPrisma.$transaction = jest.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma);
    }
    return Promise.all(callback);
  });

  return mockPrisma;
});

describe('Phase 7: Admin Console & Platform Operations', () => {
  const adminUserId = 'admin-user-1';
  const otherAdminId = 'admin-user-2';
  const customerUserId = 'cust-user-1';
  const vendorUserId = 'vendor-user-1';

  const adminToken = jwt.sign(
    { userId: adminUserId, email: 'admin@locallink.com', role: 'ADMIN' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

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

    prisma.$transaction.mockImplementation((callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.all(callback);
    });

    // Default authenticate mock
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === adminUserId) {
        return Promise.resolve({
          id: adminUserId,
          email: 'admin@locallink.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          isActive: true,
          isVerified: true,
        });
      }
      if (where.id === customerUserId) {
        return Promise.resolve({
          id: customerUserId,
          email: 'customer@example.com',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          isActive: true,
          isVerified: true,
        });
      }
      if (where.id === vendorUserId) {
        return Promise.resolve({
          id: vendorUserId,
          email: 'vendor@example.com',
          role: 'VENDOR',
          status: 'ACTIVE',
          isActive: true,
          isVerified: true,
          vendorProfile: { id: 'vp-1', isSuspended: false },
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('1. Role-Based Access Control (RBAC)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/metrics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('forbids CUSTOMER role from accessing admin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('forbids VENDOR role from accessing admin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows ADMIN role to access admin endpoints with 200', async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.serviceRequest.count.mockResolvedValue(25);
      prisma.serviceRequest.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { id: 15 } },
        { status: 'IN_PROGRESS', _count: { id: 10 } },
      ]);
      prisma.review.count.mockResolvedValue(12);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.8 } });
      prisma.vendorVerification.count.mockResolvedValue(2);
      prisma.report.count.mockResolvedValue(1);
      prisma.adminAuditLog.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBe(10);
      expect(res.body.data.reviews.avgRating).toBe(4.8);
      expect(res.body.data.requests.byStatus.COMPLETED).toBe(15);
    });
  });

  describe('2. User Management & Suspension Safeguards', () => {
    it('lists users with pagination envelope', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([
        {
          id: customerUserId,
          email: 'customer@example.com',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          isActive: true,
          createdAt: new Date(),
          customerProfile: { fullName: 'Alice' },
          vendorProfile: null,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/users?role=CUSTOMER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('forbids admin from suspending their own account (returns 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Self test' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot alter their own account/i);
    });

    it('forbids suspending the last active administrator (returns 409 Conflict)', async () => {
      // Mock finding the target admin user
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === adminUserId) {
          return Promise.resolve({
            id: adminUserId,
            email: 'admin@locallink.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            isActive: true,
          });
        }
        if (where.id === otherAdminId) {
          return Promise.resolve({
            id: otherAdminId,
            email: 'admin2@locallink.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            isActive: true,
          });
        }
        return Promise.resolve(null);
      });

      // No other active admins exist
      prisma.user.count.mockResolvedValue(0);

      const res = await request(app)
        .patch(`/api/v1/admin/users/${otherAdminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Attempting to suspend lone admin' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/only remaining active administrator/i);
    });

    it('successfully suspends a vendor, syncs vendorProfile.isSuspended, and writes audit log', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === adminUserId) {
          return Promise.resolve({
            id: adminUserId,
            email: 'admin@locallink.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            isActive: true,
          });
        }
        if (where.id === vendorUserId) {
          return Promise.resolve({
            id: vendorUserId,
            email: 'vendor@example.com',
            role: 'VENDOR',
            status: 'ACTIVE',
            isActive: true,
            vendorProfile: { id: 'vp-1', isSuspended: false },
          });
        }
        return Promise.resolve(null);
      });

      prisma.user.update.mockResolvedValue({
        id: vendorUserId,
        email: 'vendor@example.com',
        role: 'VENDOR',
        status: 'SUSPENDED',
        isActive: false,
      });

      prisma.vendorProfile.update.mockResolvedValue({
        id: 'vp-1',
        isSuspended: true,
      });

      prisma.adminAuditLog.create.mockResolvedValue({ id: 'log-1' });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${vendorUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Unethical practices reported' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'vp-1' },
        data: { isSuspended: true },
      });
      expect(prisma.adminAuditLog.create).toHaveBeenCalled();
    });

    it('successfully reactivates/unsuspends a user', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === adminUserId) {
          return Promise.resolve({
            id: adminUserId,
            email: 'admin@locallink.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            isActive: true,
          });
        }
        if (where.id === customerUserId) {
          return Promise.resolve({
            id: customerUserId,
            email: 'customer@example.com',
            role: 'CUSTOMER',
            status: 'SUSPENDED',
            isActive: false,
          });
        }
        return Promise.resolve(null);
      });

      prisma.user.update.mockResolvedValue({
        id: customerUserId,
        email: 'customer@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isActive: true,
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_UNSUSPEND',
            targetType: 'USER',
            targetId: customerUserId,
          }),
        })
      );
    });
  });

  describe('3. Vendor Verification Queue', () => {
    it('lists vendor verifications with pagination', async () => {
      prisma.vendorVerification.count.mockResolvedValue(1);
      prisma.vendorVerification.findMany.mockResolvedValue([
        {
          id: 'verif-1',
          vendorId: 'vp-1',
          status: 'PENDING',
          submittedAt: new Date(),
          vendor: { businessName: 'Apex Plumbers', phone: '123' },
          documents: [{ id: 'doc-1', documentType: 'LICENSE', documentUrl: 'url' }],
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/verifications?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.verifications).toHaveLength(1);
    });

    it('approves a vendor verification: sets verified badge and logs audit', async () => {
      prisma.vendorVerification.findUnique.mockResolvedValue({
        id: 'verif-1',
        vendorId: 'vp-1',
        status: 'PENDING',
        vendor: {
          id: 'vp-1',
          userId: vendorUserId,
          user: { id: vendorUserId },
        },
      });

      prisma.vendorVerification.update.mockResolvedValue({
        id: 'verif-1',
        status: 'APPROVED',
      });
      prisma.vendorProfile.update.mockResolvedValue({ id: 'vp-1', isVerified: true });
      prisma.user.update.mockResolvedValue({ id: vendorUserId, isVerified: true });
      prisma.adminAuditLog.create.mockResolvedValue({ id: 'log-1' });

      const res = await request(app)
        .patch('/api/v1/admin/verifications/verif-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'APPROVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'vp-1' },
        data: { isVerified: true },
      });
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'VENDOR_VERIFY_APPROVE',
            targetType: 'VENDOR',
          }),
        })
      );
    });

    it('rejects a vendor verification: requires rejection reason (returns 422)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/verifications/verif-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'REJECT' });

      expect(res.status).toBe(422);
      expect(res.body.error.details?.[0]?.message).toMatch(/rejection reason is required/i);
    });

    it('successfully rejects a vendor verification with reason', async () => {
      prisma.vendorVerification.findUnique.mockResolvedValue({
        id: 'verif-1',
        vendorId: 'vp-1',
        status: 'PENDING',
        vendor: {
          id: 'vp-1',
          userId: vendorUserId,
          user: { id: vendorUserId },
        },
      });

      prisma.vendorVerification.update.mockResolvedValue({
        id: 'verif-1',
        status: 'REJECTED',
        rejectionReason: 'Blurry document image',
      });
      prisma.vendorProfile.update.mockResolvedValue({ id: 'vp-1', isVerified: false });
      prisma.adminAuditLog.create.mockResolvedValue({ id: 'log-2' });

      const res = await request(app)
        .patch('/api/v1/admin/verifications/verif-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'REJECT', rejectionReason: 'Blurry document image' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'VENDOR_VERIFY_REJECT',
            targetType: 'VENDOR',
          }),
        })
      );
    });
  });

  describe('4. Reports & Dispute Moderation', () => {
    it('lists user reports with filtering and pagination', async () => {
      prisma.report.count.mockResolvedValue(1);
      prisma.report.findMany.mockResolvedValue([
        {
          id: 'rep-1',
          reason: 'No-show for job',
          status: 'PENDING',
          reporter: { email: 'alice@example.com' },
          reportedUser: { email: 'bob@example.com' },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/reports?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reports).toHaveLength(1);
    });

    it('resolves a report with notes and logs audit record', async () => {
      prisma.report.findUnique.mockResolvedValue({
        id: 'rep-1',
        status: 'PENDING',
      });
      prisma.report.update.mockResolvedValue({
        id: 'rep-1',
        status: 'RESOLVED',
        resolutionNotes: 'Warned the user and refunded fee.',
      });
      prisma.adminAuditLog.create.mockResolvedValue({ id: 'log-3' });

      const res = await request(app)
        .patch('/api/v1/admin/reports/rep-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNotes: 'Warned the user and refunded fee.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REPORT_RESOLVE',
            targetType: 'REPORT',
            targetId: 'rep-1',
          }),
        })
      );
    });

    it('dismisses an unfounded report', async () => {
      prisma.report.findUnique.mockResolvedValue({
        id: 'rep-2',
        status: 'PENDING',
      });
      prisma.report.update.mockResolvedValue({
        id: 'rep-2',
        status: 'DISMISSED',
      });
      prisma.adminAuditLog.create.mockResolvedValue({ id: 'log-4' });

      const res = await request(app)
        .patch('/api/v1/admin/reports/rep-2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'DISMISSED',
          resolutionNotes: 'False report; evidence refuted.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REPORT_DISMISS',
            targetType: 'REPORT',
            targetId: 'rep-2',
          }),
        })
      );
    });
  });

  describe('5. Platform Audit Logs', () => {
    it('retrieves paginated audit log entries', async () => {
      prisma.adminAuditLog.count.mockResolvedValue(1);
      prisma.adminAuditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'USER_SUSPEND',
          targetType: 'USER',
          targetId: 'user-xyz',
          admin: { email: 'admin@locallink.com' },
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.logs[0].action).toBe('USER_SUSPEND');
    });
  });
});
