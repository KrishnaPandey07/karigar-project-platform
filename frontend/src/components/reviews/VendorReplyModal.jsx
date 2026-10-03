import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function VendorReplyModal({ isOpen, onClose, reviewId, customerName, onSuccess }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [reply, setReply] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const replyMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: { reply: reply.trim() },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['request-details'] });
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to submit reply. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reply.trim()) {
      setErrorMsg('Reply cannot be empty.');
      return;
    }
    setErrorMsg('');
    replyMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('reviews.replyToReview')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Responding publicly to <span className="font-semibold text-slate-800">{customerName || 'the customer'}</span>. Replies are permanent and visible to all future clients.
        </p>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <textarea
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={1000}
            placeholder={t('reviews.replyPlaceholder')}
            className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <div className="flex justify-end mt-1 text-[11px] text-slate-400">
            {reply.length} / 1000
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={replyMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={replyMutation.isPending}>
            {replyMutation.isPending ? 'Sending...' : t('reviews.submitReply')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
