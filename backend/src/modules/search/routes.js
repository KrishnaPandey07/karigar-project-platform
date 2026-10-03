const { Router } = require('express');
const searchController = require('./controller');
const validate = require('../../middleware/validate');
const { searchVendorsSchema, searchSuggestionsSchema } = require('./schema');

const router = Router();

// Public Search Endpoints
router.get('/vendors', validate(searchVendorsSchema, 'query'), searchController.searchVendors);
router.get('/suggestions', validate(searchSuggestionsSchema, 'query'), searchController.getSuggestions);

module.exports = router;
