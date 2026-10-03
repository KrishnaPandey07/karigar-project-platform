const { Router } = require('express');
const userController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const { updateProfileSchema, changePasswordSchema } = require('./schema');

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile viewing & self-service editing
router.get('/me', userController.getMyProfile);
router.put('/me', validate(updateProfileSchema, 'body'), userController.updateMyProfile);
router.put('/me/password', validate(changePasswordSchema, 'body'), userController.changePassword);
router.delete('/me', userController.softDeleteAccount);

// Customer Dashboard data endpoint (Customers only)
router.get('/me/dashboard', requireRole('CUSTOMER'), userController.getCustomerDashboard);

module.exports = router;
