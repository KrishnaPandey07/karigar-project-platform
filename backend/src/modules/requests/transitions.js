/**
 * LocalLink: Service Request Lifecycle Transitions & State Machine
 * Single source of truth for allowed transitions, roles, and validation rules.
 * Reference: Blueprint Section 10
 */

const REQUEST_STATUS = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REVIEWED: 'REVIEWED',
};

const TERMINAL_STATUSES = Object.freeze([
  REQUEST_STATUS.REJECTED,
  REQUEST_STATUS.CANCELLED,
  REQUEST_STATUS.REVIEWED,
]);

/**
 * State Transition Matrix:
 * fromStatus -> toStatus -> { allowedRoles: string[], requiresReason: boolean, allowsPrice: boolean }
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [REQUEST_STATUS.REQUESTED]: {
    [REQUEST_STATUS.ACCEPTED]: {
      allowedRoles: ['VENDOR'],
      requiresReason: false,
      allowsPrice: true,
    },
    [REQUEST_STATUS.REJECTED]: {
      allowedRoles: ['VENDOR'],
      requiresReason: true,
      allowsPrice: false,
    },
    [REQUEST_STATUS.CANCELLED]: {
      allowedRoles: ['CUSTOMER', 'SYSTEM'],
      requiresReason: false, // Optional for customer; system expiry supplies "No response"
      allowsPrice: false,
    },
  },
  [REQUEST_STATUS.ACCEPTED]: {
    [REQUEST_STATUS.IN_PROGRESS]: {
      allowedRoles: ['VENDOR'],
      requiresReason: false,
      allowsPrice: false,
    },
    [REQUEST_STATUS.CANCELLED]: {
      allowedRoles: ['CUSTOMER', 'VENDOR'],
      requiresReason: true, // Reason strictly required when cancelling an accepted request
      allowsPrice: false,
    },
  },
  [REQUEST_STATUS.IN_PROGRESS]: {
    [REQUEST_STATUS.COMPLETED]: {
      allowedRoles: ['VENDOR'],
      requiresReason: false,
      allowsPrice: true, // Optional final agreed price
    },
  },
  [REQUEST_STATUS.COMPLETED]: {
    [REQUEST_STATUS.REVIEWED]: {
      allowedRoles: ['SYSTEM'],
      requiresReason: false,
      allowsPrice: false,
    },
  },
  [REQUEST_STATUS.REJECTED]: {},
  [REQUEST_STATUS.CANCELLED]: {},
  [REQUEST_STATUS.REVIEWED]: {},
});

/**
 * Checks if a status is terminal (no further transitions permitted).
 * @param {string} status
 * @returns {boolean}
 */
function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Verifies if moving from `fromStatus` to `toStatus` is an allowed transition.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
function isValidTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  const currentTransitions = ALLOWED_TRANSITIONS[fromStatus];
  if (!currentTransitions) return false;
  return Boolean(currentTransitions[toStatus]);
}

/**
 * Checks if the caller's role is authorized to perform the transition.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @param {string} role ('CUSTOMER' | 'VENDOR' | 'SYSTEM' | 'ADMIN')
 * @returns {boolean}
 */
function isRoleAllowedForTransition(fromStatus, toStatus, role) {
  if (!isValidTransition(fromStatus, toStatus)) return false;
  const transitionRules = ALLOWED_TRANSITIONS[fromStatus][toStatus];
  return transitionRules.allowedRoles.includes(role);
}

/**
 * Checks if the transition strictly mandates a non-empty reason string.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
function doesTransitionRequireReason(fromStatus, toStatus) {
  if (!isValidTransition(fromStatus, toStatus)) return false;
  return Boolean(ALLOWED_TRANSITIONS[fromStatus][toStatus].requiresReason);
}

/**
 * Checks if the transition accepts an optional agreed_price.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
function doesTransitionAllowPrice(fromStatus, toStatus) {
  if (!isValidTransition(fromStatus, toStatus)) return false;
  return Boolean(ALLOWED_TRANSITIONS[fromStatus][toStatus].allowsPrice);
}

/**
 * Returns available next transitions for a given status and role.
 * @param {string} currentStatus
 * @param {string} role
 * @returns {string[]}
 */
function getAvailableTransitions(currentStatus, role) {
  const transitions = ALLOWED_TRANSITIONS[currentStatus];
  if (!transitions) return [];
  return Object.entries(transitions)
    .filter(([_, rule]) => rule.allowedRoles.includes(role))
    .map(([toStatus]) => toStatus);
}

module.exports = {
  REQUEST_STATUS,
  TERMINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  isTerminalStatus,
  isValidTransition,
  isRoleAllowedForTransition,
  doesTransitionRequireReason,
  doesTransitionAllowPrice,
  getAvailableTransitions,
};
