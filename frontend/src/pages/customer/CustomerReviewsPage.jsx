/**
 * CustomerReviewsPage Component
 * Full reviews management for customers:
 * - Completed services awaiting review with 1-click modal trigger
 * - Review submission with interactive star rating & feedback
 * - History of reviews already posted
 * Reference: Blueprint Sections 7, 11, 13
 */
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import ReviewModal from '../../components/reviews/ReviewModal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

export default function CustomerReviewsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 1. Fetch pending reviews (completed requests awaiting feedback)
  const {
    data: pendingData,
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const res = await apiClient('/reviews/pending');
      return res?.data?.pending || [];
    },
  });

  // 2. Fetch reviewed requests (already reviewed jobs)
  const {
    data: reviewedData,
    isLoading: reviewedLoading,
    refetch: refetchReviewed,
  } = useQuery({
    queryKey: ['customer-reviewed-requests'],
    queryFn: async () => {
      const res = await apiClient('/requests?status=REVIEWED&limit=50');
      return res?.data?.requests || [];
    },
  });

  if (pendingLoading || reviewedLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState message="Loading your completed services and reviews..." />
      </div>
    );
  }

  if (pendingError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title="Could not load reviews"
          message={pendingError.message}
          onRetry={refetchPending}
        />
      </div>
    );
  }

  const pendingRequests = pendingData || [];
  const reviewedRequests = reviewedData || [];
  const hasNoReviewsAtAll = pendingRequests.length === 0 && reviewedRequests.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2 border border-amber-200">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{t('reviews.title', 'Ratings & Reviews')}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Your Verified Feedback
        </h1>
        <p className="text-gray-500 text-sm mt-1 max-w-xl">
          Verified reviews build neighborhood trust and help honest local professionals thrive.
        </p>
      </div>

      {/* Section 1: Completed Services Awaiting Review */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-amber-950">
                {t('reviews.pendingTitle', 'Reviews Waiting')} ({pendingRequests.length})
              </h2>
              <p className="text-xs text-amber-800">
                {t(
                  'reviews.pendingSubtitle',
                  'Your recent appointments are finished. Share your honest feedback with neighbors.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                      {req.service?.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-gray-900">
                    {req.vendor?.businessName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Link
                    to={`/requests/${req.id}`}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    View Details &rarr;
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                    className="bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>{t('reviews.reviewNow', 'Review Now')}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Published Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Published Reviews</h2>

        {hasNoReviewsAtAll ? (
          <EmptyState
            title="No reviews written yet"
            description="Once you have a service request marked as COMPLETED, you will be able to leave verified reviews and 1-5 star ratings here."
            icon={MessageSquare}
          />
        ) : reviewedRequests.length === 0 && pendingRequests.length > 0 ? (
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
            You haven&apos;t written any reviews yet. Review one of your completed services above!
          </div>
        ) : (
          <div className="space-y-4">
            {reviewedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-brand-600 block">
                      {req.service?.name}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900">
                      {req.vendor?.businessName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {req.review?.rating && (
                      <div className="flex items-center text-amber-400">
                        {[...Array(req.review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-400">
                      {req.review?.createdAt
                        ? new Date(req.review.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                </div>

                {req.review?.comment && (
                  <p className="text-xs text-gray-700 italic bg-slate-50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
                    &ldquo;{req.review.comment}&rdquo;
                  </p>
                )}

                {req.review?.vendorReply && (
                  <div className="pl-4 border-l-2 border-emerald-500 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 block">
                      Vendor Response:
                    </span>
                    <p className="text-xs text-gray-600 italic">
                      &ldquo;{req.review.vendorReply}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {selectedRequest && (
        <ReviewModal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          requestId={selectedRequest.id}
          vendorName={selectedRequest.vendor?.businessName}
          onSuccess={() => {
            setSelectedRequest(null);
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['customer-reviewed-requests'] });
            queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
          }}
        />
      )}
    </div>
  );
}
