const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const { sendSuccess, sendError } = require('./utils/responseEnvelope');

const path = require('path');

// Import domain modules
const authRoutes = require('./modules/auth/routes');
const vendorRoutes = require('./modules/vendors/routes');
const userRoutes = require('./modules/users/routes');
const catalogRoutes = require('./modules/catalog/routes');
const favoriteRoutes = require('./modules/favorites/routes');
const searchRoutes = require('./modules/search/routes');
const requestRoutes = require('./modules/requests/routes');
const reviewRoutes = require('./modules/reviews/routes');
const reportRoutes = require('./modules/reports/routes');
const notificationRoutes = require('./modules/notifications/routes');
const adminRoutes = require('./modules/admin/routes');

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration in dev
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Allow-List
const allowedOrigins = [
  config.CORS_ORIGIN,
  config.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, Jest)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting (Section 17: Security)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return sendError(
        res,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests from this IP, please try again after 15 minutes',
        429
      );
    },
  });
  app.use(limiter);
}

// 4. Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// 5. Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 6. Health Check & Root API Information
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    },
    'LocalLink API Gateway is operational'
  );
});

// 7. Mount Domain Modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', catalogRoutes); // mounts /categories, /services, /locations, /vendors/top

// 7. 404 Handler for Undefined Routes
app.use('*', (req, res) => {
  return sendError(
    res,
    'ROUTE_NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl} - Route not defined`,
    404
  );
});

// 8. Global Error Handler (Section 13 Compliant)
app.use(errorHandler);

module.exports = app;
