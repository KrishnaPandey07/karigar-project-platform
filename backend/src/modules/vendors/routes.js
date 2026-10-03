const { Router } = require('express');
const vendorController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const { upload } = require('../../utils/uploader');
const {
  updateProfileSchema,
  toggleAvailabilitySchema,
  servicePricingSchema,
  weeklyAvailabilitySchema,
  timeOffSchema,
} = require('./schema');

const router = Router();

const catalogController = require('../catalog/controller');

// Public routes to view vendor profiles
router.get('/top', catalogController.getTopVendors);
router.get('/:id', vendorController.getPublicVendor);

// Protected routes (Only VENDOR role)
router.use(authenticate, requireRole('VENDOR'));

// Profile CRUD & Completeness
router.get('/me/profile', vendorController.getMyProfile);
router.put('/me/profile', validate(updateProfileSchema, 'body'), vendorController.updateMyProfile);
router.patch(
  '/me/availability',
  validate(toggleAvailabilitySchema, 'body'),
  vendorController.toggleAvailability
);

// Services & Pricing
router.get('/me/services', vendorController.getMyServices);
router.post(
  '/me/services',
  validate(servicePricingSchema, 'body'),
  vendorController.addOrUpdateService
);
router.delete('/me/services/:serviceId', vendorController.deleteService);

// Weekly Availability & Time Off with Overlap Validation
router.get('/me/schedule', vendorController.getMyAvailability);
router.put(
  '/me/schedule',
  validate(weeklyAvailabilitySchema, 'body'),
  vendorController.saveWeeklyAvailability
);
router.get('/me/time-off', vendorController.getTimeOff);
router.post('/me/time-off', validate(timeOffSchema, 'body'), vendorController.addTimeOff);
router.delete('/me/time-off/:timeOffId', vendorController.deleteTimeOff);

// Media & Document Uploads
router.post('/me/upload-image', upload.single('image'), vendorController.uploadImage);
router.post('/me/upload-document', upload.single('document'), vendorController.uploadVerificationDoc);

module.exports = router;
