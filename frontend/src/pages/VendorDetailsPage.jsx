import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import {
  MapPin,
  Phone,
  Heart,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Eye,
  Flag,
  Share2,
  DollarSign,
  MessageSquare,
  MessageCircle,
  Award,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { createPinIcon } from '../utils/leafletIcons';
import RatingStars from '../components/common/RatingStars';
import VerifiedBadge from '../components/common/VerifiedBadge';
import OpenNowBadge from '../components/common/OpenNowBadge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import RequestServiceModal from '../components/requests/RequestServiceModal';
import ReportModal from '../components/reports/ReportModal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { RangoliMandala } from '../components/common/IndianArtDecorations';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function VendorDetailsPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [requestModalOpen, setRequestModalOpen] = useState(
    searchParams.get('request') === 'true'
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch vendor public profile
  const {
    data: vendorData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vendor-public', id],
    queryFn: async () => {
      const res = await apiClient(`/vendors/${id}`);
      return res?.data?.vendor || null;
    },
    retry: false,
  });

  // 1b. Fetch verified customer reviews for this vendor
  const { data: reviewsData } = useQuery({
    queryKey: ['vendor-reviews', id],
    queryFn: async () => {
      const res = await apiClient(`/reviews/vendor/${id}`);
      return res?.data || null;
    },
  });

  // 2. Fetch favorites list if logged in as customer
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!isAuthenticated || user?.role !== 'CUSTOMER') return [];
      const res = await apiClient('/favorites');
      return res?.data?.favorites || [];
    },
    enabled: isAuthenticated && user?.role === 'CUSTOMER',
  });

  const isFavorited = useMemo(() => {
    return (favoritesData || []).some((f) => f.vendor?.id === id);
  }, [favoritesData, id]);

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        return apiClient(`/favorites/${id}`, { method: 'DELETE' });
      }
      return apiClient(`/favorites/${id}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'CUSTOMER') {
      alert('Only registered customer accounts can save favorite pros.');
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingState message="Loading vendor profile, service cards, and neighborhood schedule..." />
      </div>
    );
  }

  // 404 or Suspended
  if (error || !vendorData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Vendor Not Found or Unavailable"
          message={
            error?.message?.includes('suspended')
              ? 'This vendor profile is currently suspended or under administrative review.'
              : 'The requested service professional profile could not be found or is no longer active.'
          }
          actionLabel="Return to Catalog"
          onAction={() => navigate('/categories')}
        />
      </div>
    );
  }

  const vendor = vendorData;
  const pinIcon = createPinIcon('#0284c7');
  const lat = vendor.lat || 28.6139;
  const lng = vendor.lng || 77.2090;
  const radiusKm = vendor.serviceArea?.radiusKm || 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {isEn ? 'Back to Home' : 'होम पर वापस'}
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 px-3 py-1.5 rounded-lg transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copiedLink ? (isEn ? 'Link Copied!' : 'लिंक कॉपी हुआ!') : (isEn ? 'Share Profile' : 'प्रोफाइल शेयर करें')}
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Cover / Banner */}
        <div className="h-44 sm:h-56 bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 relative overflow-hidden">
          <RangoliMandala className="w-48 h-48 text-amber-500/10 absolute -right-6 -bottom-6 pointer-events-none" />
          {vendor.bannerUrl && (
            <img
              src={vendor.bannerUrl}
              alt={vendor.businessName}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 text-white backdrop-blur-xs">
              <Eye className="w-3.5 h-3.5" /> {vendor.profile_views || 1} {isEn ? 'views' : 'देखा गया'}
            </span>
          </div>
        </div>

        {/* Profile Info & Actions Bar */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            {vendor.avatarUrl ? (
              <img
                src={vendor.avatarUrl}
                alt={vendor.businessName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-md bg-white shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-amber-800 text-amber-50 font-bold text-3xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
                {vendor.businessName?.charAt(0)?.toUpperCase()}
              </div>
            )}

            {/* Business info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <VerifiedBadge isVerified={vendor.isVerified} size="md" />
                <OpenNowBadge
                  dutyStatus={vendor.dutyStatus}
                  isOpenNow={vendor.isAvailable}
                  size="md"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {vendor.businessName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-stone-500">
                <RatingStars
                  rating={vendor.avg_rating}
                  count={vendor.review_count}
                  size="md"
                />
                {vendor.address && (
                  <span className="flex items-center gap-1 text-stone-600">
                    <MapPin className="w-4 h-4 text-stone-400" />
                    {vendor.address}
                  </span>
                )}
                <span className="flex items-center gap-1 text-stone-600">
                  <Clock className="w-4 h-4 text-stone-400" />
                  {isEn ? 'Responds within 24h' : 'सामान्यतः 24 घंटे में संपर्क'}
                </span>
                {vendor.experienceYears && (
                  <span className="flex items-center gap-1 text-stone-600">
                    <Award className="w-4 h-4 text-amber-600" />
                    {vendor.experienceYears} {isEn ? 'yrs experience' : 'वर्ष अनुभव'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Call, WhatsApp, Favorite, Request Service, Report */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-stone-100">
            {/* 1. Direct Call Button (Highlighted Solid Terracotta/Amber) */}
            {vendor.phone ? (
              <a
                href={`tel:${vendor.phone}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-amber-50 bg-amber-800 hover:bg-amber-900 transition shadow-sm active:scale-95"
                title={`Call ${vendor.phone}`}
              >
                <Phone className="w-4 h-4" />
                <span>{isEn ? 'Call:' : 'सीधा फोन लगाएं:'} <strong>{vendor.phone}</strong></span>
              </a>
            ) : null}

            {/* 2. WhatsApp Button */}
            {vendor.phone ? (
              <a
                href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition shadow-2xs"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-amber-700" />
                <span>WhatsApp</span>
              </a>
            ) : null}

            {/* 3. Favorite Button (Active) */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteMutation.isPending}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-gray-600 border-gray-300 hover:text-rose-600 hover:bg-gray-50'
              }`}
              title={isFavorited ? 'Remove from saved favorites' : 'Save to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>

            {/* 4. Request Service Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setRequestModalOpen(true)}
            >
              {isEn ? 'Request Service' : 'काम का अनुरोध'}
            </Button>

            {/* 5. Report Artisan Button */}
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="p-2.5 rounded-xl text-stone-400 hover:text-amber-700 hover:bg-stone-100 transition"
              title={isEn ? 'Report an issue or dispute' : 'शिकायत दर्ज करें'}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio */}
        {vendor.bio && (
          <div className="px-6 sm:px-8 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 leading-relaxed">
            <span className="font-semibold text-gray-900 block mb-1">About this Professional</span>
            <p>{vendor.bio}</p>
          </div>
        )}
      </div>

      {/* Grid: Services & Rate Cards (Left) and Hours & Area Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Services and Pricing */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
                <DollarSign className="w-4 h-4" /> Pricing & Services
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Offered Services & Rate Cards
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                Prices set directly by the vendor without hidden platform markups
              </p>
            </div>

            {(!vendor.services || vendor.services.length === 0) ? (
              <p className="text-sm text-gray-500 italic">No specific rate cards published yet.</p>
            ) : (
              <div className="space-y-4">
                {vendor.services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700">
                          {service.category || 'General Service'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          {service.priceType}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{service.name}</h3>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-md">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-lg font-extrabold text-gray-900">
                        {service.priceType === 'RANGE' ? (
                          <span>₹{service.priceMin} - ₹{service.priceMax}</span>
                        ) : (
                          <span>₹{service.priceMin}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium block">
                        {service.priceType === 'HOURLY' ? 'per hour' : 'estimated job base'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Work Gallery</h2>
            {(!vendor.gallery || vendor.gallery.length === 0) ? (
              <p className="text-sm text-gray-500 italic">
                No past job photos uploaded yet by this pro.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {vendor.gallery.map((imgUrl, idx) => (
                  <div key={idx} className="h-36 rounded-xl overflow-hidden bg-gray-100 border">
                    <img
                      src={imgUrl}
                      alt={`Job work ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews & Ratings Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verified Customer Reviews</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Only customers with completed service requests can post reviews
                </p>
              </div>
              <RatingStars
                rating={vendor.avg_rating}
                count={vendor.review_count}
                size="md"
              />
            </div>

            {(!reviewsData?.reviews || reviewsData.reviews.length === 0) ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">
                  {vendor.review_count > 0
                    ? `${vendor.review_count} verified reviews received.`
                    : 'No customer reviews yet.'}
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Be the first neighbor to book and review this service provider!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsData.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-slate-50/60 border border-gray-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                          {rev.customer?.fullName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {rev.customer?.fullName || 'Verified Customer'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              Verified Booking
                            </span>
                          </div>
                          {rev.request?.service?.name && (
                            <span className="text-[11px] text-gray-500 block">
                              Service: {rev.request.service.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-gray-700 leading-relaxed pl-12">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}

                    {rev.vendorReply && (
                      <div className="ml-12 pl-4 border-l-2 border-brand-500 bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-[11px] font-bold text-brand-700 block">
                          Response from {vendor.business_name}
                        </span>
                        <p className="text-xs text-gray-600 italic">
                          &ldquo;{rev.vendorReply}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Direct Contact, Hours & Service Area Map */}
        <div className="space-y-8">
          {/* Direct Contact Card */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white rounded-3xl p-6 border border-emerald-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-600" /> Direct Pro Contact
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Directly Call or Message</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Connect instantly with this local professional to discuss requirements, check availability, or confirm urgent jobs.
              </p>
            </div>

            {vendor.phone ? (
              <div className="space-y-2.5 pt-1">
                <a
                  href={`tel:${vendor.phone}`}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call {vendor.phone}
                </a>
                <a
                  href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Chat on WhatsApp
                </a>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No phone number published. Send a service request below.</p>
            )}

            <div className="pt-3 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identity & Credentials Verified by LocalLink</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Weekly Operating Schedule
            </h3>

            {(!vendor.hours || vendor.hours.length === 0) ? (
              <p className="text-xs text-gray-500 italic">No weekly schedule configured.</p>
            ) : (
              <div className="space-y-2 text-xs divide-y divide-gray-100">
                {vendor.hours.map((h, i) => (
                  <div key={i} className="flex items-center justify-between pt-2">
                    <span className="font-medium text-gray-700">
                      {DAYS_OF_WEEK[h.dayOfWeek] || `Day ${h.dayOfWeek}`}
                    </span>
                    <span className="font-semibold text-gray-900 bg-slate-100 px-2 py-0.5 rounded">
                      {h.startTime} – {h.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Area & Map */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Service Radius & Location
            </h3>

            {vendor.serviceArea && (
              <p className="text-xs text-gray-600">
                Serving <span className="font-semibold">{vendor.serviceArea.city}</span> within a{' '}
                <span className="font-semibold">{radiusKm} km</span> radius.
              </p>
            )}

            <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs">
              <MapContainer
                center={[lat, lng]}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} icon={pinIcon} />
                <Circle
                  center={[lat, lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#0284c7',
                    fillOpacity: 0.12,
                    weight: 2,
                  }}
                />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Real 3-Step Request Service Modal (Phase 5 Flow) */}
      <RequestServiceModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        vendor={vendor}
      />

      {/* Real Report Pro Modal (Phase 6 Flow) */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUserId={vendor?.userId}
        targetName={vendor?.business_name}
      />
    </div>
  );
}
