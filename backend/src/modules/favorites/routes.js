const { Router } = require('express');
const favoriteController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const { vendorParamSchema } = require('./schema');

const router = Router();

// Favorites module: CUSTOMERS ONLY (RBAC)
router.use(authenticate, requireRole('CUSTOMER'));

router.get('/', favoriteController.getFavorites);
router.post('/:vendorId', validate(vendorParamSchema, 'params'), favoriteController.addFavorite);
router.delete('/:vendorId', validate(vendorParamSchema, 'params'), favoriteController.removeFavorite);

module.exports = router;
