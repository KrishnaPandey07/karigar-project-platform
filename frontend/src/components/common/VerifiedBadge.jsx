import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function VerifiedBadge({
  isVerified = false,
  showText = true,
  size = 'md',
  className = '',
}) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      title="ID & License Verified Local Professional"
    >
      <ShieldCheck className={`${iconSizes[size] || iconSizes.md} text-emerald-600 shrink-0`} />
      {showText && <span>Verified Pro</span>}
    </span>
  );
}
