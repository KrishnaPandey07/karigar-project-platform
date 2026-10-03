/**
 * Blueprint Section 8: Ranking Algorithm Configuration
 * Score = 0.30*D + 0.25*R + 0.10*N + 0.10*A + 0.10*V + 0.05*P + 0.10*T
 */

module.exports = {
  // Weights (Sum must equal 1.00)
  WEIGHTS: {
    DISTANCE: 0.30,      // D: Proximity to user
    RATING: 0.25,        // R: Bayesian weighted rating
    REVIEWS: 0.10,       // N: Review volume (log-scaled)
    AVAILABILITY: 0.10,  // A: Availability now & schedule
    VERIFIED: 0.10,      // V: Verified business badge
    PRICE: 0.05,         // P: Price competitiveness
    RESPONSE_TIME: 0.10, // T: Vendor responsiveness
  },

  // Bayesian Rating Constants
  BAYESIAN: {
    PRIOR_RATING_C: 4.0, // Prior mean rating
    MIN_REVIEWS_M: 5,    // Confidence threshold (number of reviews)
  },

  // Review Volume Normalization
  REVIEWS_NORMALIZATION: {
    MAX_BENCHMARK: 100,  // Log scale reference point
  },

  // Price Normalization
  PRICE_NORMALIZATION: {
    DEFAULT_BENCHMARK: 500, // Used when no category median is available
  },

  // Response Time Benchmarks (in minutes)
  RESPONSE_TIME: {
    EXCELLENT_MINS: 15,
    GOOD_MINS: 30,
    FAIR_MINS: 60,
    MAX_TOLERABLE_MINS: 180,
  },

  // Timezone for availability calculation
  DEFAULT_TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
  DEFAULT_SEARCH_RADIUS_KM: 15,
};
