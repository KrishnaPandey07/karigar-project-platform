import React from 'react';
import { useTranslation } from 'react-i18next';

export default function OpenNowBadge({
  isOpenNow = false,
  dutyStatus = null,
  size = 'md',
  className = '',
}) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold',
  };

  // Determine effective status: explicit dutyStatus takes priority, else fall back to isOpenNow
  const effectiveStatus = dutyStatus
    ? dutyStatus.toUpperCase()
    : isOpenNow
    ? 'AVAILABLE'
    : 'OFF_DUTY';

  let config = {
    label: isEn ? 'Available Now' : 'उपलब्ध (फ्री)',
    badgeClasses: 'bg-emerald-50 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20',
    dotClasses: 'bg-emerald-500 animate-pulse',
  };

  if (effectiveStatus === 'BUSY') {
    config = {
      label: isEn ? 'Busy on Job' : 'काम पर व्यस्त',
      badgeClasses: 'bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-500/20',
      dotClasses: 'bg-amber-500',
    };
  } else if (effectiveStatus === 'OFF_DUTY') {
    config = {
      label: isEn ? 'Off Duty' : 'विश्राम पर',
      badgeClasses: 'bg-stone-100 text-stone-600 border border-stone-300',
      dotClasses: 'bg-stone-400',
    };
  }

  return (
    <span
      className={`inline-flex items-center rounded-full select-none shadow-xs transition-all ${
        sizeStyles[size] || sizeStyles.md
      } ${config.badgeClasses} ${className}`}
      aria-label={config.label}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClasses}`} />
      <span>{config.label}</span>
    </span>
  );
}
