/**
 * Reports HTTP Controller
 */
const reportService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

async function createReport(req, res, next) {
  try {
    const report = await reportService.createReport({
      reporterId: req.user.id,
      data: req.body,
    });
    return sendSuccess(res, { report }, 'Report filed successfully. Our moderation team will review it.', 201);
  } catch (err) {
    next(err);
  }
}

async function getMyReports(req, res, next) {
  try {
    const reports = await reportService.getMyReports({
      userId: req.user.id,
    });
    return sendSuccess(res, { reports }, 'Reports retrieved successfully.', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReport,
  getMyReports,
};
