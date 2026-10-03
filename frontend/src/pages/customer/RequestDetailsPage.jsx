/**
 * RequestDetailsPage Component
 * Detailed customer view for a service request:
 * Vertical status timeline, vendor direct contact (Call/WhatsApp), comments thread, and cancellation action.
 * Reference: Blueprint Sections 6, 10, 13
 */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Clock,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Star,
  User,
  ShieldCheck,
  Flag,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import RequestCommentsThread from '../../components/requests/RequestCommentsThread';
import ReviewModal from '../../components/reviews/ReviewModal';
import ReportModal from '../../components/reports/ReportModal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

export default function RequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [conflictNotice, setConflictNotice] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // 1. Fetch request details with 30-second background polling
  const {
    data: requestData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['request-details', id],
    queryFn: async () => {
      const res = await apiClient(`/requests/${id}`);
      return res?.data?.request || null;
    },
    refetchInterval: 30000,
  });

  // 2. Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (reason) => {
      return apiClient(`/requests/${id}/status`, {
        method: 'PATCH',
        body: { to: 'CANCELLED', reason },
      });
    },
    onSuccess: () => {
      setCancelModalOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['request-details', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-requests'] });
    },
    onError: (err) => {
      if (err.statusCode === 409 || err.code === 'INVALID_TRANSITION') {
        setConflictNotice(true);
        refetch();
      } else {
        alert(err.message || 'Failed to cancel request.');
      }
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading service request details and timeline..." />;
  }

  if (error || !requestData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Request Not Found"
          message={error?.message || 'The requested service request could not be loaded.'}
          actionLabel="Back to My Requests"
          onAction={() => navigate('/requests')}
        />
      </div>
    );
  }

  const req = requestData;
  const isTerminal = ['COMPLETED', 'CANCELLED', 'REJECTED', 'REVIEWED'].includes(req.status);
  const canCancel = req.status === 'REQUESTED' || req.status === 'ACCEPTED';
  const cleanPhone = req.vendor?.phone ? req.vendor.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Requests
        </Link>
        <span className="text-xs text-gray-400">
          Request ID: #{req.id.substring(0, 8)}
        </span>
      </div>

      {/* 409 Conflict Notice Banner */}
      {conflictNotice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('requests.conflictNotice', "This request was just updated. We've refreshed it for you.")}</span>
          </div>
          <button
            type="button"
            onClick={() => setConflictNotice(false)}
            className="font-bold underline text-amber-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                {req.service?.name || 'General Service'}
              </span>
              <RequestStatusBadge status={req.status} size="sm" />
              {req.isUrgent && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-600" /> Urgent
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {req.vendor?.businessName || 'Local Service Pro'}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50"
              title="Report vendor"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t('reports.buttonText', 'Report')}</span>
            </button>

            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Request
              </Button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          {/* Left Column: Description & Metadata */}
          <div className="space-y-4">
            <div>
              <span className="font-bold text-gray-700 block mb-1 text-xs">Job Description:</span>
              <p className="text-gray-800 bg-slate-50 p-4 rounded-2xl border border-gray-200 leading-relaxed text-xs">
                {req.description}
              </p>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  Preferred Date: <strong>{req.preferredDate || 'Flexible'}</strong> ({req.preferredTimeSlot || 'Anytime'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Service Address: <strong>{req.address}</strong></span>
              </div>
              {req.agreedPrice && (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm pt-1">
                  <span>Agreed Price: ₹{req.agreedPrice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Vendor Direct Contact Card */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-gray-200 space-y-4 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              {req.vendor?.avatarUrl ? (
                <img
                  src={req.vendor.avatarUrl}
                  alt={req.vendor.businessName}
                  className="w-12 h-12 rounded-xl object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-xl flex items-center justify-center">
                  {req.vendor?.businessName?.charAt(0) || 'V'}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {req.vendor?.businessName}
                </h4>
                <p className="text-xs text-gray-500">
                  {req.vendor?.address || 'Local Professional'}
                </p>
              </div>
            </div>

            {/* Direct Contact Buttons (Active) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
              {req.vendor?.phone ? (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-600 bg-white p-2 rounded-xl border border-gray-200">
                    <span className="font-medium text-gray-500">Direct Phone:</span>
                    <strong className="text-gray-900 font-mono">{req.vendor.phone}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${req.vendor.phone}`}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Pro
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                    </a>
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">No phone number available</span>
              )}
            </div>
          </div>
        </div>

        {/* Completed: Rate Your Service */}
        {req.status === 'COMPLETED' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  {t('reviews.title', 'Leave a Review')}
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {t(
                    'requests.reviewPrompt',
                    'Your job is complete! Leave a verified review to help your neighborhood.'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shadow-xs"
            >
              {t('reviews.reviewNow', 'Review Now')}
            </button>
          </div>
        )}

        {/* Reviewed Status: Display Verified Review Card */}
        {(req.status === 'REVIEWED' || req.review) && (
          <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Your Verified Review</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(req.review?.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                {req.review?.createdAt ? new Date(req.review.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            {req.review?.comment && (
              <p className="text-xs text-slate-700 italic bg-white/80 p-3 rounded-xl border border-amber-100 leading-relaxed">
                &ldquo;{req.review.comment}&rdquo;
              </p>
            )}
            {req.review?.vendorReply && (
              <div className="pl-4 border-l-2 border-emerald-500 space-y-1 pt-1">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  {t('reviews.vendorReply', 'Vendor Response')}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {req.review.vendorReply}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Vertical Status Timeline (Left) & Messages Thread (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Status History & Timeline
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {(!req.statusHistory || req.statusHistory.length === 0) ? (
              <p className="text-xs text-gray-500 italic">No timeline entries yet.</p>
            ) : (
              req.statusHistory.map((step, idx) => (
                <div key={step.id || idx} className="relative">
                  <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        {step.toStatus || req.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(step.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {step.note && (
                      <p className="text-xs text-gray-600 mt-0.5">{step.note}</p>
                    )}
                    {step.reason && (
                      <p className="text-xs text-gray-500 italic mt-0.5">
                        Reason: &ldquo;{step.reason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messaging Thread */}
        <RequestCommentsThread requestId={req.id} isTerminal={isTerminal} />
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={t('requests.cancelRequest', 'Cancel Service Request')}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={
                cancelMutation.isPending ||
                (req.status === 'ACCEPTED' && !cancelReason.trim())
              }
              onClick={() => cancelMutation.mutate(cancelReason.trim())}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            {t(
              'requests.cancelPrompt',
              'Why are you cancelling this request? This will notify the service professional.'
            )}
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Reason for Cancellation {req.status === 'ACCEPTED' ? '*' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('requests.cancelReasonPlaceholder', 'Please provide a reason...')}
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              required={req.status === 'ACCEPTED'}
            />
          </div>
        </div>
      </Modal>

      {/* Phase 6 Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        requestId={req.id}
        vendorName={req.vendor?.businessName}
        onSuccess={() => refetch()}
      />

      {/* Phase 6 Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUserId={req.vendor?.userId || req.vendor?.id}
        targetName={req.vendor?.businessName}
        requestId={req.id}
      />
    </div>
  );
}
