const { Router } = require('express');
const catalogController = require('./controller');
const validate = require('../../middleware/validate');
const { getServicesSchema, getLocationsSchema, getVendorsSchema } = require('./schema');

const router = Router();

// Public endpoints
router.get('/categories', catalogController.getCategories);
router.get('/services', validate(getServicesSchema, 'query'), catalogController.getServices);
router.get('/locations', validate(getLocationsSchema, 'query'), catalogController.getLocations);
router.get('/vendors/top', validate(getVendorsSchema, 'query'), catalogController.getTopVendors);
router.get('/vendors/:id', catalogController.getPublicVendor);

module.exports = router;
