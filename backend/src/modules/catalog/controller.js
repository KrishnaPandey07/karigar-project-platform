const catalogService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

class CatalogController {
  async getCategories(req, res, next) {
    try {
      const categories = await catalogService.getCategoriesWithVendorCounts();
      return sendSuccess(res, { categories }, 'Categories retrieved successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getServices(req, res, next) {
    try {
      const services = await catalogService.getServices(req.query);
      return sendSuccess(res, { services }, 'Services catalog retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getLocations(req, res, next) {
    try {
      const locations = await catalogService.getLocations(req.query);
      return sendSuccess(res, { locations }, 'Service locations list retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getPublicVendor(req, res, next) {
    try {
      const vendor = await catalogService.getPublicVendor(req.params.id);
      return sendSuccess(res, { vendor }, 'Public vendor profile retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getTopVendors(req, res, next) {
    try {
      const vendors = await catalogService.getTopVendors(req.query.limit);
      return sendSuccess(res, { vendors }, 'Top rated vendors retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new CatalogController();
