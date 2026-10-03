/**
 * Unit Tests for Service Request Lifecycle Transitions Map
 * Reference: Blueprint Section 10
 */
const {
  REQUEST_STATUS,
  TERMINAL_STATUSES,
  isTerminalStatus,
  isValidTransition,
  isRoleAllowedForTransition,
  doesTransitionRequireReason,
  doesTransitionAllowPrice,
  getAvailableTransitions,
} = require('../src/modules/requests/transitions');

describe('Service Request State Machine & Transitions (Unit Tests)', () => {
  describe('1. Valid Transitions & Role Enforcement', () => {
    test('REQUESTED -> ACCEPTED is valid for VENDOR only and allows price', () => {
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED, 'VENDOR')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED, 'CUSTOMER')).toBe(false);
      expect(doesTransitionAllowPrice(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED)).toBe(true);
      expect(doesTransitionRequireReason(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED)).toBe(false);
    });

    test('REQUESTED -> REJECTED is valid for VENDOR only and requires reason', () => {
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.REJECTED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.REJECTED, 'VENDOR')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.REJECTED, 'CUSTOMER')).toBe(false);
      expect(doesTransitionRequireReason(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.REJECTED)).toBe(true);
    });

    test('REQUESTED -> CANCELLED is allowed for CUSTOMER and SYSTEM', () => {
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED, 'CUSTOMER')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED, 'SYSTEM')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED, 'VENDOR')).toBe(false);
    });

    test('ACCEPTED -> IN_PROGRESS is allowed for VENDOR only', () => {
      expect(isValidTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.IN_PROGRESS)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.IN_PROGRESS, 'VENDOR')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.IN_PROGRESS, 'CUSTOMER')).toBe(false);
    });

    test('ACCEPTED -> CANCELLED is allowed for both CUSTOMER and VENDOR, and requires reason', () => {
      expect(isValidTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED, 'CUSTOMER')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED, 'VENDOR')).toBe(true);
      expect(doesTransitionRequireReason(REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED)).toBe(true);
    });

    test('IN_PROGRESS -> COMPLETED is allowed for VENDOR only and allows price', () => {
      expect(isValidTransition(REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.COMPLETED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.COMPLETED, 'VENDOR')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.COMPLETED, 'CUSTOMER')).toBe(false);
      expect(doesTransitionAllowPrice(REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.COMPLETED)).toBe(true);
    });

    test('COMPLETED -> REVIEWED is allowed for SYSTEM only', () => {
      expect(isValidTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REVIEWED)).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REVIEWED, 'SYSTEM')).toBe(true);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REVIEWED, 'CUSTOMER')).toBe(false);
      expect(isRoleAllowedForTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REVIEWED, 'VENDOR')).toBe(false);
    });
  });

  describe('2. Invalid Transitions are strictly rejected', () => {
    test('REQUESTED cannot skip directly to IN_PROGRESS or COMPLETED', () => {
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.IN_PROGRESS)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.COMPLETED)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.REQUESTED, REQUEST_STATUS.REVIEWED)).toBe(false);
    });

    test('COMPLETED cannot revert to ACCEPTED or REQUESTED', () => {
      expect(isValidTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.ACCEPTED)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REQUESTED)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.COMPLETED, REQUEST_STATUS.IN_PROGRESS)).toBe(false);
    });

    test('Terminal states (REJECTED, CANCELLED, REVIEWED) permit zero transitions', () => {
      expect(isTerminalStatus(REQUEST_STATUS.REJECTED)).toBe(true);
      expect(isTerminalStatus(REQUEST_STATUS.CANCELLED)).toBe(true);
      expect(isTerminalStatus(REQUEST_STATUS.REVIEWED)).toBe(true);
      expect(isTerminalStatus(REQUEST_STATUS.REQUESTED)).toBe(false);
      expect(isTerminalStatus(REQUEST_STATUS.ACCEPTED)).toBe(false);
      expect(isTerminalStatus(REQUEST_STATUS.IN_PROGRESS)).toBe(false);

      expect(isValidTransition(REQUEST_STATUS.CANCELLED, REQUEST_STATUS.ACCEPTED)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.REJECTED, REQUEST_STATUS.ACCEPTED)).toBe(false);
      expect(isValidTransition(REQUEST_STATUS.REVIEWED, REQUEST_STATUS.COMPLETED)).toBe(false);
      expect(getAvailableTransitions(REQUEST_STATUS.CANCELLED, 'CUSTOMER')).toHaveLength(0);
      expect(getAvailableTransitions(REQUEST_STATUS.REJECTED, 'VENDOR')).toHaveLength(0);
    });
  });

  describe('3. Querying Available Transitions by Role', () => {
    test('Customer on REQUESTED can only CANCEL', () => {
      const transitions = getAvailableTransitions(REQUEST_STATUS.REQUESTED, 'CUSTOMER');
      expect(transitions).toEqual([REQUEST_STATUS.CANCELLED]);
    });

    test('Vendor on REQUESTED can ACCEPT or REJECT', () => {
      const transitions = getAvailableTransitions(REQUEST_STATUS.REQUESTED, 'VENDOR');
      expect(transitions).toContain(REQUEST_STATUS.ACCEPTED);
      expect(transitions).toContain(REQUEST_STATUS.REJECTED);
      expect(transitions).not.toContain(REQUEST_STATUS.CANCELLED);
    });

    test('Vendor on ACCEPTED can start work (IN_PROGRESS) or CANCEL', () => {
      const transitions = getAvailableTransitions(REQUEST_STATUS.ACCEPTED, 'VENDOR');
      expect(transitions).toContain(REQUEST_STATUS.IN_PROGRESS);
      expect(transitions).toContain(REQUEST_STATUS.CANCELLED);
    });
  });
});
