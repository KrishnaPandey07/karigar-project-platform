const favoriteService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

class FavoriteController {
  async getFavorites(req, res, next) {
    try {
      const favorites = await favoriteService.getFavorites(req.user.id);
      return sendSuccess(res, { favorites }, 'Favorite vendors retrieved successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async addFavorite(req, res, next) {
    try {
      const result = await favoriteService.addFavorite(req.user.id, req.params.vendorId);
      return sendSuccess(res, result, result.message, 201);
    } catch (err) {
      return next(err);
    }
  }

  async removeFavorite(req, res, next) {
    try {
      const result = await favoriteService.removeFavorite(req.user.id, req.params.vendorId);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new FavoriteController();
