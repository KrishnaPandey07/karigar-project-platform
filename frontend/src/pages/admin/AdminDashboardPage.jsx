/**
 * AdminDashboardPage Component
 * Comprehensive administrative console for platform operations,
 * metrics, vendor verification queue, user moderation, and audit trail.
 * Reference: Blueprint Sections 7, 11, 13, 16
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Users,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Search,
  Filter,
  Eye,
  Ban,
  RefreshCw,
  Award,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  Activity,
  ArrowRight,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RatingStars from '../../components/common/RatingStars';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

function formatDocumentBadge(docTypeString) {
  if (!docTypeString) return { label: 'Verification Document', number: null, icon: '📄', color: 'bg-slate-50 border-slate-200 text-slate-800' };

  let [type, ...rest] = docTypeString.split(':');
  type = type.trim();
  const number = rest.length > 0 ? rest.join(':').trim() : null;

  switch (type) {
    case 'AADHAAR_CARD':
      return { label: 'Aadhaar Card (UIDAI)', number, icon: '🪪', color: 'bg-orange-50 border-orange-200 text-orange-900' };
    case 'PAN_CARD':
      return { label: 'PAN Card (Income Tax)', number, icon: '💳', color: 'bg-blue-50 border-blue-200 text-blue-900' };
    case 'VOTER_ID':
      return { label: 'Voter ID Card (EPIC)', number, icon: '🗳️', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' };
    case 'DRIVING_LICENSE':
      return { label: 'Driving Licence', number, icon: '🚗', color: 'bg-amber-50 border-amber-200 text-amber-900' };
    case 'PASSPORT':
      return { label: 'Passport', number, icon: '🛂', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' };
    case 'TRADE_LICENSE':
      return { label: 'Trade License / Shop Act', number, icon: '🏢', color: 'bg-slate-50 border-slate-200 text-slate-900' };
    case 'GST_MSME':
      return { label: 'GST / MSME Certificate', number, icon: '📑', color: 'bg-purple-50 border-purple-200 text-purple-900' };
    case 'CERTIFICATE':
      return { label: 'Skill / Vocational Certificate', number, icon: '📜', color: 'bg-teal-50 border-teal-200 text-teal-900' };
    case 'INSURANCE':
      return { label: 'Insurance Policy', number, icon: '🛡️', color: 'bg-sky-50 border-sky-200 text-sky-900' };
    default:
      return { label: type.replace(/_/g, ' '), number, icon: '📄', color: 'bg-gray-50 border-gray-200 text-gray-900' };
  }
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user: currentAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionError, setActionError] = useState('');

  // Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('PENDING');
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');

  // 1. Fetch Metrics Query
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await apiClient('/admin/metrics');
      return res?.data || null;
    },
    refetchInterval: 30000,
  });

  // 2. Fetch Users Query
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users', userSearchQuery, userRoleFilter, userStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userSearchQuery.trim()) params.append('q', userSearchQuery.trim());
      if (userRoleFilter !== 'ALL') params.append('role', userRoleFilter);
      if (userStatusFilter !== 'ALL') params.append('status', userStatusFilter);
      params.append('limit', '50');

      const res = await apiClient(`/admin/users?${params.toString()}`);
      return res?.data?.users || [];
    },
    enabled: activeTab === 'users',
  });

  // 3. Fetch Verifications Query
  const {
    data: verificationsData,
    isLoading: verificationsLoading,
    refetch: refetchVerifications,
  } = useQuery({
    queryKey: ['admin-verifications', verificationStatusFilter],
    queryFn: async () => {
      const res = await apiClient(`/admin/verifications?status=${verificationStatusFilter}&limit=50`);
      return res?.data?.verifications || [];
    },
    enabled: activeTab === 'verifications',
  });

  // 4. Fetch Reports Query
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['admin-reports', reportStatusFilter],
    queryFn: async () => {
      const res = await apiClient(`/admin/reports?status=${reportStatusFilter}&limit=50`);
      return res?.data?.reports || [];
    },
    enabled: activeTab === 'reports',
  });

  // 5. Fetch Audit Logs Query
  const {
    data: auditLogsData,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await apiClient('/admin/audit-logs?limit=50');
      return res?.data?.logs || [];
    },
    enabled: activeTab === 'audit',
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: async ({ id, action, reason }) => {
      return apiClient(`/admin/verifications/${id}`, {
        method: 'PATCH',
        body: {
          action,
          rejectionReason: reason || undefined,
        },
      });
    },
    onSuccess: () => {
      setRejectModalOpen(false);
      setSelectedVerification(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to update verification status.');
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      return apiClient(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: {
          status,
          resolutionNotes: notes || undefined,
        },
      });
    },
    onSuccess: () => {
      setResolveModalOpen(false);
      setSelectedReport(null);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to update report.');
    },
  });

  const userStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      return apiClient(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: {
          status,
          reason: reason || undefined,
        },
      });
    },
    onSuccess: () => {
      setSuspendModalOpen(false);
      setSelectedUser(null);
      setSuspendReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to update user status.');
    },
  });

  if (metricsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingState message="Connecting to LocalLink administration console..." />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState
          title="Could not connect to Admin Console"
          message={metricsError.message}
          onRetry={refetchMetrics}
        />
      </div>
    );
  }

  const { users = {}, requests = {}, reviews = {}, queues = {}, recentAuditLogs = [] } = metricsData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                Platform Operations
              </span>
              <span className="text-xs text-purple-200">
                Logged in as <strong>{currentAdmin?.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('admin.title', 'Administration Console')}
            </h1>
            <p className="text-sm text-purple-200/80 mt-1 max-w-xl">
              {t('admin.subtitle', 'Platform operations, verification queue, dispute resolution, and audit logs')}
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="block text-2xl font-black text-amber-300">
                {queues.pendingVerifications || 0}
              </span>
              <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
                Verifications
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="block text-2xl font-black text-rose-300">
                {queues.pendingReports || 0}
              </span>
              <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
                Open Reports
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Error Notification Banner */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="font-bold underline text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 text-sm font-semibold">
        {[
          { id: 'overview', label: t('admin.tabOverview', 'Overview'), icon: Activity },
          {
            id: 'verifications',
            label: t('admin.tabVerifications', 'Verifications'),
            icon: Award,
            count: queues.pendingVerifications,
          },
          {
            id: 'reports',
            label: t('admin.tabReports', 'Reports & Disputes'),
            icon: AlertTriangle,
            count: queues.pendingReports,
          },
          { id: 'users', label: t('admin.tabUsers', 'User Accounts'), icon: Users },
          { id: 'audit', label: t('admin.tabAudit', 'Audit Trail'), icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActionError('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-white text-purple-800' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Users */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Community</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-gray-900">{users.total || 0}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>{users.customers || 0} Customers</span>
                <span>•</span>
                <span>{users.vendors || 0} Vendors</span>
              </div>
            </div>

            {/* Card 2: Service Requests */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Service Bookings</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-gray-900">{requests.total || 0}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>{requests.byStatus?.COMPLETED || 0} Completed</span>
                <span>•</span>
                <span>{requests.byStatus?.IN_PROGRESS || 0} In Progress</span>
              </div>
            </div>

            {/* Card 3: Reviews & Ratings */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Community Trust</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{reviews.avgRating || 0.0}</span>
                <span className="text-xs font-bold text-gray-400">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>{reviews.total || 0} Verified Reviews</span>
              </div>
            </div>

            {/* Card 4: Action Queue */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Action Items</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-rose-600">
                {(queues.pendingVerifications || 0) + (queues.pendingReports || 0)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>{queues.pendingVerifications || 0} Verif.</span>
                <span>•</span>
                <span>{queues.pendingReports || 0} Disputes</span>
              </div>
            </div>
          </div>

          {/* Operational Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Lifecycle Distribution */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Requests Lifecycle Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Requested', count: requests.byStatus?.REQUESTED || 0, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Accepted', count: requests.byStatus?.ACCEPTED || 0, color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'In Progress', count: requests.byStatus?.IN_PROGRESS || 0, color: 'bg-amber-50 text-amber-700' },
                  { label: 'Completed', count: requests.byStatus?.COMPLETED || 0, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Reviewed', count: requests.byStatus?.REVIEWED || 0, color: 'bg-purple-50 text-purple-700' },
                  { label: 'Cancelled / Rejected', count: (requests.byStatus?.CANCELLED || 0) + (requests.byStatus?.REJECTED || 0), color: 'bg-gray-100 text-gray-700' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl ${item.color} space-y-1`}>
                    <span className="text-[11px] font-semibold block">{item.label}</span>
                    <span className="text-xl font-extrabold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Log Ticker */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Recent Administrative Actions
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700"
                >
                  View All &rarr;
                </button>
              </div>

              {recentAuditLogs.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4">No audit actions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentAuditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{log.action}</span>
                        <span className="text-gray-500 block text-[11px]">
                          By {log.admin?.email} • Target: {log.targetType}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          {/* Sub-Filter Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setVerificationStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    verificationStatusFilter === st
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={() => refetchVerifications()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </Button>
          </div>

          {verificationsLoading ? (
            <LoadingState message="Fetching verification submissions..." />
          ) : !verificationsData || verificationsData.length === 0 ? (
            <EmptyState
              title={t('admin.noPendingVerifications', 'No vendor verifications in this status.')}
              description="All prospective service providers have been reviewed."
            />
          ) : (
            <div className="space-y-4">
              {verificationsData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-extrabold text-gray-900">
                          {item.vendor?.businessName}
                        </span>
                        <VerifiedBadge isVerified={item.vendor?.isVerified} />
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Submitted by: <strong>{item.vendor?.user?.email}</strong></span>
                        {item.vendor?.phone && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${item.vendor.phone}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition"
                              title="Click to call vendor"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {item.vendor.phone}
                            </a>
                            <a
                              href={`https://wa.me/${item.vendor.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition"
                              title="Chat with vendor on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              WhatsApp
                            </a>
                          </div>
                        )}
                        <span>• Address: {item.vendor?.address || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Contextual verification action buttons */}
                    {item.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={verifyMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Approve verification for ${item.vendor?.businessName}? This grants them a verified badge.`)) {
                              verifyMutation.mutate({ id: item.id, action: 'APPROVE' });
                            }
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Pro
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={verifyMutation.isPending}
                          onClick={() => {
                            setSelectedVerification(item);
                            setRejectionReason('');
                            setRejectModalOpen(true);
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  <div>
                    <span className="text-xs font-bold text-gray-700 block mb-2">
                      Submitted Verification Credentials & Identity Documents:
                    </span>
                    {(!item.documents || item.documents.length === 0) ? (
                      <span className="text-xs text-gray-400 italic">No document files attached.</span>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {item.documents.map((doc) => {
                          const badge = formatDocumentBadge(doc.documentType);
                          return (
                            <a
                              key={doc.id}
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2.5 px-3.5 py-2 border rounded-xl text-xs font-semibold hover:shadow-xs transition ${badge.color}`}
                            >
                              <span className="text-base">{badge.icon}</span>
                              <div className="text-left">
                                <span className="block font-bold">{badge.label}</span>
                                {badge.number && (
                                  <span className="block text-[11px] opacity-80 font-mono">
                                    ID: {badge.number}
                                  </span>
                                )}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-1" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Rejection notice if present */}
                  {item.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <strong>Rejection explanation:</strong> {item.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORTS & DISPUTES */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reportStatusFilter === st
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={() => refetchReports()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Reports
            </Button>
          </div>

          {reportsLoading ? (
            <LoadingState message="Loading reported moderation cases..." />
          ) : !reportsData || reportsData.length === 0 ? (
            <EmptyState
              title={t('admin.noReports', 'No moderation reports found in this status.')}
              description="Platform community behavior is in great standing."
            />
          ) : (
            <div className="space-y-4">
              {reportsData.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {rep.reason}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            rep.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rep.status === 'DISMISSED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">
                        Reported User:{' '}
                        {rep.reportedUser?.customerProfile?.fullName ||
                          rep.reportedUser?.vendorProfile?.businessName ||
                          rep.reportedUser?.email}
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({rep.reportedUser?.role} • Status: {rep.reportedUser?.status})
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Filed by: {rep.reporter?.email} ({rep.reporter?.role}) •{' '}
                        {new Date(rep.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {rep.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(rep);
                            setResolutionNotes('');
                            setResolveModalOpen(true);
                          }}
                        >
                          Resolve & Note
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Dismiss this report as unfounded or invalid?')) {
                              reportMutation.mutate({
                                id: rep.id,
                                status: 'DISMISSED',
                                notes: 'Dismissed by admin review.',
                              });
                            }
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  {rep.details && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed">
                      <strong>Reporter explanation:</strong> &ldquo;{rep.details}&rdquo;
                    </div>
                  )}

                  {rep.request && (
                    <div className="text-xs text-gray-600 bg-purple-50/50 p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                      <span>
                        Linked Service Request: <strong>{rep.request.service?.name}</strong> (Status: {rep.request.status})
                      </span>
                    </div>
                  )}

                  {rep.resolutionNotes && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <strong>Admin Resolution Note:</strong> {rep.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USER ACCOUNTS & SUSPENSION */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search user by email, customer name, or business..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="VENDOR">Vendors</option>
                <option value="ADMIN">Admins</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <LoadingState message="Loading community user list..." />
          ) : !usersData || usersData.length === 0 ? (
            <EmptyState
              title="No users matched your search criteria."
              description="Try adjusting query filters or clearing search text."
            />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">User / Business</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersData.map((u) => {
                      const isSelf = u.id === currentAdmin?.id;
                      const isSuspended = u.status === 'SUSPENDED';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {u.customerProfile?.fullName || u.vendorProfile?.businessName || 'User'}
                            </div>
                            <div className="text-[11px] text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'VENDOR'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isSelf ? (
                              <span className="text-gray-400 italic text-[11px]">Your Account</span>
                            ) : isSuspended ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Reactivate account for ${u.email}?`)) {
                                    userStatusMutation.mutate({ id: u.id, status: 'ACTIVE' });
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                              >
                                {t('admin.unsuspend', 'Reactivate')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setSuspendReason('');
                                  setSuspendModalOpen(true);
                                }}
                                className="px-3 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition"
                              >
                                {t('admin.suspend', 'Suspend')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PLATFORM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Administrative Audit Log History
            </h3>
            <Button variant="secondary" size="sm" onClick={() => refetchAudit()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {auditLoading ? (
            <LoadingState message="Loading administrative audit history..." />
          ) : !auditLogsData || auditLogsData.length === 0 ? (
            <EmptyState
              title={t('admin.noAuditLogs', 'No audit logs recorded yet.')}
              description="Actions taken by administrators will appear here."
            />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Admin Email</th>
                      <th className="px-6 py-4">Target Entity</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogsData.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{log.action}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {log.admin?.email || 'Admin'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {log.targetType} (#{log.targetId?.substring(0, 8)})
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {log.ipAddress || 'Internal'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Reject Vendor Verification */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Vendor Verification"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={verifyMutation.isPending || !rejectionReason.trim()}
              onClick={() => {
                verifyMutation.mutate({
                  id: selectedVerification.id,
                  action: 'REJECT',
                  reason: rejectionReason.trim(),
                });
              }}
            >
              {verifyMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Please provide a clear reason for rejecting the verification request for{' '}
            <strong>{selectedVerification?.vendor?.businessName}</strong>. This feedback will be
            delivered to the vendor so they can re-apply.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Expired business license, illegible photograph, or missing government seal..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>
        </div>
      </Modal>

      {/* Modal 2: Resolve Report */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Moderation Report"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={reportMutation.isPending}
              onClick={() => {
                reportMutation.mutate({
                  id: selectedReport.id,
                  status: 'RESOLVED',
                  notes: resolutionNotes.trim() || 'Resolved following administrative review.',
                });
              }}
            >
              {reportMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Record the outcome or action taken for this dispute.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Resolution Action & Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Spoke with vendor, agreed refund issued, or verbal warning provided..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal 3: Suspend User Account */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend User Account"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={userStatusMutation.isPending}
              onClick={() => {
                userStatusMutation.mutate({
                  id: selectedUser.id,
                  status: 'SUSPENDED',
                  reason: suspendReason.trim(),
                });
              }}
            >
              {userStatusMutation.isPending ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <strong>Warning:</strong> Suspending <strong>{selectedUser?.email}</strong> will revoke
            their login sessions and hide any active services and listings from search results.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Reason for Suspension
            </label>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Describe terms violation or customer complaints..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
