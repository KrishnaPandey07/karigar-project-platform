const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');
const { REQUEST_STATUS } = require('../src/modules/requests/transitions');

jest.mock('../src/utils/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    customerProfile: {
      findUnique: jest.fn(),
    },
    vendorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    requestStatusHistory: {
      create: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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

describe('Phase 6: Reviews, Moderation & Notifications', () => {
  const customerUserId = 'cust-user-6';
  const customerProfileId = 'cust-prof-6';

  const vendorUserId = 'vendor-user-6';
  const vendorProfileId = 'vendor-prof-6';

  const otherUserId = 'other-user-6';
  const otherCustomerProfileId = 'other-cust-prof-6';

  const customerToken = jwt.sign(
    { userId: customerUserId, email: 'customer6@example.com', role: 'CUSTOMER' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const vendorToken = jwt.sign(
    { userId: vendorUserId, email: 'vendor6@example.com', role: 'VENDOR' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const otherToken = jwt.sign(
    { userId: otherUserId, email: 'other6@example.com', role: 'CUSTOMER' },
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

    // Default auth lookups
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === customerUserId) {
        return Promise.resolve({
          id: customerUserId,
          email: 'customer6@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: customerProfileId, fullName: 'Sarah Connor' },
        });
      }
      if (where.id === vendorUserId) {
        return Promise.resolve({
          id: vendorUserId,
          email: 'vendor6@example.com',
          role: 'VENDOR',
          isActive: true,
          isVerified: true,
          vendorProfile: { id: vendorProfileId, businessName: 'Cyberdyne Repairs' },
        });
      }
      if (where.id === otherUserId) {
        return Promise.resolve({
          id: otherUserId,
          email: 'other6@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: otherCustomerProfileId, fullName: 'John Connor' },
        });
      }
      return Promise.resolve(null);
    });

    prisma.customerProfile.findUnique.mockImplementation(({ where }) => {
      if (where.userId === customerUserId) {
        return Promise.resolve({
          id: customerProfileId,
          userId: customerUserId,
          fullName: 'Sarah Connor',
        });
      }
      if (where.userId === otherUserId) {
        return Promise.resolve({
          id: otherCustomerProfileId,
          userId: otherUserId,
          fullName: 'John Connor',
        });
      }
      return Promise.resolve(null);
    });

    prisma.vendorProfile.findUnique.mockImplementation(({ where }) => {
      if (where.userId === vendorUserId || where.id === vendorProfileId) {
        return Promise.resolve({
          id: vendorProfileId,
          userId: vendorUserId,
          businessName: 'Cyberdyne Repairs',
          avgRating: 4.5,
          reviewCount: 2,
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('1. Reviews Module', () => {
    describe('POST /api/v1/reviews', () => {
      const validReviewPayload = {
        request_id: 'req-completed-1',
        rating: 5,
        comment: 'Outstanding and punctual service!',
      };

      it('forbids vendors from submitting customer reviews (returns 403)', async () => {
        const res = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send(validReviewPayload);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('rejects review if service request is NOT in COMPLETED status (returns 400)', async () => {
        prisma.serviceRequest.findUnique.mockResolvedValueOnce({
          id: 'req-completed-1',
          customerId: customerProfileId,
          vendorId: vendorProfileId,
          status: REQUEST_STATUS.IN_PROGRESS, // Not completed
          review: null,
        });

        const res = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(validReviewPayload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('BAD_REQUEST');
      });

      it('rejects review if customer is not the party who requested the service (returns 403)', async () => {
        prisma.serviceRequest.findUnique.mockResolvedValueOnce({
          id: 'req-completed-1',
          customerId: otherCustomerProfileId, // belongs to someone else
          vendorId: vendorProfileId,
          status: REQUEST_STATUS.COMPLETED,
          review: null,
        });

        const res = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(validReviewPayload);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
      });

      it('rejects duplicate review on the same request with 409 CONFLICT', async () => {
        prisma.serviceRequest.findUnique.mockResolvedValueOnce({
          id: 'req-completed-1',
          customerId: customerProfileId,
          vendorId: vendorProfileId,
          status: REQUEST_STATUS.COMPLETED,
          review: { id: 'existing-rev-1' }, // Already reviewed
        });

        const res = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(validReviewPayload);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('CONFLICT');
      });

      it('successfully creates review, transitions status to REVIEWED, writes audit history, and updates vendor rating stats', async () => {
        prisma.serviceRequest.findUnique.mockResolvedValueOnce({
          id: 'req-completed-1',
          customerId: customerProfileId,
          vendorId: vendorProfileId,
          status: REQUEST_STATUS.COMPLETED,
          review: null,
          vendor: { userId: vendorUserId, businessName: 'Cyberdyne Repairs' },
        });

        const createdReviewMock = {
          id: 'rev-new-1',
          requestId: 'req-completed-1',
          customerId: customerProfileId,
          vendorId: vendorProfileId,
          rating: 5,
          comment: validReviewPayload.comment,
          createdAt: new Date(),
          customer: { id: customerProfileId, fullName: 'Sarah Connor' },
          vendor: { id: vendorProfileId, businessName: 'Cyberdyne Repairs' },
        };

        prisma.review.create.mockResolvedValueOnce(createdReviewMock);
        prisma.serviceRequest.update.mockResolvedValueOnce({ id: 'req-completed-1', status: REQUEST_STATUS.REVIEWED });
        prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-rev-1' });

        // Vendor rating recalculation: 2 previous reviews (4, 5) + new (5) => sum 14 / 3 = 4.7
        prisma.review.findMany.mockResolvedValueOnce([
          { rating: 4 },
          { rating: 5 },
          { rating: 5 },
        ]);
        prisma.vendorProfile.update.mockResolvedValueOnce({ id: vendorProfileId });

        const res = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(validReviewPayload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.review.id).toBe('rev-new-1');

        // Check request status transition to REVIEWED
        expect(prisma.serviceRequest.update).toHaveBeenCalledWith({
          where: { id: 'req-completed-1' },
          data: { status: REQUEST_STATUS.REVIEWED },
        });

        // Check request status history
        expect(prisma.requestStatusHistory.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              requestId: 'req-completed-1',
              fromStatus: REQUEST_STATUS.COMPLETED,
              toStatus: REQUEST_STATUS.REVIEWED,
            }),
          })
        );

        // Check vendor aggregations
        expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
          where: { id: vendorProfileId },
          data: {
            avgRating: 4.7,
            reviewCount: 3,
          },
        });
      });
    });

    describe('GET /api/v1/reviews/vendor/:vendorId', () => {
      it('returns paginated public reviews for a vendor', async () => {
        prisma.vendorProfile.findUnique.mockResolvedValueOnce({
          id: vendorProfileId,
          businessName: 'Cyberdyne Repairs',
          avgRating: 4.7,
          reviewCount: 3,
        });

        prisma.review.count.mockResolvedValueOnce(1);
        prisma.review.findMany.mockResolvedValueOnce([
          {
            id: 'rev-1',
            rating: 5,
            comment: 'Great job!',
            customer: { fullName: 'Sarah Connor' },
            createdAt: new Date(),
          },
        ]);

        const res = await request(app)
          .get(`/api/v1/reviews/vendor/${vendorProfileId}?page=1&limit=10&sort=recent`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reviews).toHaveLength(1);
        expect(res.body.meta.total).toBe(1);
      });
    });

    describe('POST /api/v1/reviews/:id/reply (Vendor One-Time Reply)', () => {
      it('allows vendor owner to submit a reply to a review', async () => {
        prisma.review.findUnique.mockResolvedValueOnce({
          id: 'rev-1',
          vendorId: vendorProfileId,
          vendorReply: null,
          vendor: { id: vendorProfileId, userId: vendorUserId, businessName: 'Cyberdyne Repairs' },
          customer: { userId: customerUserId },
        });

        prisma.review.update.mockResolvedValueOnce({
          id: 'rev-1',
          vendorReply: 'Thank you Sarah for the kind words!',
          vendorRepliedAt: new Date(),
          customer: { fullName: 'Sarah Connor' },
        });

        const res = await request(app)
          .post('/api/v1/reviews/rev-1/reply')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send({ reply: 'Thank you Sarah for the kind words!' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.review.vendorReply).toBe('Thank you Sarah for the kind words!');
      });

      it('rejects second reply if vendor has already replied (one-time reply rule returns 400)', async () => {
        prisma.review.findUnique.mockResolvedValueOnce({
          id: 'rev-1',
          vendorId: vendorProfileId,
          vendorReply: 'Already replied previously', // Already has reply
          vendor: { id: vendorProfileId, userId: vendorUserId, businessName: 'Cyberdyne Repairs' },
          customer: { userId: customerUserId },
        });

        const res = await request(app)
          .post('/api/v1/reviews/rev-1/reply')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send({ reply: 'Another reply attempt' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('forbids unauthorized vendors from replying to someone else reviews (returns 403)', async () => {
        prisma.review.findUnique.mockResolvedValueOnce({
          id: 'rev-1',
          vendorId: 'some-other-vendor-id',
          vendorReply: null,
          vendor: { id: 'some-other-vendor-id', userId: 'different-vendor-user' },
        });

        const res = await request(app)
          .post('/api/v1/reviews/rev-1/reply')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send({ reply: 'Unauthorized reply' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('GET /api/v1/reviews/pending', () => {
      it('returns completed requests awaiting customer review', async () => {
        prisma.serviceRequest.findMany.mockResolvedValueOnce([
          {
            id: 'req-completed-unreviewed',
            status: REQUEST_STATUS.COMPLETED,
            service: { name: 'AC Service' },
            vendor: { businessName: 'Cooling Pros' },
          },
        ]);

        const res = await request(app)
          .get('/api/v1/reviews/pending')
          .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pending).toHaveLength(1);
      });
    });
  });

  describe('2. Notifications Module', () => {
    it('lists user notifications with unreadCount', async () => {
      prisma.notification.count
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1); // unreadCount

      prisma.notification.findMany.mockResolvedValueOnce([
        { id: 'notif-1', title: 'Work Started', body: 'Vendor started work', isRead: false },
        { id: 'notif-2', title: 'Request Accepted', body: 'Vendor accepted request', isRead: true },
      ]);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('marks a single notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce({
        id: 'notif-1',
        userId: customerUserId,
        isRead: false,
      });

      prisma.notification.update.mockResolvedValueOnce({
        id: 'notif-1',
        userId: customerUserId,
        isRead: true,
      });

      const res = await request(app)
        .patch('/api/v1/notifications/notif-1/read')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.isRead).toBe(true);
    });

    it('forbids marking another user notification as read (returns 403)', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce({
        id: 'notif-1',
        userId: otherUserId, // Other user
        isRead: false,
      });

      const res = await request(app)
        .patch('/api/v1/notifications/notif-1/read')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('marks all notifications as read for current user', async () => {
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 4 });

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(4);
    });
  });

  describe('3. Reports Module', () => {
    it('creates a report against another user', async () => {
      prisma.report.create.mockResolvedValueOnce({
        id: 'rep-1',
        reporterId: customerUserId,
        reportedUserId: vendorUserId,
        reason: 'Unprofessional behavior',
        details: 'Showed up 3 hours late without notice.',
        status: 'PENDING',
        reportedUser: { id: vendorUserId },
      });

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reported_user_id: vendorUserId,
          reason: 'Unprofessional behavior',
          details: 'Showed up 3 hours late without notice.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.reason).toBe('Unprofessional behavior');
    });

    it('rejects filing a report against oneself with 400 BAD_REQUEST', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reported_user_id: customerUserId, // Self
          reason: 'I am reporting myself',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/cannot file a report against yourself/i);
    });

    it('lists reports filed by the authenticated user', async () => {
      prisma.report.findMany.mockResolvedValueOnce([
        {
          id: 'rep-1',
          reason: 'No show',
          status: 'PENDING',
          reportedUser: { id: vendorUserId },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/reports/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reports).toHaveLength(1);
    });
  });
});
