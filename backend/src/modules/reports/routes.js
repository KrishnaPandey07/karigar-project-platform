/**
 * Reports Express Routes
 * Mount path: /api/v1/reports
 */
const { Router } = require('express');
const reportController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { createReportSchema } = require('./schema');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createReportSchema),
  reportController.createReport
);

router.get(
  '/me',
  reportController.getMyReports
);

module.exports = router;
