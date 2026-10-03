import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no records available to display right now.',
  actionLabel,
  onAction,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-gray-200 shadow-sm max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4 text-brand-600">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
