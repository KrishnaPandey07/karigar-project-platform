/**
 * RequestStatusBadge Component
 * Accessible status badge combining text, icon, and colors (never color alone).
 * WCAG AA compliant contrast ratios.
 */
import React from 'react';
import {
  Clock,
  CheckCircle,
  PlayCircle,
  CheckCheck,
  Star,
  XCircle,
  Ban,
  AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG = {
  REQUESTED: {
    label: 'Requested',
    icon: Clock,
    classes: 'bg-blue-50 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-600',
  },
  SUBMITTED: {
    label: 'Requested',
    icon: Clock,
    classes: 'bg-blue-50 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-600',
  },
  ACCEPTED: {
    label: 'Accepted',
    icon: CheckCircle,
    classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotClass: 'bg-indigo-600',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayCircle,
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-600',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCheck,
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  REVIEWED: {
    label: 'Reviewed',
    icon: Star,
    classes: 'bg-purple-50 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-600',
  },
  REJECTED: {
    label: 'Declined',
    icon: XCircle,
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
    dotClass: 'bg-gray-500',
  },
  DISPUTED: {
    label: 'Disputed',
    icon: AlertTriangle,
    classes: 'bg-orange-50 text-orange-800 border-orange-200',
    dotClass: 'bg-orange-600',
  },
};

export default function RequestStatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    icon: Clock,
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
    dotClass: 'bg-gray-400',
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.classes} ${
        isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
