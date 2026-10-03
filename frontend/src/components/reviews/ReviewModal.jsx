import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import Modal from '../common/Modal';
import Button from '../common/Button';
import {
  playStarSelectSound,
  playFeedbackSuccessSound,
} from '../../utils/audioEffects';
import {
  MadhubaniLotusMotif,
  DeepamLampMotif,
} from '../common/IndianArtDecorations';
import { Star, CheckCircle2, Heart, Sparkles, ThumbsUp } from 'lucide-react';

const PRAISE_TAGS = [
  { id: 'punctual', hi: '⏱️ समय के पाबंद (Punctual)', en: '⏱️ Punctual' },
  { id: 'fair_price', hi: '💰 उचित व स्पष्ट मूल्य (Fair Price)', en: '💰 Fair Price' },
  { id: 'skilled', hi: '🛠️ कुशल कारीगरी (Skilled Work)', en: '🛠️ Highly Skilled' },
  { id: 'clean', hi: '🧹 साफ-सफाई से काम (Clean & Tidy)', en: '🧹 Clean & Tidy' },
  { id: 'polite', hi: '🙏 विनम्र व आदरपूर्ण (Polite & Respectful)', en: '🙏 Polite & Respectful' },
  { id: 'fast', hi: '⚡ त्वरित समाधान (Quick Fix)', en: '⚡ Quick Solution' },
];

const STAR_LABELS = {
  5: { hi: 'उत्कृष्ट व श्रेष्ठ काम! (Masterful Craftsmanship)', en: 'Outstanding Craftsmanship!' },
  4: { hi: 'बहुत बढ़िया काम (Very Good Work)', en: 'Very Good Work' },
  3: { hi: 'संतोषजनक काम (Satisfactory)', en: 'Satisfactory Work' },
  2: { hi: 'सुधार की आवश्यकता (Needs Improvement)', en: 'Needs Improvement' },
  1: { hi: 'असंतोषजनक (Unsatisfactory)', en: 'Unsatisfactory' },
};

export default function ReviewModal({ isOpen, onClose, requestId, vendorName, onSuccess }) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const tagText = selectedTags.length > 0
        ? (isEn
            ? `[Key Highlights: ${selectedTags.map(t => t.en).join(', ')}] `
            : `[विशेषताएं: ${selectedTags.map(t => t.hi).join(', ')}] `)
        : '';

      const finalComment = `${tagText}${comment.trim()}`.trim();

      return apiClient('/reviews', {
        method: 'POST',
        body: {
          request_id: requestId,
          rating,
          comment: finalComment || undefined,
        },
      });
    },
    onSuccess: (data) => {
      playFeedbackSuccessSound();
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['request-details', requestId] });
      queryClient.invalidateQueries({ queryKey: ['customer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      if (onSuccess) onSuccess(data);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2400);
    },
    onError: (err) => {
      setErrorMsg(err.message || (isEn ? 'Failed to submit feedback.' : 'समीक्षा दर्ज नहीं हो सकी।'));
    },
  });

  const handleStarClick = (star) => {
    setRating(star);
    playStarSelectSound(star);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      }
      return [...prev, tag];
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg(isEn ? 'Please choose a rating.' : 'कृपया स्टार रेटिंग चुनें।');
      return;
    }
    setErrorMsg('');
    submitReviewMutation.mutate();
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={null}>
        <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <DeepamLampMotif className="w-3.5 h-3.5 text-amber-800" />
            <span>{isEn ? 'Gratitude & Respect' : 'कारीगर सम्मान व आभार'}</span>
          </div>

          <h3 className="text-2xl font-black text-stone-900">
            {isEn ? 'Thank You for Your Feedback!' : 'आपकी समीक्षा के लिए धन्यवाद!'}
          </h3>

          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {isEn
              ? `Your review honors the honest craft of ${vendorName || 'the artisan'} and helps neighborhood neighbors find trustworthy artisans!`
              : `आपकी यह सच्ची समीक्षा ${vendorName || 'कारीगर'} के परिश्रम का सच्चा सम्मान है और अन्य पड़ोसियों को भी सही कारीगर चुनने में मदद करेगी!`}
          </p>

          <div className="pt-2">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
              ✨ {isEn ? '5-Star Direct Connection' : 'कारीगर • सीधा संपर्क'}
            </span>
          </div>
        </div>
      </Modal>
    );
  }

  const currentStarLabel = STAR_LABELS[hoverRating || rating] || STAR_LABELS[5];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MadhubaniLotusMotif className="w-4 h-4 text-amber-800" />
          <span>{isEn ? 'Rate & Appreciate Artisan' : 'कारीगर का काम व सच्ची समीक्षा'}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          {isEn
            ? `How was your experience with ${vendorName || 'the artisan'}? Your honest rating motivates hard work!`
            : `${vendorName || 'कारीगर'} का काम कैसा रहा? आपके 2 शब्द उनके हुनर और ईमानदारी का सच्चा सम्मान हैं।`}
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* 5-Star Interactive Rating with Sound */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50/70 to-stone-50 rounded-2xl border border-amber-200 text-center space-y-1.5">
          <label className="block text-xs font-bold text-stone-800">
            {isEn ? 'Tap Stars to Rate' : 'स्टार रेटिंग चुनें (1 से 5)'} <span className="text-rose-600">*</span>
          </label>

          <div className="flex items-center justify-center gap-2 py-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      active
                        ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                        : 'text-stone-300 fill-none'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-xs font-bold text-amber-950">
            <span>{isEn ? currentStarLabel.en : currentStarLabel.hi}</span>
            <span className="text-stone-400 font-normal ml-1">({hoverRating || rating} / 5)</span>
          </div>
        </div>

        {/* Quick Appreciation Badges */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-800">
            {isEn ? 'Quick Appreciation Highlights:' : 'कारीगर की क्या बात अच्छी लगी? (जल्दी चुनें):'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRAISE_TAGS.map((tag) => {
              const isSelected = selectedTags.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition ${
                    isSelected
                      ? 'bg-amber-800 text-amber-50 border-amber-800 shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                >
                  {isEn ? tag.en : tag.hi}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-800">
            {isEn ? 'Your Words of Appreciation (Optional):' : 'अपने अनुभव के बारे में लिखें (वैकल्पिक):'}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder={
              isEn
                ? 'e.g. Arrived on time, fixed the issue cleanly, very polite and charged fair rates!'
                : 'उदा. समय पर पहुंचे, काम बहुत सफाई से किया और उचित मूल्य लिया। बहुत ही विनम्र व्यवहार!'
            }
            className="w-full text-xs sm:text-sm p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-800 outline-none resize-none font-medium"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitReviewMutation.isPending}>
            {isEn ? 'Cancel' : 'रद्द करें'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitReviewMutation.isPending}
            className="bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold"
          >
            {submitReviewMutation.isPending
              ? (isEn ? 'Submitting...' : 'समीक्षा दर्ज हो रही है...')
              : (isEn ? 'Submit Review & Gratitude' : 'समीक्षा व सम्मान दर्ज करें')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
