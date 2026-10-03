require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'locallink_access_secret_super_secure_key_12345',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'locallink_refresh_secret_super_secure_key_67890',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'locallink_cookie_signing_secret_abcdef',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Section 8: Ranking Weights (Score = 0.30*D + 0.25*R + 0.10*N + 0.10*A + 0.10*V + 0.05*P + 0.10*T)
  RANKING_WEIGHTS: {
    D: 0.30, // Distance / Proximity
    R: 0.25, // Bayesian Rating
    N: 0.10, // Review count
    A: 0.10, // Availability
    V: 0.10, // Verified status
    P: 0.05, // Price competitiveness
    T: 0.10, // Turnaround / Response time
  },
  
  // Section 8: Bayesian rating smoothing parameters
  BAYESIAN_PRIOR: {
    M: 5,   // prior review count threshold
    C: 3.5, // global average rating prior
  },
};
