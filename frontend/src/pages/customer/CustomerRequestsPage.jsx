/**
 * CustomerRequestsPage
 * Customer Service Requests List with Tabs (Active, Completed, Cancelled/Declined)
 * Reference: Blueprint Sections 5, 10, 13
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Calendar,
  MapPin,
  PlusCircle,
  ArrowRight,
  Zap,
  Ban,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

export default function CustomerRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active'); // active | completed | closed
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // 1. Fetch customer requests for the selected tab
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-requests', activeTab],
    queryFn: async () => {
      const res = await apiClient(`/requests?tab=${activeTab}&limit=30`);
      return res?.data?.requests || [];
    },
    refetchInterval: 30000, // 30s polling
  });

  // 2. Cancel request mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      return apiClient(`/requests/${requestId}/status`, {
        method: 'PATCH',
        body: { to: 'CANCELLED', reason },
      });
    },
    onSuccess: () => {
      setCancelModalItem(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['customer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
    onError: (err) => {
      if (err.statusCode === 409 || err.code === 'INVALID_TRANSITION') {
        alert(t('requests.conflictNotice', "This request was just updated. We've refreshed it for you."));
        refetch();
      } else {
        alert(err.message || 'Failed to cancel request.');
      }
    },
  });

  const handleOpenCancel = (req, e) => {
    e.stopPropagation();
    setCancelModalItem(req);
    setCancelReason('');
  };

  const handleConfirmCancel = () => {
    if (!cancelModalItem) return;
    if (cancelModalItem.status === 'ACCEPTED' && !cancelReason.trim()) {
      alert('Please provide a reason when cancelling an accepted request.');
      return;
    }
    cancelMutation.mutate({
      requestId: cancelModalItem.id,
      reason: cancelReason.trim(),
    });
  };

  const requests = requestsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" /> Service Request Tracker
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Service Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track inquiries, confirmed visits, quotes, and work in progress.
          </p>
        </div>

        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Request New Service
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 text-xs sm:text-sm font-semibold">
        {[
          { key: 'active', label: t('requests.tabActive', 'Active Requests') },
          { key: 'completed', label: t('requests.tabCompleted', 'Completed') },
          { key: 'closed', label: t('requests.tabClosed', 'Cancelled / Declined') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-4 border-b-2 transition font-bold ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Loading your service requests..." />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title={
            activeTab === 'active'
              ? 'No active service requests'
              : activeTab === 'completed'
              ? 'No completed jobs yet'
              : 'No cancelled requests'
          }
          description={
            activeTab === 'active'
              ? 'Find verified electricians, plumbers, tailors, or tutors nearby and submit an inquiry in minutes.'
              : 'Your past job history will appear here once service requests are fulfilled.'
          }
          actionLabel="Find Service Pros"
          onAction={() => navigate('/search')}
          icon={Search}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((req) => {
            const canCancel = req.status === 'REQUESTED' || req.status === 'ACCEPTED';
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/requests/${req.id}`)}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header: Vendor Name & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">
                        {req.service?.name || 'General Service'}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base">
                        {req.vendor?.businessName || 'Local Pro'}
                      </h3>
                    </div>
                    <RequestStatusBadge status={req.status} />
                  </div>

                  {/* Urgent priority badge */}
                  {req.isUrgent && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-2">
                      <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                      {t('requests.urgentBadge', 'Urgent • Today')}
                    </div>
                  )}

                  {/* Description preview */}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                    {req.description}
                  </p>

                  {/* Metadata: Date, Address, Agreed Price */}
                  <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {req.preferredDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {req.preferredDate} • {req.preferredTimeSlot || 'Anytime'}
                        </span>
                      </div>
                    )}
                    {req.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{req.address}</span>
                      </div>
                    )}
                    {req.agreedPrice && (
                      <div className="text-xs font-bold text-emerald-700 pt-1">
                        Agreed Price: ₹{req.agreedPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={(e) => handleOpenCancel(req, e)}
                      className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      {t('requests.cancelRequest', 'Cancel')}
                    </button>
                  ) : (
                    <div />
                  )}

                  <span className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Request Modal */}
      <Modal
        isOpen={Boolean(cancelModalItem)}
        onClose={() => setCancelModalItem(null)}
        title={t('requests.cancelRequest', 'Cancel Service Request')}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCancelModalItem(null)}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={
                cancelMutation.isPending ||
                (cancelModalItem?.status === 'ACCEPTED' && !cancelReason.trim())
              }
              onClick={handleConfirmCancel}
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
              Reason for Cancellation {cancelModalItem?.status === 'ACCEPTED' ? '*' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('requests.cancelReasonPlaceholder', 'Please provide a reason...')}
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              required={cancelModalItem?.status === 'ACCEPTED'}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
