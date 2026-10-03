import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Trash2,
  Phone,
  ArrowRight,
  Search,
  ExternalLink,
  PlusCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import RatingStars from '../../components/common/RatingStars';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function CustomerFavoritesPage() {
  const queryClient = useQueryClient();
  const [requestTargetVendor, setRequestTargetVendor] = useState(null);

  // Fetch favorites
  const {
    data: favoritesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await apiClient('/favorites');
      return res?.data?.favorites || [];
    },
  });

  // Remove favorite mutation
  const removeMutation = useMutation({
    mutationFn: async (vendorId) => {
      return apiClient(`/favorites/${vendorId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingState message="Loading your saved favorite service professionals..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState
          title="Could not load favorites"
          message={error.message || 'Failed to fetch saved vendors'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const favorites = favoritesData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500" /> Bookmarked Providers
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Saved Favorite Pros
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quickly rebook or contact your preferred electricians, tailors, plumbers, and tutors.
          </p>
        </div>

        <Link
          to="/categories"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition self-start sm:self-auto shadow-xs"
        >
          <Search className="w-3.5 h-3.5" /> Find More Pros
        </Link>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites saved yet"
          description="Save top-rated service professionals by clicking the heart icon on any vendor profile or listing card."
          actionLabel="Browse Available Services"
          onAction={() => (window.location.href = '/categories')}
          icon={Heart}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const v = fav.vendor;
            if (!v) return null;

            return (
              <div
                key={fav.favoriteId}
                className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-brand-300 transition group"
              >
                <div>
                  {/* Vendor Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {v.avatarUrl ? (
                        <img
                          src={v.avatarUrl}
                          alt={v.businessName}
                          className="w-13 h-13 rounded-2xl object-cover border"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center">
                          {v.businessName?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link
                          to={`/vendors/${v.id}`}
                          className="font-bold text-gray-900 text-base group-hover:text-brand-600 transition block leading-tight"
                        >
                          {v.businessName}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <VerifiedBadge isVerified={v.isVerified} size="sm" />
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              v.isAvailable
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {v.isAvailable ? 'Available' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => removeMutation.mutate(v.id)}
                      disabled={removeMutation.isPending}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rating & Address */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100 mb-3">
                    <RatingStars
                      rating={v.avg_rating}
                      count={v.review_count}
                      size="sm"
                    />
                    {v.address && (
                      <span className="flex items-center gap-1 text-gray-500 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{v.address}</span>
                      </span>
                    )}
                  </div>

                  {/* Key Services Badges */}
                  {(v.services || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {v.services.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  {v.phone ? (
                    <a
                      href={`tel:${v.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Call
                    </a>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestTargetVendor(v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-2xs"
                    >
                      Request Service
                    </button>
                    <Link
                      to={`/vendors/${v.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      title="View Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Service Modal Placeholder */}
      <Modal
        isOpen={Boolean(requestTargetVendor)}
        onClose={() => setRequestTargetVendor(null)}
        title="Request Service"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setRequestTargetVendor(null)}>
            Dismiss
          </Button>
        }
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-900">
            Request {requestTargetVendor?.businessName}
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            The state-machine service request and quote workflow is scheduled for Phase 5. In the
            meantime, you can contact this pro directly using their verified phone number.
          </p>
        </div>
      </Modal>
    </div>
  );
}
