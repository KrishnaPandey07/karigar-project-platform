import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, RotateCcw, ShieldCheck, Clock, Check } from 'lucide-react';

export default function FilterSheet({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  isMobile = false,
}) {
  const { t } = useTranslation();

  const handleRatingChange = (ratingVal) => {
    onChange({
      ...filters,
      minRating: filters.minRating === ratingVal ? '' : ratingVal,
    });
  };

  const content = (
    <div className="space-y-6">
      {/* Header for mobile */}
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-gray-900 text-base">{t('common.filter', 'Filters')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 1. Distance Radius Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {t('search.filterDistance', 'Search Radius')}
          </label>
          <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            {filters.radius || 15} km
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={filters.radius || 15}
          onChange={(e) => onChange({ ...filters, radius: Number(e.target.value) })}
          className="w-full accent-brand-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
          aria-label="Distance radius slider in kilometers"
        />
        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>1 km</span>
          <span>15 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* 2. Customer Rating */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          {t('search.filterRating', 'Minimum Rating')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: '', label: 'Any' },
            { val: '4.0', label: '★ 4.0+' },
            { val: '4.5', label: '★ 4.5+' },
          ].map((r) => {
            const isSelected = filters.minRating === r.val || (!filters.minRating && r.val === '');
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => handleRatingChange(r.val)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Price Range */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          {t('search.filterPrice', 'Starting Price (₹)')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            aria-label="Minimum price"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* 4. Verified & Available Now Checkboxes */}
      <div className="space-y-3 pt-1 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.verified)}
            onChange={(e) => onChange({ ...filters, verified: e.target.checked })}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
          />
          <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {t('search.filterVerified', 'Verified Pros Only')}
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.availableNow)}
            onChange={(e) => onChange({ ...filters, availableNow: e.target.checked })}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
          />
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="font-bold text-stone-800">{t('search.filterOpenNow', 'Available Now Only')}</span>
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('common.clearAll', 'Reset')}
        </button>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm"
          >
            {t('common.apply', 'Apply')}
          </button>
        )}
      </div>
    </div>
  );

  // If mobile, render as slide-up bottom sheet
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-250 z-10">
          {content}
        </div>
      </div>
    );
  }

  // Desktop sidebar panel
  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm sticky top-24">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-gray-900 text-sm">{t('common.filter', 'Filters')}</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-gray-400 hover:text-brand-600 transition"
        >
          {t('common.clearAll', 'Reset')}
        </button>
      </div>
      {content}
    </div>
  );
}
