/**
 * VendorRequestsPage Component
 * Vendor requests portal with status tabs (New, Accepted, In Progress, Done, Closed),
 * count badge on "New", and urgent highlighting.
 * Reference: Blueprint Sections 6, 10, 13
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Inbox,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle,
  AlertCircle,
  Tag,
  Search,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

export default function VendorRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('new'); // new | accepted | in_progress | completed | closed

  // 1. Fetch vendor requests for selected tab
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendor-requests', activeTab],
    queryFn: async () => {
      const res = await apiClient(`/requests?tab=${activeTab}&limit=50`);
      return res?.data?.requests || [];
    },
    refetchInterval: 30000,
  });

  // 2. Fetch new requests count for badge
  const { data: newRequestsData } = useQuery({
    queryKey: ['vendor-requests-new-count'],
    queryFn: async () => {
      const res = await apiClient(`/requests?tab=new&limit=1`);
      return res?.meta?.total || 0;
    },
    refetchInterval: 30000,
  });

  const newCount = typeof newRequestsData === 'number' ? newRequestsData : 0;
  const requests = requestsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Inbox className="w-3.5 h-3.5" /> Incoming Customer Leads
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Service Requests & Job Queue
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Accept customer bookings, schedule appointments, and coordinate work.
          </p>
        </div>

        <Link
          to="/vendor/availability"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto shadow-2xs"
        >
          <Calendar className="w-4 h-4 text-brand-600" /> Manage Working Hours
        </Link>
      </div>

      {/* Status Tabs with Badge on 'New' */}
      <div className="flex overflow-x-auto border-b border-gray-200 gap-2 text-xs sm:text-sm font-semibold">
        {[
          { key: 'new', label: t('requests.tabNew', 'New Inquiries'), badge: newCount },
          { key: 'accepted', label: t('requests.tabAccepted', 'Accepted') },
          { key: 'in_progress', label: t('requests.tabInProgress', 'In Progress') },
          { key: 'completed', label: t('requests.tabDone', 'Done') },
          { key: 'closed', label: t('requests.tabClosed', 'Closed') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-4 border-b-2 transition font-bold flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Loading incoming customer requests..." />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title={
            activeTab === 'new'
              ? 'No new service requests right now'
              : activeTab === 'accepted'
              ? 'No accepted jobs scheduled'
              : activeTab === 'in_progress'
              ? 'No active jobs in progress'
              : 'No closed requests'
          }
          description={
            activeTab === 'new'
              ? 'Tip: Boost your profile completeness and add clear service rate cards to attract more neighborhood customers.'
              : 'Requests will appear here as you accept and complete customer appointments.'
          }
          actionLabel="Edit Storefront Profile"
          onAction={() => navigate('/vendor/profile')}
          icon={Inbox}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/vendor/requests/${req.id}`)}
              className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Customer Name & Status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">
                      {req.service?.name || 'Service'}
                    </span>
                    <h3 className="font-extrabold text-gray-900 text-base">
                      {req.customer?.fullName || 'Customer'}
                    </h3>
                  </div>
                  <RequestStatusBadge status={req.status} />
                </div>

                {/* Urgent indicator */}
                {req.isUrgent && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-2">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                    {t('requests.urgentBadge', 'Urgent • Today')}
                  </div>
                )}

                {/* Description */}
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                  {req.description}
                </p>

                {/* Metadata */}
                <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {req.preferredDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Preferred: <strong>{req.preferredDate}</strong> ({req.preferredTimeSlot || 'Anytime'})
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

              {/* Action footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Received {new Date(req.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  Manage Request <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
