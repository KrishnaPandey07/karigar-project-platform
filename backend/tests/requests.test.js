const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');
const { runExpireRequestsPass } = require('../src/jobs/expireRequests');
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
    vendorService: {
      findUnique: jest.fn(),
    },
    serviceRequest: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    requestStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    requestComment: {
      create: jest.fn(),
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

describe('Phase 5: Service Requests & Concurrency State Machine', () => {
  const customerUserId = 'cust-user-1';
  const customerProfileId = 'cust-prof-1';

  const vendorUserId = 'vendor-user-1';
  const vendorProfileId = 'vendor-prof-1';

  const otherUserId = 'other-user-1';
  const otherCustomerProfileId = 'other-cust-prof-1';

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

  const otherToken = jwt.sign(
    { userId: otherUserId, email: 'other@example.com', role: 'CUSTOMER' },
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
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === customerUserId) {
        return Promise.resolve({
          id: customerUserId,
          email: 'customer@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: customerProfileId, fullName: 'Alice Customer' },
        });
      }
      if (where.id === vendorUserId) {
        return Promise.resolve({
          id: vendorUserId,
          email: 'vendor@example.com',
          role: 'VENDOR',
          isActive: true,
          isVerified: true,
          vendorProfile: { id: vendorProfileId, businessName: 'Bob Electrician' },
        });
      }
      if (where.id === otherUserId) {
        return Promise.resolve({
          id: otherUserId,
          email: 'other@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: otherCustomerProfileId, fullName: 'Charlie Customer' },
        });
      }
      return Promise.resolve(null);
    });

    prisma.customerProfile.findUnique.mockImplementation(({ where }) => {
      if (where.userId === customerUserId) {
        return Promise.resolve({
          id: customerProfileId,
          userId: customerUserId,
          fullName: 'Alice Customer',
        });
      }
      if (where.userId === otherUserId) {
        return Promise.resolve({
          id: otherCustomerProfileId,
          userId: otherUserId,
          fullName: 'Charlie Customer',
        });
      }
      return Promise.resolve(null);
    });

    prisma.vendorProfile.findUnique.mockImplementation(({ where }) => {
      if (where.userId === vendorUserId) {
        return Promise.resolve({
          id: vendorProfileId,
          userId: vendorUserId,
          businessName: 'Bob Electrician',
          isAvailable: true,
          isSuspended: false,
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/v1/requests', () => {
    const validPayload = {
      vendor_service_id: 'vs-123',
      description: 'Need electrical repair for kitchen switchboard',
      address: '42 Baker Street, Apt 3B',
      is_urgent: false,
    };

    it('requires customer authentication (returns 401 for guests)', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('forbids vendors from creating requests (returns 403)', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(validPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 422 if description is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vendor_service_id: 'vs-123',
          address: '42 Baker Street',
          description: '', // empty
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 if vendor service is not found', async () => {
      prisma.vendorService.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('returns 400 VENDOR_UNAVAILABLE if vendor is offline or suspended', async () => {
      prisma.vendorService.findUnique.mockResolvedValueOnce({
        id: 'vs-123',
        serviceId: 'svc-1',
        vendor: {
          id: vendorProfileId,
          businessName: 'Bob Electrician',
          isAvailable: false, // offline
          isSuspended: false,
        },
        service: { name: 'Switchboard Repair' },
      });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VENDOR_UNAVAILABLE');
    });

    it('returns 409 DUPLICATE_REQUEST if customer already has an active open request with this vendor', async () => {
      prisma.vendorService.findUnique.mockResolvedValueOnce({
        id: 'vs-123',
        serviceId: 'svc-1',
        vendor: {
          id: vendorProfileId,
          businessName: 'Bob Electrician',
          isAvailable: true,
          isSuspended: false,
        },
        service: { name: 'Switchboard Repair' },
      });

      prisma.serviceRequest.findFirst.mockResolvedValueOnce({
        id: 'req-open-999',
        status: REQUEST_STATUS.REQUESTED,
      });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_REQUEST');
    });

    it('creates request with 24h expiration for standard requests and writes audit history', async () => {
      prisma.vendorService.findUnique.mockResolvedValueOnce({
        id: 'vs-123',
        serviceId: 'svc-1',
        vendor: {
          id: vendorProfileId,
          userId: vendorUserId,
          businessName: 'Bob Electrician',
          isAvailable: true,
          isSuspended: false,
        },
        service: { name: 'Switchboard Repair' },
      });

      prisma.serviceRequest.findFirst.mockResolvedValueOnce(null); // No duplicates

      const createdMock = {
        id: 'req-new-1',
        customerId: customerProfileId,
        vendorId: vendorProfileId,
        serviceId: 'svc-1',
        vendorServiceId: 'vs-123',
        status: REQUEST_STATUS.REQUESTED,
        description: validPayload.description,
        address: validPayload.address,
        isUrgent: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        service: { name: 'Switchboard Repair' },
        vendor: { id: vendorProfileId, businessName: 'Bob Electrician' },
        customer: { id: customerProfileId, fullName: 'Alice Customer' },
      };

      prisma.serviceRequest.create.mockResolvedValueOnce(createdMock);
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-1' });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.id).toBe('req-new-1');
      expect(res.body.data.request.status).toBe(REQUEST_STATUS.REQUESTED);
      expect(prisma.requestStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestId: 'req-new-1',
            toStatus: REQUEST_STATUS.REQUESTED,
          }),
        })
      );
    });

    it('sets 12h expiration for urgent requests', async () => {
      prisma.vendorService.findUnique.mockResolvedValueOnce({
        id: 'vs-123',
        serviceId: 'svc-1',
        vendor: {
          id: vendorProfileId,
          userId: vendorUserId,
          businessName: 'Bob Electrician',
          isAvailable: true,
          isSuspended: false,
        },
        service: { name: 'Switchboard Repair' },
      });

      prisma.serviceRequest.findFirst.mockResolvedValueOnce(null);

      let capturedExpiresAt = null;
      prisma.serviceRequest.create.mockImplementationOnce(({ data }) => {
        capturedExpiresAt = data.expiresAt;
        return Promise.resolve({
          id: 'req-urgent-1',
          ...data,
          service: { name: 'Switchboard Repair' },
          vendor: { id: vendorProfileId, businessName: 'Bob Electrician' },
          customer: { id: customerProfileId, fullName: 'Alice Customer' },
        });
      });
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-1' });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...validPayload, is_urgent: true });

      expect(res.status).toBe(201);
      expect(capturedExpiresAt).not.toBeNull();
      const diffHours = (new Date(capturedExpiresAt) - new Date()) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(12);
    });
  });

  describe('GET /api/v1/requests and GET /api/v1/requests/:id', () => {
    it('lists requests for authenticated customer with pagination envelope', async () => {
      prisma.serviceRequest.count.mockResolvedValueOnce(1);
      prisma.serviceRequest.findMany.mockResolvedValueOnce([
        {
          id: 'req-1',
          status: REQUEST_STATUS.REQUESTED,
          description: 'Fix wiring',
          service: { name: 'Electrical' },
          vendor: { businessName: 'Bob Electrician' },
          customer: { fullName: 'Alice Customer' },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/requests?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requests).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('returns 404 for unknown request ID', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/requests/nonexistent-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('returns 403 if a user is not a party to the request', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.REQUESTED,
        customer: { userId: customerUserId },
        vendor: { userId: vendorUserId },
      });

      const res = await request(app)
        .get('/api/v1/requests/req-1')
        .set('Authorization', `Bearer ${otherToken}`); // Other customer

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows vendor party to view details and availableTransitions', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.REQUESTED,
        customer: { userId: customerUserId, fullName: 'Alice Customer' },
        vendor: { userId: vendorUserId, businessName: 'Bob Electrician' },
        statusHistory: [],
        comments: [],
      });

      const res = await request(app)
        .get('/api/v1/requests/req-1')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.id).toBe('req-1');
      expect(res.body.data.request.availableTransitions).toEqual(
        expect.arrayContaining([REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.REJECTED])
      );
    });
  });

  describe('PATCH /api/v1/requests/:id/status (Concurrency & State Machine)', () => {
    it('returns 422 if reason is missing when rejecting a request', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.REQUESTED,
        customer: { userId: customerUserId },
        vendor: { id: vendorProfileId, userId: vendorUserId },
      });

      const res = await request(app)
        .patch('/api/v1/requests/req-1/status')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          to: REQUEST_STATUS.REJECTED,
          reason: '   ', // blank reason
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('forbids customer from transitioning to ACCEPTED (role enforcement returns 403)', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.REQUESTED,
        customer: { userId: customerUserId },
        vendor: { id: vendorProfileId, userId: vendorUserId },
      });

      const res = await request(app)
        .patch('/api/v1/requests/req-1/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ to: REQUEST_STATUS.ACCEPTED });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('successfully transitions REQUESTED -> ACCEPTED by vendor with optimistic locking and writes history', async () => {
      prisma.serviceRequest.findUnique
        .mockResolvedValueOnce({
          id: 'req-1',
          status: REQUEST_STATUS.REQUESTED,
          customer: { userId: customerUserId, fullName: 'Alice' },
          vendor: { id: vendorProfileId, userId: vendorUserId, businessName: 'Bob Electrician' },
        })
        .mockResolvedValueOnce({
          id: 'req-1',
          status: REQUEST_STATUS.ACCEPTED,
          agreedPrice: 1500,
          customer: { fullName: 'Alice' },
          vendor: { businessName: 'Bob Electrician' },
        });

      // Optimistic locking success: count = 1
      prisma.serviceRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-acc' });
      prisma.serviceRequest.findMany.mockResolvedValueOnce([]); // response rate calc

      const res = await request(app)
        .patch('/api/v1/requests/req-1/status')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          to: REQUEST_STATUS.ACCEPTED,
          agreed_price: 1500,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.serviceRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'req-1', status: REQUEST_STATUS.REQUESTED },
        data: expect.objectContaining({
          status: REQUEST_STATUS.ACCEPTED,
          agreedPrice: 1500,
        }),
      });
      expect(prisma.requestStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestId: 'req-1',
            fromStatus: REQUEST_STATUS.REQUESTED,
            toStatus: REQUEST_STATUS.ACCEPTED,
          }),
        })
      );
    });

    it('returns 409 INVALID_TRANSITION if concurrent update occurred (optimistic lock count === 0)', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.REQUESTED,
        customer: { userId: customerUserId },
        vendor: { id: vendorProfileId, userId: vendorUserId },
      });

      // Another transaction updated the row first -> 0 rows matched status
      prisma.serviceRequest.updateMany.mockResolvedValueOnce({ count: 0 });

      const res = await request(app)
        .patch('/api/v1/requests/req-1/status')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ to: REQUEST_STATUS.ACCEPTED });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
      expect(res.body.error.message).toMatch(/already updated/i);
    });

    it('allows valid progression: ACCEPTED -> IN_PROGRESS -> COMPLETED', async () => {
      // Step 1: Start work (ACCEPTED -> IN_PROGRESS)
      prisma.serviceRequest.findUnique
        .mockResolvedValueOnce({
          id: 'req-2',
          status: REQUEST_STATUS.ACCEPTED,
          customer: { userId: customerUserId },
          vendor: { id: vendorProfileId, userId: vendorUserId },
        })
        .mockResolvedValueOnce({
          id: 'req-2',
          status: REQUEST_STATUS.IN_PROGRESS,
        });

      prisma.serviceRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-prog' });

      const resProgress = await request(app)
        .patch('/api/v1/requests/req-2/status')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ to: REQUEST_STATUS.IN_PROGRESS });

      expect(resProgress.status).toBe(200);

      // Step 2: Complete work (IN_PROGRESS -> COMPLETED)
      prisma.serviceRequest.findUnique
        .mockResolvedValueOnce({
          id: 'req-2',
          status: REQUEST_STATUS.IN_PROGRESS,
          customer: { userId: customerUserId },
          vendor: { id: vendorProfileId, userId: vendorUserId },
        })
        .mockResolvedValueOnce({
          id: 'req-2',
          status: REQUEST_STATUS.COMPLETED,
          agreedPrice: 2000,
        });

      prisma.serviceRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-comp' });

      const resComplete = await request(app)
        .patch('/api/v1/requests/req-2/status')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ to: REQUEST_STATUS.COMPLETED, agreed_price: 2000 });

      expect(resComplete.status).toBe(200);
      expect(resComplete.body.data.request.status).toBe(REQUEST_STATUS.COMPLETED);
    });
  });

  describe('Auto-Expiry Background Job (runExpireRequestsPass)', () => {
    it('cancels expired pending requests with reason "No response"', async () => {
      const expiredReq = {
        id: 'req-expired-1',
        status: REQUEST_STATUS.REQUESTED,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        customer: { userId: customerUserId },
        vendor: { businessName: 'Bob Electrician' },
      };

      prisma.serviceRequest.findMany.mockResolvedValueOnce([expiredReq]);
      prisma.serviceRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.requestStatusHistory.create.mockResolvedValueOnce({ id: 'hist-exp-1' });

      const count = await runExpireRequestsPass();
      expect(count).toBe(1);

      expect(prisma.serviceRequest.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'req-expired-1',
          status: REQUEST_STATUS.REQUESTED,
        },
        data: expect.objectContaining({
          status: REQUEST_STATUS.CANCELLED,
          cancelledBy: 'SYSTEM',
          cancellationReason: 'No response',
        }),
      });

      expect(prisma.requestStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestId: 'req-expired-1',
            fromStatus: REQUEST_STATUS.REQUESTED,
            toStatus: REQUEST_STATUS.CANCELLED,
            changedByUserId: null,
            reason: 'No response',
          }),
        })
      );
    });

    it('returns 0 when no expired pending requests exist', async () => {
      prisma.serviceRequest.findMany.mockResolvedValueOnce([]);
      const count = await runExpireRequestsPass();
      expect(count).toBe(0);
    });
  });

  describe('Request Comments Thread (/api/v1/requests/:id/comments)', () => {
    it('allows party to post and retrieve messages', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.IN_PROGRESS,
        customer: { userId: customerUserId },
        vendor: { userId: vendorUserId },
      });

      prisma.requestComment.create.mockResolvedValueOnce({
        id: 'comm-1',
        requestId: 'req-1',
        userId: customerUserId,
        message: 'Hello, what time will you arrive?',
        user: { role: 'CUSTOMER', customerProfile: { fullName: 'Alice' } },
      });

      const res = await request(app)
        .post('/api/v1/requests/req-1/comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Hello, what time will you arrive?' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.message).toBe('Hello, what time will you arrive?');
    });

    it('returns 400 REQUEST_CLOSED if comments are attempted on a completed/terminal request', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.COMPLETED, // terminal
        customer: { userId: customerUserId },
        vendor: { userId: vendorUserId },
      });

      const res = await request(app)
        .post('/api/v1/requests/req-1/comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Can you come back?' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REQUEST_CLOSED');
    });

    it('forbids non-party users from accessing comments (returns 403)', async () => {
      prisma.serviceRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: REQUEST_STATUS.ACCEPTED,
        customer: { userId: customerUserId },
        vendor: { userId: vendorUserId },
      });

      const res = await request(app)
        .get('/api/v1/requests/req-1/comments')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
