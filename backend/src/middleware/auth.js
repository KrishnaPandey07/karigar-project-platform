const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const prisma = require('../utils/prisma');

/**
 * Middleware: Verify Bearer access token in Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header missing or invalid format (Bearer token expected)');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        status: true,
        isVerified: true,
        customerProfile: { select: { id: true, fullName: true } },
        vendorProfile: { select: { id: true, businessName: true, isVerified: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User associated with this token no longer exists');
    }

    if (!user.isActive || user.status === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended or deactivated. Please contact support.');
    }

    // Attach user to request
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles Allowed roles (e.g. 'CUSTOMER', 'VENDOR', 'ADMIN')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required before role check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Requires one of roles: [${allowedRoles.join(', ')}], but current role is ${req.user.role}`
        )
      );
    }

    return next();
  };
};

/**
 * Helper to check resource ownership or admin bypass
 * @param {string} resourceOwnerId The userId owning the resource
 * @param {object} currentUser req.user
 * @returns {boolean}
 */
const checkOwnershipOrAdmin = (resourceOwnerId, currentUser) => {
  if (!currentUser) return false;
  if (currentUser.role === 'ADMIN') return true;
  return currentUser.id === resourceOwnerId;
};

module.exports = {
  authenticate,
  requireRole,
  checkOwnershipOrAdmin,
};
