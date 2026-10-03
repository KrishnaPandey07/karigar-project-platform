const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');

// Mock Prisma for deterministic unit/integration testing
jest.mock('../src/utils/prisma', () => {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customerProfile: {
      create: jest.fn(),
    },
    vendorProfile: {
      create: jest.fn(),
    },
    vendorVerification: {
      create: jest.fn(),
    },
    emailVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
});

describe('Auth Module & Security Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject registration with weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
        role: 'CUSTOMER',
        fullName: 'Test User',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject vendor registration missing coordinates', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'vendor@example.com',
        password: 'Password123!',
        role: 'VENDOR',
        businessName: 'Apex Electrics',
        phone: '+1-555-1234',
        address: '123 Main St',
        // lat and lng omitted
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should register a new customer successfully', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // existing check
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'alice@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: false,
          customerProfile: { id: 'cp-1', fullName: 'Alice Johnson' },
        });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({ id: 'user-123', email: 'alice@example.com', role: 'CUSTOMER' }),
          },
          customerProfile: {
            create: jest.fn().mockResolvedValue({ id: 'cp-1', userId: 'user-123', fullName: 'Alice Johnson' }),
          },
          emailVerification: {
            create: jest.fn().mockResolvedValue({ id: 'ev-1' }),
          },
        });
      });

      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'CUSTOMER',
        fullName: 'Alice Johnson',
        phone: '+1-555-0101',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 CONFLICT if email already registered', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-id', email: 'alice@example.com' });

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'CUSTOMER',
        fullName: 'Alice Johnson',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully with valid credentials and issue tokens', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: 'alice@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true,
        customerProfile: { id: 'cp-1', fullName: 'Alice Johnson' },
      });

      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: 'alice@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true,
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me (Protected Route)', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with user data when valid access token provided', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', email: 'alice@example.com', role: 'CUSTOMER' },
        config.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'alice@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: 'cp-1', fullName: 'Alice Johnson' },
        }) // for authenticate middleware
        .mockResolvedValueOnce({
          id: 'user-123',
          email: 'alice@example.com',
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          customerProfile: { id: 'cp-1', fullName: 'Alice Johnson' },
        }); // for getMe service

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
    });
  });
});
