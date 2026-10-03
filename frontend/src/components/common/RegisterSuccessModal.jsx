import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { playWelcomeSound } from '../../utils/audioEffects';
import {
  RangoliMandala,
  MadhubaniLotusMotif,
  ToranRibbon,
  DeepamLampMotif,
} from './IndianArtDecorations';
import { CheckCircle2, Phone, ShieldCheck, ArrowRight, Sparkles, Star } from 'lucide-react';

export default function RegisterSuccessModal({
  isOpen,
  onClose,
  businessName,
  phone,
  city,
  role = 'VENDOR',
}) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      playWelcomeSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (onClose) onClose();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-50/95 via-white to-stone-50 rounded-3xl border-2 border-amber-300 shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Auspicious Garland */}
        <div className="absolute top-0 left-0 right-0">
          <ToranRibbon className="h-4 w-full text-amber-800/80" />
        </div>

        {/* Decorative Rangoli Motifs */}
        <RangoliMandala className="w-48 h-48 text-amber-900/10 absolute -top-12 -right-12 pointer-events-none" />
        <RangoliMandala className="w-48 h-48 text-amber-900/10 absolute -bottom-12 -left-12 pointer-events-none" />

        <div className="relative z-10 space-y-4 pt-2">
          {/* Auspicious Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold shadow-2xs">
            <DeepamLampMotif className="w-4 h-4 text-amber-800" />
            <span>{isEn ? 'Welcome to the Karigar Family!' : 'कारीगर परिवार में आपका हार्दिक स्वागत है!'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {role === 'VENDOR'
              ? (isEn ? 'Congratulations, Master Artisan!' : 'बधाई हो, कुशल कारीगर!')
              : (isEn ? 'Welcome, Respected Customer!' : 'स्वागत है, सम्मानीय ग्राहक!')}
          </h2>

          <p className="text-stone-600 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
            {role === 'VENDOR'
              ? (isEn
                  ? 'Your profile is now live. Customers in your neighborhood can now find your craft and call you directly with zero commission!'
                  : 'आपका कारीगर खाता सक्रिय हो गया है। आपके क्षेत्र के ग्राहक अब आपका काम देखकर सीधे आपको फोन कर सकेंगे — बिना किसी बिचौलिए या कमीशन के!')
              : (isEn
                  ? 'Your account is active. You can now discover, call, and review skilled artisans in your neighborhood!'
                  : 'आपका खाता सक्रिय हो गया है। अब आप अपने क्षेत्र के हुनरमंद कारीगरों से सीधे संपर्क कर सकते हैं!')}
          </p>

          {/* Artisan Summary Card */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="truncate max-w-[240px] font-black text-amber-950">
                {businessName || (isEn ? 'Skilled Artisan' : 'कुशल कारीगर')}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {isEn ? 'Active & Live' : 'सक्रिय'}
              </span>
            </div>

            <div className="text-[11px] text-stone-600 flex flex-wrap items-center gap-3">
              {phone && (
                <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                  <Phone className="w-3 h-3 text-amber-800" />
                  {phone}
                </span>
              )}
              {city && (
                <span className="text-stone-600">
                  📍 {city}
                </span>
              )}
            </div>
          </div>

          {/* 3 Simple Guidance Rules for Artisans */}
          {role === 'VENDOR' && (
            <div className="space-y-2 text-left pt-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500 block text-center">
                {isEn ? '3 Simple Steps to Succeed:' : 'शुरुआत के 3 सरल नियम:'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="font-bold text-emerald-800 block text-[11px] mb-0.5">
                    🟢 1. {isEn ? 'Duty Available' : 'ड्यूटी चालू रखें'}
                  </span>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {isEn ? 'Keep status "Available" when ready for calls.' : 'जब भी काम के लिए फ्री हों, ड्यूटी उपलब्ध रखें।'}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                    📞 2. {isEn ? 'Direct Calls' : 'सीधी बात'}
                  </span>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {isEn ? 'Clients call you directly on your phone.' : 'ग्राहक सीधे फोन करेंगे, काम व उचित दाम तय करें।'}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="font-bold text-stone-800 block text-[11px] mb-0.5">
                    ⭐ 3. {isEn ? 'Get Feedback' : 'समीक्षा पाएं'}
                  </span>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {isEn ? 'Good work brings positive neighborhood reviews.' : 'काम पूरा होने पर ग्राहक से रेटिंग अवश्य लें।'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleProceed}
            className="w-full mt-4 py-3 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <span>{role === 'VENDOR' ? (isEn ? 'Go to My Workboard' : 'मेरा कार्यपटल (Dashboard) देखें') : (isEn ? 'Explore Artisans' : 'कारीगर खोजें')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
