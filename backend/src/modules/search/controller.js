const searchService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

class SearchController {
  async searchVendors(req, res, next) {
    try {
      const result = await searchService.searchVendors(req.query, req.user?.id);
      return sendSuccess(
        res,
        {
          vendors: result.vendors,
          meta: result.meta,
        },
        'Vendors matching criteria retrieved successfully',
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async getSuggestions(req, res, next) {
    try {
      const suggestions = await searchService.getSuggestions(req.query.q);
      return sendSuccess(res, { suggestions }, 'Search suggestions retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new SearchController();
