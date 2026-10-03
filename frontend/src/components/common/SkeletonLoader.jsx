import React from 'react';

export function VendorCardSkeleton() {
  return (
    <div
      className="bg-white rounded-3xl border border-gray-200/80 p-5 space-y-4 animate-pulse"
      aria-label="Loading vendor information..."
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-slate-200 rounded" />
            <div className="w-20 h-3 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-200" />
      </div>

      <div className="space-y-2 pt-2">
        <div className="w-full h-3 bg-slate-200 rounded" />
        <div className="w-4/5 h-3 bg-slate-200 rounded" />
      </div>

      <div className="flex gap-2 pt-2">
        <div className="w-16 h-5 bg-slate-200 rounded-md" />
        <div className="w-20 h-5 bg-slate-200 rounded-md" />
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="w-20 h-4 bg-slate-200 rounded" />
        <div className="w-24 h-8 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  VendorCardSkeleton,
  SearchResultsSkeleton,
};
