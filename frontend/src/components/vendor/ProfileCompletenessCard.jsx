import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function ProfileCompletenessCard({ completeness, onActionClick }) {
  if (!completeness) return null;

  const { percentage = 0, breakdown = {}, missingFields = [], isComplete } = completeness;

  // Determine color based on completion percentage
  const getColorClass = (pct) => {
    if (pct >= 85) return 'bg-emerald-600 text-emerald-600';
    if (pct >= 50) return 'bg-amber-500 text-amber-500';
    return 'bg-blue-600 text-blue-600';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Profile Health & Completeness</h3>
            {isComplete ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                <Sparkles className="w-3.5 h-3.5" /> Boost Your Local Visibility
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Complete profiles receive up to <strong>3.5x more service requests</strong> from nearby neighbors.
          </p>
        </div>

        {/* Big percentage counter */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-gray-900">{percentage}%</span>
          <span className="text-xs text-gray-400 font-medium">completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${getColorClass(percentage).split(' ')[0]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 5 Key Metric Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center mb-6">
        <div className={`p-2.5 rounded-xl border ${breakdown.businessInfo?.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <span className="block text-xs font-semibold">Basics</span>
          <span className="text-[11px] opacity-80">{breakdown.businessInfo?.completed ? '✓ Done' : 'Missing'}</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${breakdown.avatar?.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <span className="block text-xs font-semibold">Photo/Logo</span>
          <span className="text-[11px] opacity-80">{breakdown.avatar?.completed ? '✓ Done' : 'Missing'}</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${breakdown.services?.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <span className="block text-xs font-semibold">Pricing</span>
          <span className="text-[11px] opacity-80">{breakdown.services?.completed ? '✓ Done' : 'Missing'}</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${breakdown.availability?.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <span className="block text-xs font-semibold">Hours</span>
          <span className="text-[11px] opacity-80">{breakdown.availability?.completed ? '✓ Done' : 'Missing'}</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${breakdown.verification?.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <span className="block text-xs font-semibold">Verification</span>
          <span className="text-[11px] opacity-80">{breakdown.verification?.completed ? '✓ Done' : 'Missing'}</span>
        </div>
      </div>

      {/* Actionable Missing Items Checklist */}
      {missingFields.length > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-2">
            Recommended next steps:
          </span>
          <ul className="space-y-2">
            {missingFields.map((field, idx) => (
              <li key={idx} className="flex items-center justify-between text-xs sm:text-sm text-amber-800">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {field}
                </span>
                {onActionClick && (
                  <button
                    onClick={() => onActionClick(field)}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-900 underline flex items-center gap-1"
                  >
                    Complete now <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Outstanding!</span> Your profile has all the critical credentials. You are positioned at the top of neighborhood search rankings.
          </div>
        </div>
      )}
    </div>
  );
}
