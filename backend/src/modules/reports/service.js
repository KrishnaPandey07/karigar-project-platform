/**
 * Reports Business Logic
 * Reference: Blueprint Sections 7, 13, 17
 */
const prisma = require('../../utils/prisma');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

async function createReport({ reporterId, data }) {
  const reportedUserId = data.reported_user_id || data.reportedUserId;
  const requestId = data.request_id || data.requestId || null;

  // 1. Cannot report self
  if (reporterId === reportedUserId) {
    throw new BadRequestError('You cannot file a report against yourself.');
  }

  // 2. Check reported user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true, email: true, role: true },
  });

  if (!targetUser) {
    throw new NotFoundError('Reported user does not exist.');
  }

  // 3. Optional request check
  if (requestId) {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!serviceRequest) {
      throw new NotFoundError('Referenced service request does not exist.');
    }
  }

  // 4. Create report
  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedUserId,
      requestId,
      reason: data.reason.trim(),
      details: data.details ? data.details.trim() : null,
      status: 'PENDING',
    },
    include: {
      reportedUser: {
        select: {
          id: true,
          email: true,
          role: true,
          customerProfile: { select: { fullName: true } },
          vendorProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return report;
}

async function getMyReports({ userId }) {
  const reports = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      reportedUser: {
        select: {
          id: true,
          role: true,
          customerProfile: { select: { fullName: true } },
          vendorProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return reports;
}

module.exports = {
  createReport,
  getMyReports,
};
