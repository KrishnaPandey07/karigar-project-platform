const { calculateHaversineDistance, getBoundingBox } = require('../src/utils/haversine');
const { calculateBayesianRating, calculateRankingScore } = require('../src/utils/ranking');
const { WEIGHTS } = require('../src/config/ranking');

describe('Unit Tests: Ranking Engine, Bayesian Rating & Haversine Formula', () => {
  describe('1. Haversine Distance & Bounding Box', () => {
    it('should calculate accurate distance between two known geographic points within tolerance', () => {
      // Empire State Building: 40.7484, -73.9857
      // Brooklyn Bridge: 40.7061, -73.9969
      // Expected great-circle distance is approx 4.8 km
      const distance = calculateHaversineDistance(40.7484, -73.9857, 40.7061, -73.9969);
      expect(distance).toBeGreaterThan(4.5);
      expect(distance).toBeLessThan(5.2);
    });

    it('should return 0 distance for identical coordinates', () => {
      const distance = calculateHaversineDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should compute valid bounding box surrounding center point', () => {
      const box = getBoundingBox(40.7128, -74.006, 15);
      expect(box.minLat).toBeLessThan(40.7128);
      expect(box.maxLat).toBeGreaterThan(40.7128);
      expect(box.minLng).toBeLessThan(-74.006);
      expect(box.maxLng).toBeGreaterThan(-74.006);
    });
  });

  describe('2. Bayesian Weighted Rating & Review Confidence', () => {
    it('should rank 50 reviews averaging 4.6 HIGHER than 1 review of 5.0 stars due to Bayesian prior (C=4.0, m=5)', () => {
      const vendor1Review5Stars = calculateBayesianRating(5.0, 1);
      const vendor50Reviews4_6Stars = calculateBayesianRating(4.6, 50);

      // Vendor 1: (1*5.0 + 5*4.0) / (1 + 5) = 25 / 6 = 4.167
      expect(vendor1Review5Stars).toBeCloseTo(4.167, 2);

      // Vendor 2: (50*4.6 + 5*4.0) / (50 + 5) = 250 / 55 = 4.545
      expect(vendor50Reviews4_6Stars).toBeCloseTo(4.545, 2);

      // High review count at 4.6 should strongly beat 1 single review at 5.0
      expect(vendor50Reviews4_6Stars).toBeGreaterThan(vendor1Review5Stars);
    });

    it('should shrink zero-review vendors to the prior mean rating (C=4.0)', () => {
      const bayesianZeroReviews = calculateBayesianRating(5.0, 0);
      expect(bayesianZeroReviews).toBe(4.0);
    });
  });

  describe('3. Pure Function Ranking Score Bounds and Normalization', () => {
    it('should ensure total ranking score is strictly bounded between 0.0 and 1.0', () => {
      // Worst possible vendor
      const worstVendor = {
        distanceKm: 50,
        ratingAvg: 1.0,
        ratingCount: 0,
        openNow: false,
        isAvailable: false,
        isVerified: false,
        startingPrice: 2000,
        responseTimeAvg: 300,
      };

      const worstScore = calculateRankingScore(worstVendor, { radiusKm: 15 });
      expect(worstScore.score).toBeGreaterThanOrEqual(0.0);
      expect(worstScore.score).toBeLessThanOrEqual(1.0);

      // Best possible vendor
      const bestVendor = {
        distanceKm: 0.1,
        ratingAvg: 5.0,
        ratingCount: 200,
        openNow: true,
        isAvailable: true,
        isVerified: true,
        startingPrice: 20,
        responseTimeAvg: 10,
      };

      const bestScore = calculateRankingScore(bestVendor, { radiusKm: 15 });
      expect(bestScore.score).toBeGreaterThanOrEqual(0.0);
      expect(bestScore.score).toBeLessThanOrEqual(1.0);
      expect(bestScore.score).toBeGreaterThan(worstScore.score);
    });

    it('should normalize each factor properly in scoreBreakdown', () => {
      const vendor = {
        distanceKm: 0, // distance = 0 => D = 1.0
        ratingAvg: 5.0,
        ratingCount: 100,
        openNow: true,
        isAvailable: true, // openNow & isAvailable => A = 1.0
        isVerified: true, // isVerified => V = 1.0
        startingPrice: 50,
        responseTimeAvg: 12, // <= 15 mins => T = 1.0
      };

      const { score, scoreBreakdown } = calculateRankingScore(vendor, {
        radiusKm: 10,
        maxPriceBenchmark: 500,
      });

      expect(scoreBreakdown.distance.value).toBe(1.0);
      expect(scoreBreakdown.distance.weight).toBe(WEIGHTS.DISTANCE);

      expect(scoreBreakdown.availability.value).toBe(1.0);
      expect(scoreBreakdown.availability.weight).toBe(WEIGHTS.AVAILABILITY);

      expect(scoreBreakdown.verified.value).toBe(1.0);
      expect(scoreBreakdown.verified.weight).toBe(WEIGHTS.VERIFIED);

      expect(scoreBreakdown.responseTime.value).toBe(1.0);
      expect(scoreBreakdown.responseTime.weight).toBe(WEIGHTS.RESPONSE_TIME);

      expect(score).toBeGreaterThan(0.9);
    });
  });
});
