/**
 * Admin HTTP Controller
 * Reference: Blueprint Section 13 Response Envelopes
 */
const adminService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

async function getMetrics(req, res, next) {
  try {
    const metrics = await adminService.getPlatformMetrics();
    return sendSuccess(res, metrics, 'Platform metrics retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);
    return sendSuccess(
      res,
      { users: result.users },
      'Users list retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await adminService.updateUserStatus({
      adminId: req.user.id,
      targetUserId: req.params.id,
      status: req.body.status,
      reason: req.body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });
    return sendSuccess(
      res,
      { user },
      `User account status updated to ${req.body.status}.`
    );
  } catch (err) {
    next(err);
  }
}

async function getVerifications(req, res, next) {
  try {
    const result = await adminService.listVerifications(req.query);
    return sendSuccess(
      res,
      { verifications: result.verifications },
      'Vendor verifications list retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function reviewVerification(req, res, next) {
  try {
    const verification = await adminService.reviewVerification({
      adminId: req.user.id,
      verificationId: req.params.id,
      action: req.body.action,
      rejectionReason: req.body.rejectionReason,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });
    return sendSuccess(
      res,
      { verification },
      `Vendor verification ${req.body.action.toLowerCase()}ed successfully.`
    );
  } catch (err) {
    next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const result = await adminService.listReports(req.query);
    return sendSuccess(
      res,
      { reports: result.reports },
      'Reports list retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function reviewReport(req, res, next) {
  try {
    const report = await adminService.reviewReport({
      adminId: req.user.id,
      reportId: req.params.id,
      status: req.body.status,
      resolutionNotes: req.body.resolutionNotes,
      actionTaken: req.body.actionTaken,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });
    return sendSuccess(
      res,
      { report },
      `Report marked as ${req.body.status.toLowerCase()}.`
    );
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const result = await adminService.listAuditLogs(req.query);
    return sendSuccess(
      res,
      { logs: result.logs },
      'Audit logs retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics,
  getUsers,
  updateUserStatus,
  getVerifications,
  reviewVerification,
  getReports,
  reviewReport,
  getAuditLogs,
};
