/**
 * Blueprint Section 8: Pure Function Ranking Engine
 * Score = 0.30*D + 0.25*R + 0.10*N + 0.10*A + 0.10*V + 0.05*P + 0.10*T
 */

const {
  WEIGHTS,
  BAYESIAN,
  REVIEWS_NORMALIZATION,
  PRICE_NORMALIZATION,
  RESPONSE_TIME,
} = require('../config/ranking');

/**
 * Calculate Bayesian Weighted Rating
 * W = (v * R + m * C) / (v + m)
 */
function calculateBayesianRating(ratingAvg, reviewCount, C = BAYESIAN.PRIOR_RATING_C, m = BAYESIAN.MIN_REVIEWS_M) {
  const v = Math.max(0, Number(reviewCount) || 0);
  const R = Math.max(1, Math.min(5, Number(ratingAvg) || C));

  const weighted = (v * R + m * C) / (v + m);
  return Math.round(weighted * 1000) / 1000;
}

/**
 * Pure function to calculate ranking score and breakdown for a vendor
 * @param {Object} vendor Vendor record with ratings, distance, services, etc.
 * @param {Object} searchContext { radiusKm, userLat, userLng, maxPriceBenchmark }
 * @returns {{ score: number, scoreBreakdown: Object }}
 */
function calculateRankingScore(vendor, searchContext = {}) {
  const radiusKm = Number(searchContext.radiusKm) || 15;
  const maxPriceBenchmark = Number(searchContext.maxPriceBenchmark) || PRICE_NORMALIZATION.DEFAULT_BENCHMARK;

  // 1. Distance Score (D) [Weight 0.30]
  let D = 0.5; // neutral fallback when coordinates are not provided
  if (vendor.distanceKm !== undefined && vendor.distanceKm !== null) {
    if (radiusKm > 0) {
      D = Math.max(0, Math.min(1, 1 - vendor.distanceKm / radiusKm));
    } else {
      D = vendor.distanceKm === 0 ? 1 : 0;
    }
  }

  // 2. Rating Score (R) with Bayesian Prior [Weight 0.25]
  const reviewCount = Number(vendor.ratingCount) || 0;
  const ratingAvg = Number(vendor.ratingAvg) || 0;
  const bayesianRating = calculateBayesianRating(ratingAvg, reviewCount);
  // Normalize rating [1, 5] -> [0, 1]
  const R = Math.max(0, Math.min(1, (bayesianRating - 1) / (5 - 1)));

  // 3. Review Volume (N) Log-Scaled [Weight 0.10]
  // log(1 + v) / log(1 + 100)
  const N = Math.max(
    0,
    Math.min(
      1,
      Math.log(1 + reviewCount) / Math.log(1 + REVIEWS_NORMALIZATION.MAX_BENCHMARK)
    )
  );

  // 4. Availability Score (A) [Weight 0.10]
  // 1.0: Open now and accepting requests
  // 0.5: Scheduled for today or available flag on
  // 0.0: Closed or in time-off
  let A = 0.0;
  if (vendor.openNow && vendor.isAvailable) {
    A = 1.0;
  } else if (vendor.openNow || vendor.isAvailable) {
    A = 0.5;
  } else {
    A = 0.0;
  }

  // 5. Verified Badge (V) [Weight 0.10]
  const V = vendor.isVerified ? 1.0 : 0.0;

  // 6. Price Competitiveness (P) [Weight 0.05]
  let P = 0.5;
  const startingPrice = Number(vendor.startingPrice);
  if (!isNaN(startingPrice) && startingPrice > 0 && maxPriceBenchmark > 0) {
    P = Math.max(0, Math.min(1, 1 - startingPrice / maxPriceBenchmark));
  }

  // 7. Response Time (T) [Weight 0.10]
  let T = 0.2;
  const responseTime = Number(vendor.responseTimeAvg) || 30;
  if (responseTime <= RESPONSE_TIME.EXCELLENT_MINS) {
    T = 1.0;
  } else if (responseTime <= RESPONSE_TIME.GOOD_MINS) {
    T = 0.8;
  } else if (responseTime <= RESPONSE_TIME.FAIR_MINS) {
    T = 0.6;
  } else if (responseTime <= RESPONSE_TIME.MAX_TOLERABLE_MINS) {
    T = 0.4;
  } else {
    T = 0.2;
  }

  // Combine into final 0.0 - 1.0 score
  const totalScore =
    D * WEIGHTS.DISTANCE +
    R * WEIGHTS.RATING +
    N * WEIGHTS.REVIEWS +
    A * WEIGHTS.AVAILABILITY +
    V * WEIGHTS.VERIFIED +
    P * WEIGHTS.PRICE +
    T * WEIGHTS.RESPONSE_TIME;

  const score = Math.max(0, Math.min(1, Math.round(totalScore * 10000) / 10000));

  const scoreBreakdown = {
    distance: {
      value: Math.round(D * 100) / 100,
      weight: WEIGHTS.DISTANCE,
      contribution: Math.round(D * WEIGHTS.DISTANCE * 1000) / 1000,
      label: 'Proximity to your location',
    },
    rating: {
      value: Math.round(R * 100) / 100,
      weight: WEIGHTS.RATING,
      contribution: Math.round(R * WEIGHTS.RATING * 1000) / 1000,
      label: 'Bayesian customer rating',
    },
    reviews: {
      value: Math.round(N * 100) / 100,
      weight: WEIGHTS.REVIEWS,
      contribution: Math.round(N * WEIGHTS.REVIEWS * 1000) / 1000,
      label: 'Community review volume',
    },
    availability: {
      value: Math.round(A * 100) / 100,
      weight: WEIGHTS.AVAILABILITY,
      contribution: Math.round(A * WEIGHTS.AVAILABILITY * 1000) / 1000,
      label: 'Open now and accepting requests',
    },
    verified: {
      value: Math.round(V * 100) / 100,
      weight: WEIGHTS.VERIFIED,
      contribution: Math.round(V * WEIGHTS.VERIFIED * 1000) / 1000,
      label: 'Verified identity and credentials',
    },
    price: {
      value: Math.round(P * 100) / 100,
      weight: WEIGHTS.PRICE,
      contribution: Math.round(P * WEIGHTS.PRICE * 1000) / 1000,
      label: 'Competitive pricing tier',
    },
    responseTime: {
      value: Math.round(T * 100) / 100,
      weight: WEIGHTS.RESPONSE_TIME,
      contribution: Math.round(T * WEIGHTS.RESPONSE_TIME * 1000) / 1000,
      label: 'Average response speed',
    },
  };

  return {
    score,
    scoreBreakdown,
  };
}

module.exports = {
  calculateBayesianRating,
  calculateRankingScore,
};
