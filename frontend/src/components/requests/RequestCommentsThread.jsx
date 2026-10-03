/**
 * RequestCommentsThread Component
 * Real-time messaging thread between customer and vendor for a service request.
 * Reference: Blueprint Section 10
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Send, MessageSquare, AlertCircle, Clock, User } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export default function RequestCommentsThread({
  requestId,
  isTerminal,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  // 1. Fetch comments with 10s auto-refresh
  const {
    data: commentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['request-comments', requestId],
    queryFn: async () => {
      const res = await apiClient(`/requests/${requestId}/comments`);
      return res?.data?.comments || [];
    },
    refetchInterval: 10000, // 10-second polling for active messages
  });

  // 2. Post comment mutation
  const commentMutation = useMutation({
    mutationFn: async (text) => {
      return apiClient(`/requests/${requestId}/comments`, {
        method: 'POST',
        body: { message: text },
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['request-comments', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request-details', requestId] });
    },
    onError: (err) => {
      alert(err.message || 'Failed to send comment.');
    },
  });

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim() || isTerminal || commentMutation.isPending) return;
    commentMutation.mutate(message.trim());
  };

  const comments = commentsData || [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          {t('requests.comments', 'Message Thread')}
        </h3>
        <span className="text-xs text-gray-400">
          {comments.length} {comments.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages List Container */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center py-6 text-xs text-gray-400">
            Loading messages...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            No messages yet. Send a note to coordinate arrival or clarify details.
          </div>
        ) : (
          comments.map((c) => {
            const isMe = c.userId === user?.id;
            const senderName =
              c.user?.customerProfile?.fullName ||
              c.user?.vendorProfile?.businessName ||
              (c.user?.role === 'CUSTOMER' ? 'Customer' : 'Vendor');

            return (
              <div
                key={c.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1 px-1">
                  <span className="font-semibold text-gray-700">{isMe ? 'You' : senderName}</span>
                  <span>•</span>
                  <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-gray-800 rounded-tl-xs'
                  }`}
                >
                  {c.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Box */}
      {isTerminal ? (
        <div className="p-3 bg-slate-50 border border-gray-200 rounded-2xl text-center text-xs text-gray-500">
          {t('requests.commentsDisabled', 'Messaging is closed for this service request.')}
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-2 pt-2">
          <div className="relative">
            <textarea
              rows={2}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('requests.commentsPlaceholder', 'Write a message...')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              disabled={commentMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{1000 - message.length} characters left</span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!message.trim() || commentMutation.isPending}
            >
              <Send className="w-3 h-3" /> Send
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
