const userService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

class UserController {
  async getMyProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user.id);
      return sendSuccess(res, { user }, 'User profile retrieved successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const user = await userService.updateUserProfile(req.user.id, req.body);
      return sendSuccess(res, { user }, 'Profile updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const result = await userService.changePassword(
        req.user.id,
        req.body.oldPassword,
        req.body.newPassword
      );
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      return next(err);
    }
  }

  async softDeleteAccount(req, res, next) {
    try {
      const result = await userService.softDeleteAccount(req.user.id);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      return next(err);
    }
  }

  async getCustomerDashboard(req, res, next) {
    try {
      const data = await userService.getCustomerDashboard(req.user.id);
      return sendSuccess(res, data, 'Customer dashboard data retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new UserController();
