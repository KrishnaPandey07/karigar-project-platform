/**
 * VendorRequestDetailsPage Component
 * Full vendor control interface for an individual customer service request.
 * Dynamic contextual action buttons (Accept, Reject, Start Work, Complete, Cancel),
 * quick-pick rejection reasons, timeline, and customer communication.
 * Reference: Blueprint Sections 6, 10, 13
 */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Zap,
  CheckCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Ban,
  AlertTriangle,
  Tag,
  DollarSign,
  Star,
  Flag,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import RequestCommentsThread from '../../components/requests/RequestCommentsThread';
import VendorReplyModal from '../../components/reviews/VendorReplyModal';
import ReportModal from '../../components/reports/ReportModal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const QUICK_PICK_REASONS = [
  'Fully booked today',
  'Outside service radius',
  'Cannot perform this specific job',
  'Scheduling conflict with another job',
];

export default function VendorRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Modals state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form fields
  const [agreedPrice, setAgreedPrice] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [conflictNotice, setConflictNotice] = useState(false);

  // 1. Fetch request details with 30s auto-refresh
  const {
    data: requestData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendor-request-details', id],
    queryFn: async () => {
      const res = await apiClient(`/requests/${id}`);
      return res?.data?.request || null;
    },
    refetchInterval: 30000,
  });

  // 2. Status Transition Mutation
  const transitionMutation = useMutation({
    mutationFn: async ({ to, reason, agreedPriceVal }) => {
      const body = { to };
      if (reason) body.reason = reason;
      if (agreedPriceVal) body.agreed_price = agreedPriceVal;

      return apiClient(`/requests/${id}/status`, {
        method: 'PATCH',
        body,
      });
    },
    onSuccess: () => {
      setAcceptModalOpen(false);
      setRejectModalOpen(false);
      setCompleteModalOpen(false);
      setCancelModalOpen(false);
      setAgreedPrice('');
      setReasonText('');
      setConflictNotice(false);

      queryClient.invalidateQueries({ queryKey: ['vendor-request-details', id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-requests-new-count'] });
    },
    onError: (err) => {
      if (err.statusCode === 409 || err.code === 'INVALID_TRANSITION') {
        setConflictNotice(true);
        refetch();
      } else {
        alert(err.message || 'Failed to update request status.');
      }
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading customer request details..." />;
  }

  if (error || !requestData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Service Request Not Found"
          message={error?.message || 'Unable to load customer service request.'}
          actionLabel="Back to Job Queue"
          onAction={() => navigate('/vendor/requests')}
        />
      </div>
    );
  }

  const req = requestData;
  const isTerminal = ['COMPLETED', 'CANCELLED', 'REJECTED', 'REVIEWED'].includes(req.status);
  const cleanPhone = req.customer?.phone ? req.customer.phone.replace(/[^0-9]/g, '') : '';

  // Handler helpers
  const handleAccept = () => {
    transitionMutation.mutate({
      to: 'ACCEPTED',
      agreedPriceVal: agreedPrice ? parseFloat(agreedPrice) : undefined,
    });
  };

  const handleReject = () => {
    if (!reasonText.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }
    transitionMutation.mutate({
      to: 'REJECTED',
      reason: reasonText.trim(),
    });
  };

  const handleStartWork = () => {
    transitionMutation.mutate({
      to: 'IN_PROGRESS',
    });
  };

  const handleComplete = () => {
    transitionMutation.mutate({
      to: 'COMPLETED',
      agreedPriceVal: agreedPrice ? parseFloat(agreedPrice) : undefined,
    });
  };

  const handleCancel = () => {
    if (!reasonText.trim()) {
      alert('Please provide a reason for cancelling this request.');
      return;
    }
    transitionMutation.mutate({
      to: 'CANCELLED',
      reason: reasonText.trim(),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/vendor/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Queue
        </Link>
        <span className="text-xs text-gray-400">
          Request ID: #{req.id.substring(0, 8)}
        </span>
      </div>

      {/* 409 Conflict Alert Banner */}
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

      {/* Hero Request Management Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                {req.service?.name || 'Service Job'}
              </span>
              <RequestStatusBadge status={req.status} size="sm" />
              {req.isUrgent && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Zap className="w-3 h-3 text-amber-600 fill-amber-600" /> Urgent (Today)
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {req.customer?.fullName || 'Customer Lead'}
            </h1>
          </div>

          {/* Contextual Action Buttons according to state */}
          <div className="flex flex-wrap items-center gap-2.5">
            {req.status === 'REQUESTED' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={transitionMutation.isPending}
                  onClick={() => setAcceptModalOpen(true)}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Accept Request
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={transitionMutation.isPending}
                  onClick={() => {
                    setReasonText('');
                    setRejectModalOpen(true);
                  }}
                >
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </Button>
              </>
            )}

            {req.status === 'ACCEPTED' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={transitionMutation.isPending}
                  onClick={handleStartWork}
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Start Work
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={transitionMutation.isPending}
                  onClick={() => {
                    setReasonText('');
                    setCancelModalOpen(true);
                  }}
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel Job
                </Button>
              </>
            )}

            {req.status === 'IN_PROGRESS' && (
              <Button
                variant="primary"
                size="sm"
                disabled={transitionMutation.isPending}
                onClick={() => setCompleteModalOpen(true)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Completed
              </Button>
            )}
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          {/* Left Column: Description & Scheduled Info */}
          <div className="space-y-4">
            <div>
              <span className="font-bold text-gray-700 block mb-1 text-xs">Customer Problem Description:</span>
              <p className="text-gray-800 bg-slate-50 p-4 rounded-2xl border border-gray-200 leading-relaxed text-xs">
                {req.description}
              </p>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  Requested Date: <strong>{req.preferredDate || 'Flexible'}</strong> ({req.preferredTimeSlot || 'Anytime'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Service Location: <strong>{req.address}</strong></span>
              </div>
              {req.agreedPrice && (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm pt-1">
                  <span>Agreed Price: ₹{req.agreedPrice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Contact Card */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-gray-200 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Customer Information
              </span>
              <h4 className="font-bold text-gray-900 text-base">
                {req.customer?.fullName}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {req.customer?.user?.email || 'Registered Customer'}
              </p>
            </div>

            {/* Direct Phone & WhatsApp Coordination */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              {req.customer?.phone ? (
                <>
                  <a
                    href={`tel:${req.customer.phone}`}
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Customer
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                  </a>
                </>
              ) : (
                <span className="flex-1 text-xs text-gray-400 italic">
                  Phone number will be shared once accepted.
                </span>
              )}
              {req.customer?.userId && (
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="p-2 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition shadow-2xs"
                  title="Report Customer"
                  aria-label="Report Customer"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Review Section */}
        {(req.status === 'REVIEWED' || req.review) && req.review && (
          <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Customer Verified Review</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(req.review.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                {req.review.createdAt ? new Date(req.review.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            {req.review.comment && (
              <p className="text-xs text-slate-700 italic bg-white/80 p-3 rounded-xl border border-amber-100 leading-relaxed">
                &ldquo;{req.review.comment}&rdquo;
              </p>
            )}

            {/* Vendor Reply */}
            {req.review.vendorReply ? (
              <div className="pl-4 border-l-2 border-emerald-500 space-y-1 pt-1">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  {t('reviews.vendorReply', 'Your Response')}
                </span>
                <p className="text-xs text-emerald-950 italic bg-white/80 p-3 rounded-xl border border-emerald-100">
                  &ldquo;{req.review.vendorReply}&rdquo;
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <span className="text-xs text-slate-600">
                  You haven&apos;t replied to this review yet. (One-time reply)
                </span>
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(true)}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Reply to Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Vertical Timeline (Left) & Messaging Thread (Right) */}
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

      {/* 1. Modal: Accept Request */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Service Request"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={transitionMutation.isPending}
              onClick={handleAccept}
            >
              {transitionMutation.isPending ? 'Accepting...' : 'Confirm Acceptance'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Accepting this request commits you to schedule work with {req.customer?.fullName}. You can optionally provide an agreed base quote.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Agreed Quote Amount ($) (Optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="e.g. 85.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* 2. Modal: Decline / Reject Request */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Decline Service Request"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={transitionMutation.isPending || !reasonText.trim()}
              onClick={handleReject}
            >
              {transitionMutation.isPending ? 'Declining...' : 'Confirm Decline'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Please select or specify a reason for declining. This explanation will be shared with the customer.
          </p>

          {/* Quick-Pick Reasons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-500 block">Quick Pick Reasons:</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReasonText(r)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    reasonText === r
                      ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Decline Reason *
            </label>
            <textarea
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter explanation for customer..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>
        </div>
      </Modal>

      {/* 3. Modal: Mark Complete */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Mark Service Job as Completed"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={transitionMutation.isPending}
              onClick={handleComplete}
            >
              {transitionMutation.isPending ? 'Completing...' : 'Mark Job Completed'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Great work! Marking this request complete unlocks the customer&apos;s ability to post a verified neighborhood review.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Final Invoiced Amount ($) (Optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="e.g. 110.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* 4. Modal: Vendor Cancel Request */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Accepted Job"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={transitionMutation.isPending || !reasonText.trim()}
              onClick={handleCancel}
            >
              {transitionMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Cancelling an already accepted job inconveniences the customer. A valid reason is strictly required.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Explain why you cannot fulfill this accepted appointment..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>
        </div>
      </Modal>

      {/* 5. Modal: Reply to Customer Review */}
      {req.review && (
        <VendorReplyModal
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          reviewId={req.review.id}
          customerName={req.customer?.fullName}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* 6. Modal: Report Customer */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUserId={req.customer?.userId}
        targetName={req.customer?.fullName}
        requestId={req.id}
      />
    </div>
  );
}
