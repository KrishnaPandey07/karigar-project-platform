import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { playDutySwitchSound } from '../../utils/audioEffects';
import { CheckCircle2, Clock, Moon, Loader2 } from 'lucide-react';

export const DUTY_STATES = {
  AVAILABLE: {
    key: 'AVAILABLE',
    labelHi: 'उपलब्ध (On Duty)',
    labelEn: 'Available (On Duty)',
    subtitleHi: 'ग्राहक अभी आपको कॉल कर सकते हैं',
    subtitleEn: 'Customers can call you directly now',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-800',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  BUSY: {
    key: 'BUSY',
    labelHi: 'काम में व्यस्त (Busy)',
    labelEn: 'Busy on Job',
    subtitleHi: 'अभी कार्य पर हैं, थोड़ी देर में उपलब्ध होंगे',
    subtitleEn: 'Currently at work, available soon',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-800',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  OFF_DUTY: {
    key: 'OFF_DUTY',
    labelHi: 'काम समाप्त (Off Duty)',
    labelEn: 'Off Duty (Resting)',
    subtitleHi: 'आज का काम समाप्त, विश्राम का समय',
    subtitleEn: 'Shift completed for today, resting',
    bgColor: 'bg-stone-500',
    lightBg: 'bg-stone-100',
    borderColor: 'border-stone-400',
    textColor: 'text-stone-700',
    dotColor: 'bg-stone-400',
    icon: Moon,
  },
};

export default function DutyStatusSwitcher({
  currentStatus = 'AVAILABLE',
  isAvailable = true,
  onChange,
  mode = 'full', // 'full' | 'compact'
  className = '',
}) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const queryClient = useQueryClient();

  // Normalize initial duty status
  const normalizedStatus = currentStatus || (isAvailable ? 'AVAILABLE' : 'OFF_DUTY');
  const [selectedStatus, setSelectedStatus] = useState(normalizedStatus);

  const mutation = useMutation({
    mutationFn: async (newStatus) => {
      return apiClient('/vendors/me/availability', {
        method: 'PATCH',
        body: {
          dutyStatus: newStatus,
          isAvailable: newStatus === 'AVAILABLE',
        },
      });
    },
    onSuccess: (res, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['search-vendors'] });
      if (onChange) onChange(newStatus);
    },
  });

  const handleSwitch = (statusKey) => {
    if (statusKey === selectedStatus && !mutation.isPending) return;
    setSelectedStatus(statusKey);
    playDutySwitchSound(statusKey);
    mutation.mutate(statusKey);
  };

  const activeConfig = DUTY_STATES[selectedStatus] || DUTY_STATES.AVAILABLE;

  if (mode === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-stone-100/90 rounded-2xl border border-stone-200 shadow-2xs ${className}`}>
        {Object.values(DUTY_STATES).map((state) => {
          const isSelected = selectedStatus === state.key;
          return (
            <button
              key={state.key}
              type="button"
              onClick={() => handleSwitch(state.key)}
              disabled={mutation.isPending}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                isSelected
                  ? `${state.lightBg} ${state.textColor} ring-1 ${state.borderColor} shadow-xs`
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${state.dotColor} ${
                  isSelected && state.key === 'AVAILABLE' ? 'animate-pulse' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {isEn ? state.labelEn.split(' ')[0] : state.labelHi.split(' ')[0]}
              </span>
            </button>
          );
        })}
        {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800 ml-1" />}
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 bg-white border-2 border-amber-200/90 rounded-3xl shadow-sm space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
            {isEn ? 'Live Work & Duty Status' : 'काम की वर्तमान स्थिति (ड्यूटी कंट्रोल)'}
          </span>
          <p className="text-xs text-stone-500 font-medium">
            {isEn
              ? 'Control whether customers see you as ready to take calls or off duty'
              : 'काम खत्म होने पर विश्राम या व्यस्त स्थिति तुरंत सेट करें'}
          </p>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${activeConfig.lightBg} ${activeConfig.textColor} border ${activeConfig.borderColor}`}>
          <span className={`w-2 h-2 rounded-full ${activeConfig.dotColor} ${selectedStatus === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
          <span>{isEn ? activeConfig.labelEn : activeConfig.labelHi}</span>
        </div>
      </div>

      {/* 3 Large Tactile Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {Object.values(DUTY_STATES).map((state) => {
          const isSelected = selectedStatus === state.key;
          const Icon = state.icon;

          return (
            <button
              key={state.key}
              type="button"
              onClick={() => handleSwitch(state.key)}
              disabled={mutation.isPending}
              className={`p-3.5 rounded-2xl text-left border-2 transition relative flex flex-col justify-between ${
                isSelected
                  ? `${state.lightBg} ${state.borderColor} shadow-xs ring-2 ring-amber-700/20`
                  : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-stone-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${state.dotColor} ${isSelected && state.key === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                  {isEn ? state.labelEn : state.labelHi}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? state.textColor : 'text-stone-400'}`} />
              </div>

              <p className="text-[11px] text-stone-600 font-medium leading-tight">
                {isEn ? state.subtitleEn : state.subtitleHi}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
