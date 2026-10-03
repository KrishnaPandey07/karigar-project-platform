/**
 * Service Requests HTTP Controller
 * Reference: Blueprint Section 13 Response Envelopes
 */
const requestService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

async function createRequest(req, res, next) {
  try {
    const result = await requestService.createRequest({
      userId: req.user.id,
      data: req.body,
    });
    return sendSuccess(res, { request: result }, 'Service request created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function listRequests(req, res, next) {
  try {
    const result = await requestService.listRequests({
      userId: req.user.id,
      role: req.user.role,
      query: req.query,
    });
    return sendSuccess(
      res,
      { requests: result.requests },
      'Requests retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function getRequestById(req, res, next) {
  try {
    const result = await requestService.getRequestById({
      requestId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    return sendSuccess(res, { request: result }, 'Request retrieved successfully.', 200);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await requestService.updateRequestStatus({
      requestId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, { request: result }, 'Request status updated successfully.', 200);
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const comments = await requestService.getComments({
      requestId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    return sendSuccess(res, { comments }, 'Comments retrieved successfully.', 200);
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await requestService.addComment({
      requestId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      message: req.body.message,
    });
    return sendSuccess(res, { comment }, 'Comment posted successfully.', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  updateStatus,
  getComments,
  addComment,
};
