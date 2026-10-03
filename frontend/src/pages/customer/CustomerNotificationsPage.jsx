import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Star,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  ArrowRight,
  Filter
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import Button from '../../components/common/Button';

export default function CustomerNotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  // 1. Fetch notifications
  const { data, isLoading, isError } = useQuery({
    queryKey: ['all-notifications', filterUnreadOnly, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (filterUnreadOnly) {
        params.append('unread_only', 'true');
      }
      const res = await apiClient(`/notifications?${params.toString()}`);
      return res?.data || { notifications: [], unreadCount: 0, meta: {} };
    },
    enabled: Boolean(user),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = data?.meta?.totalPages || 1;

  // 2. Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      return apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    },
  });

  // 3. Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient('/notifications/read-all', { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    },
  });

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }

    const requestId = notif.metadata?.requestId;
    if (requestId) {
      if (user?.role === 'VENDOR') {
        navigate(`/vendor/requests/${requestId}`);
      } else {
        navigate(`/requests/${requestId}`);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'REQUEST_CREATED':
      case 'REQUEST_ACCEPTED':
      case 'REQUEST_IN_PROGRESS':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'REQUEST_COMPLETED':
        return <CheckCircle className="w-5 h-5 text-teal-600" />;
      case 'REQUEST_REJECTED':
      case 'REQUEST_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'REQUEST_EXPIRED':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'NEW_REVIEW':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-400" />;
      case 'REVIEW_REPLIED':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'VERIFICATION_APPROVED':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'VERIFICATION_REJECTED':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'ACCOUNT_SUSPENDED':
      case 'ACCOUNT_REACTIVATED':
        return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-600" />;
    }
  };

  const formatTimestamp = (dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('notifications.justNow', 'Just now');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins, defaultValue: `${diffMins}m ago` });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours, defaultValue: `${diffHours}h ago` });
    const diffDays = Math.floor(diffHours / 24);
    return t('notifications.daysAgo', { count: diffDays, defaultValue: `${diffDays}d ago` });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" /> Activity Stream
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Stay updated on your quotes, service status changes, and verified community feedback.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            {t('notifications.markAllRead', 'Mark all as read')}
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterUnreadOnly(false);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !filterUnreadOnly
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterUnreadOnly(true);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              filterUnreadOnly
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unread Only
            {unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterUnreadOnly ? 'bg-white text-emerald-700' : 'bg-red-500 text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Stream */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader count={4} height="h-20" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 text-sm">
          Failed to load notifications. Please refresh the page.
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={filterUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description={
            filterUnreadOnly
              ? 'You have read all your activity updates! Check the "All Activity" tab to see past logs.'
              : 'You have no activity notifications right now. Service updates and alerts will appear here.'
          }
          icon={CheckCheck}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const hasLink = Boolean(notif.metadata?.requestId);

            return (
              <div
                key={notif.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  !notif.isRead
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm ${
                          !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {formatTimestamp(notif.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => markReadMutation.mutate(notif.id)}
                      disabled={markReadMutation.isPending}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      Mark read
                    </button>
                  )}

                  {hasLink && (
                    <Button
                      variant={!notif.isRead ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleNotificationClick(notif)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      {t('notifications.viewDetails', 'View Request')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
