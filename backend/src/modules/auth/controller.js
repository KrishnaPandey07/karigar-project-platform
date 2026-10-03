const authService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          verificationToken: result.verificationToken,
        },
        'Registration successful',
        201
      );
    } catch (err) {
      return next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Login successful',
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.refreshAccessToken(rawToken);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Token refreshed successfully',
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await authService.logout(rawToken);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail(req.body.token);
      return sendSuccess(res, result, 'Email verified successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      return next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      return next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, { user }, 'Current user retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuthController();
