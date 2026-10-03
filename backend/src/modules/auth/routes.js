const { Router } = require('express');
const authController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./schema');

const router = Router();

// Public routes with Zod validation
router.post('/register', validate(registerSchema, 'body'), authController.register);
router.post('/login', validate(loginSchema, 'body'), authController.login);
router.post('/refresh', validate(refreshSchema, 'body'), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/verify-email', validate(verifyEmailSchema, 'body'), authController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema, 'body'), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema, 'body'), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);

module.exports = router;
