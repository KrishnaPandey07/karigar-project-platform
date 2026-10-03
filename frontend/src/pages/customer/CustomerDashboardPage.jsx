import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Heart,
  Star,
  PlusCircle,
  CheckCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertCircle,
  Phone,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RatingStars from '../../components/common/RatingStars';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import ReviewModal from '../../components/reviews/ReviewModal';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);

  // Fetch unified customer dashboard summary
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      const res = await apiClient('/users/me/dashboard');
      return res?.data || null;
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (vendorId) => {
      return apiClient(`/favorites/${vendorId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingState message="Loading your service requests, saved pros, and activity..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState
          title="Could not load your customer dashboard"
          message={error.message || 'An error occurred fetching dashboard data.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const {
    activeRequests = [],
    savedVendors = [],
    pendingReviews = [],
    stats = {},
  } = dashboardData || {};

  const customerName =
    user?.customerProfile?.fullName || user?.email?.split('@')[0] || 'Neighbor';

  const isCompletelyEmpty =
    activeRequests.length === 0 && savedVendors.length === 0 && pendingReviews.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Customer Hub
            </span>
            {user?.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified Member
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, <span className="text-brand-600">{customerName}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.customerProfile?.address ||
              'Find and coordinate with local service professionals nearby.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Search className="w-4 h-4" /> Find a Service Pro
          </Link>
          <Link
            to="/customer/settings"
            className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-sm font-semibold transition"
          >
            Profile & Settings
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              {stats.activeRequestsCount || activeRequests.length || 0}
            </span>
            <p className="text-xs text-gray-500 font-medium">Active Service Requests</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              {stats.savedVendorsCount || savedVendors.length || 0}
            </span>
            <p className="text-xs text-gray-500 font-medium">Saved Favorite Pros</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              {stats.pendingReviewsCount || pendingReviews.length || 0}
            </span>
            <p className="text-xs text-gray-500 font-medium">Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Empty State when no activity exists */}
      {isCompletelyEmpty && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-brand-200 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Ready to get your first service done?</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            You don't have any ongoing service requests yet. Browse our curated categories or
            search for nearby electricians, tailors, and tutors with transparent rates.
          </p>
          <div className="pt-2">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              Browse Local Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Section 1: Active Service Requests */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active Service Requests</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Current jobs submitted, awaiting quotes, or in-progress
            </p>
          </div>
          <Link
            to="/customer/requests"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View All Requests &rarr;
          </Link>
        </div>

        {activeRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">No active requests</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Need assistance with an appliance repair, plumbing leak, or tailoring?
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start a Request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 hover:border-brand-300 transition"
              >
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-100 text-blue-700">
                    {req.status}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">{req.service?.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{req.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">
                    Created {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Saved / Favorited Vendors */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Saved Favorite Pros</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Service pros you have bookmarked for quick access and rebooking
            </p>
          </div>
          <Link
            to="/customer/favorites"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Manage Favorites ({savedVendors.length}) &rarr;
          </Link>
        </div>

        {savedVendors.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">No saved professionals yet</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Click the heart icon on any pro profile to bookmark them for later.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition"
            >
              Browse Pros
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 hover:border-brand-300 transition bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  {vendor.avatarUrl ? (
                    <img
                      src={vendor.avatarUrl}
                      alt={vendor.businessName}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center">
                      {vendor.businessName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="font-bold text-gray-900 text-sm hover:text-brand-600 transition block truncate max-w-[160px]"
                    >
                      {vendor.businessName}
                    </Link>
                    <RatingStars rating={vendor.ratingAvg} count={vendor.ratingCount} size="sm" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                      title="Call Pro"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removeFavoriteMutation.mutate(vendor.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove Favorite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Pending Reviews */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Help your neighborhood by sharing feedback on finished jobs
          </p>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400">You have no completed jobs awaiting review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {req.service?.name} with {req.vendor?.businessName}
                  </h4>
                  <p className="text-xs text-gray-500">Completed on {new Date(req.completedAt).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReviewRequest(req)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {selectedReviewRequest && (
        <ReviewModal
          isOpen={!!selectedReviewRequest}
          onClose={() => setSelectedReviewRequest(null)}
          requestId={selectedReviewRequest.id}
          vendorName={selectedReviewRequest.vendor?.businessName}
          onSuccess={() => {
            setSelectedReviewRequest(null);
            queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
          }}
        />
      )}
    </div>
  );
}
