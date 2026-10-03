import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  MapPin,
  Star,
  Users,
  Clock,
  ShieldCheck,
  DollarSign,
  Zap,
  X,
} from 'lucide-react';
import Modal from './Modal';

export default function RankingPopover({
  isOpen,
  onClose,
  businessName,
  score,
  scoreBreakdown,
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getLevelBadge = (val) => {
    const num = Number(val) || 0;
    if (num >= 0.75) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          {t('ranking.levelHigh', 'High')}
        </span>
      );
    }
    if (num >= 0.4) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
          {t('ranking.levelMedium', 'Medium')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {t('ranking.levelFair', 'Fair')}
      </span>
    );
  };

  const factors = [
    {
      key: 'distance',
      icon: MapPin,
      name: t('ranking.proximity', 'Close to your location'),
      weightText: '30% weight',
      detail: scoreBreakdown?.distance?.value !== undefined ? getLevelBadge(scoreBreakdown.distance.value) : null,
      desc: 'Based on exact Haversine distance within your selected radius.',
    },
    {
      key: 'rating',
      icon: Star,
      name: t('ranking.rating', 'Customer rating & confidence'),
      weightText: '25% weight',
      detail: scoreBreakdown?.rating?.value !== undefined ? getLevelBadge(scoreBreakdown.rating.value) : null,
      desc: 'Bayesian weighted rating protecting against inflated single-review scores.',
    },
    {
      key: 'reviews',
      icon: Users,
      name: t('ranking.reviews', 'Community review volume'),
      weightText: '10% weight',
      detail: scoreBreakdown?.reviews?.value !== undefined ? getLevelBadge(scoreBreakdown.reviews.value) : null,
      desc: 'Log-scaled verified review history across past neighborhood jobs.',
    },
    {
      key: 'availability',
      icon: Clock,
      name: t('ranking.availability', 'Available right now'),
      weightText: '10% weight',
      detail: scoreBreakdown?.availability?.value !== undefined ? getLevelBadge(scoreBreakdown.availability.value) : null,
      desc: 'Checks active weekly hours, blackout time-offs, and live availability toggle.',
    },
    {
      key: 'verified',
      icon: ShieldCheck,
      name: t('ranking.verified', 'ID & license verified'),
      weightText: '10% weight',
      detail: scoreBreakdown?.verified?.value !== undefined ? getLevelBadge(scoreBreakdown.verified.value) : null,
      desc: 'Government ID, trade credentials, and address verification check.',
    },
    {
      key: 'responseTime',
      icon: Zap,
      name: t('ranking.responseTime', 'Response speed'),
      weightText: '10% weight',
      detail: scoreBreakdown?.responseTime?.value !== undefined ? getLevelBadge(scoreBreakdown.responseTime.value) : null,
      desc: 'Historical average quote response and communication speed.',
    },
    {
      key: 'price',
      icon: DollarSign,
      name: t('ranking.price', 'Competitive pricing'),
      weightText: '5% weight',
      detail: scoreBreakdown?.price?.value !== undefined ? getLevelBadge(scoreBreakdown.price.value) : null,
      desc: 'Transparent starting base rates relative to community benchmarks.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ranking.popoverTitle', 'Why is this pro ranked here?')}
      maxWidth="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
        >
          {t('common.close', 'Got It')}
        </button>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between p-3.5 bg-brand-50 rounded-2xl border border-brand-100">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
              Match Score for {businessName}
            </span>
            <span className="text-xl font-extrabold text-brand-900">
              {score ? `${Math.round(score * 100)}% Match` : 'Ranked Match'}
            </span>
          </div>
          <Sparkles className="w-8 h-8 text-brand-600" />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          {t(
            'ranking.popoverSubtitle',
            'Our transparent Bayesian ranking orders pros based on 7 objective neighborhood factors:'
          )}
        </p>

        <div className="space-y-2.5 divide-y divide-gray-100">
          {factors.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="pt-2.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{f.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">({f.weightText})</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
                <div className="shrink-0">{f.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
