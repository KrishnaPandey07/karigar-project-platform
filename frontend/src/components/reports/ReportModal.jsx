import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ReportModal({ isOpen, onClose, reportedUserId, targetName, requestId }) {
  const { t } = useTranslation();

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      return apiClient('/reports', {
        method: 'POST',
        body: {
          reported_user_id: reportedUserId,
          request_id: requestId || undefined,
          reason,
          details: details.trim() || undefined,
        },
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) {
      setErrorMsg('Please select a reason for the report.');
      return;
    }
    setErrorMsg('');
    reportMutation.mutate();
  };

  const handleClose = () => {
    setIsSuccess(false);
    setReason('');
    setDetails('');
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('reports.title')}
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-800">Report Received</h4>
          <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            {t('reports.success')}
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('reports.subtitle')} You are reporting <span className="font-semibold text-slate-800">{targetName || 'this user'}</span>.
          </p>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('reports.reasonLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="">{t('reports.selectReason')}</option>
              <option value="Fraud or Scam">{t('reports.reasonFraud')}</option>
              <option value="Unprofessional conduct">{t('reports.reasonUnprofessional')}</option>
              <option value="No show">{t('reports.reasonNoShow')}</option>
              <option value="Harassment or inappropriate behavior">{t('reports.reasonHarassment')}</option>
              <option value="Overcharging">{t('reports.reasonOvercharging')}</option>
              <option value="Other">{t('reports.reasonOther')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('reports.detailsLabel')}
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              placeholder={t('reports.detailsPlaceholder')}
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className="flex justify-end mt-1 text-[11px] text-slate-400">
              {details.length} / 2000
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={reportMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={reportMutation.isPending}
            >
              {reportMutation.isPending ? t('reports.submitting') : t('reports.submitReport')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
