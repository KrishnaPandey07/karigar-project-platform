/**
 * Auto-Expiry Background Job for Service Requests
 * Runs every 10 minutes to transition unresponded REQUESTED items past expires_at to CANCELLED.
 * Safe for concurrent executions via optimistic locking.
 * Reference: Blueprint Section 10
 */
const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { REQUEST_STATUS } = require('../modules/requests/transitions');
const { notify } = require('../modules/notifications/service');

/**
 * Executes a single scan and expiration pass over expired pending requests.
 * @returns {Promise<number>} Number of requests expired in this pass
 */
async function runExpireRequestsPass() {
  const now = new Date();

  // Find requests that are REQUESTED and past their expiresAt timestamp
  const expiredRequests = await prisma.serviceRequest.findMany({
    where: {
      status: REQUEST_STATUS.REQUESTED,
      expiresAt: {
        lte: now,
      },
    },
    include: {
      customer: { select: { userId: true } },
      vendor: { select: { businessName: true } },
    },
  });

  if (!expiredRequests || expiredRequests.length === 0) {
    return 0;
  }

  let expiredCount = 0;

  for (const req of expiredRequests) {
    try {
      // Execute optimistic locking update: exactly one winner if multiple jobs run simultaneously
      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.serviceRequest.updateMany({
          where: {
            id: req.id,
            status: REQUEST_STATUS.REQUESTED, // Optimistic condition
          },
          data: {
            status: REQUEST_STATUS.CANCELLED,
            cancelledAt: now,
            cancelledBy: 'SYSTEM',
            cancellationReason: 'No response',
          },
        });

        if (updateResult.count > 0) {
          await tx.requestStatusHistory.create({
            data: {
              requestId: req.id,
              fromStatus: REQUEST_STATUS.REQUESTED,
              toStatus: REQUEST_STATUS.CANCELLED,
              changedByUserId: null, // SYSTEM change
              reason: 'No response',
              note: 'Auto-expired: vendor did not respond within expiration window',
            },
          });
          return true;
        }

        return false;
      });

      if (result) {
        expiredCount++;
        // Notify customer
        if (req.customer?.userId) {
          await notify(req.customer.userId, 'REQUEST_EXPIRED', {
            requestId: req.id,
            vendorName: req.vendor?.businessName || 'the vendor',
          });
        }
      }
    } catch (err) {
      console.error(`[ExpiryJob] Failed to expire request ${req.id}:`, err.message);
    }
  }

  return expiredCount;
}

/**
 * Starts the node-cron scheduler for request expiration.
 */
function startExpireRequestsJob() {
  // Run every 10 minutes: */10 * * * *
  const task = cron.schedule('*/10 * * * *', async () => {
    try {
      const count = await runExpireRequestsPass();
      if (count > 0) {
        console.log(`[ExpiryJob] Successfully auto-expired ${count} pending requests.`);
      }
    } catch (err) {
      console.error('[ExpiryJob] Error running expiry scan:', err.message);
    }
  });

  console.log('[ExpiryJob] Scheduled auto-expiry cron job (every 10 minutes).');
  return task;
}

module.exports = {
  runExpireRequestsPass,
  startExpireRequestsJob,
};
