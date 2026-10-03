import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import RatingStars from './RatingStars';
import VerifiedBadge from './VerifiedBadge';
import OpenNowBadge from './OpenNowBadge';
import { RangoliCornerFiligree } from './IndianArtDecorations';

export default function VendorCard({
  vendor,
  isFavorited = false,
  onToggleFavorite,
  isFavoriteLoading = false,
  className = '',
}) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  if (!vendor) return null;

  const services = vendor.services || vendor.vendorServices || [];
  const cleanPhone = vendor.phone ? vendor.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  return (
    <div
      className={`bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group relative ${className}`}
    >
      {/* Decorative Rangoli Corner Filigree */}
      <RangoliCornerFiligree className="w-10 h-10 text-amber-600/20 absolute top-0 right-0 pointer-events-none" />

      <div>
        {/* Card Header: Avatar, Name, Verified, Open Now & Favorite Action */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {vendor.avatarUrl ? (
                <img
                  src={vendor.avatarUrl}
                  alt={vendor.businessName}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-800 to-amber-700 text-amber-50 font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
                  {vendor.businessName?.charAt(0)?.toUpperCase() || 'K'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-800 transition leading-snug">
                  <Link to={`/vendors/${vendor.id}`}>{vendor.businessName}</Link>
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <VerifiedBadge isVerified={vendor.verified ?? vendor.isVerified} size="sm" />
                  <OpenNowBadge
                    isOpenNow={vendor.openNow ?? vendor.isAvailable}
                    dutyStatus={vendor.dutyStatus}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(vendor.id);
                }}
                disabled={isFavoriteLoading}
                aria-label={
                  isFavorited
                    ? (isEn ? 'Remove from favorites' : 'पसंदीदा से हटाएं')
                    : (isEn ? 'Add to favorites' : 'पसंदीदा में जोड़ें')
                }
                className={`p-2 rounded-xl border transition ${
                  isFavorited
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-stone-400 border-stone-200 hover:text-rose-500 hover:bg-stone-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Rating, Reviews & Area */}
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-2.5 border-t border-stone-100">
            <RatingStars
              rating={vendor.avgRating || vendor.avg_rating || vendor.ratingAvg || 0}
              count={vendor.reviewCount || vendor.review_count || vendor.ratingCount || 0}
              size="sm"
            />

            {(vendor.address || vendor.city) && (
              <span className="flex items-center gap-1 text-stone-600 font-medium truncate max-w-[150px]">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                {vendor.address || vendor.city}
              </span>
            )}
          </div>

          {/* Bio snippet */}
          {vendor.bio && (
            <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {vendor.bio}
            </p>
          )}

          {/* Service Chips */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {services.slice(0, 3).map((s, idx) => (
                <span
                  key={s.id || idx}
                  className="bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                >
                  {s.name || s.service?.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions: Direct 1-Click Call & WhatsApp */}
      <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 space-y-2">
        <div className="flex items-center gap-2">
          {vendor.phone ? (
            <a
              href={`tel:${vendor.phone}`}
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs active:scale-95 ${
                vendor.isAvailable || vendor.openNow
                  ? 'bg-amber-800 hover:bg-amber-900 text-amber-50'
                  : 'bg-stone-800 hover:bg-stone-900 text-stone-100'
              }`}
              aria-label={`Call ${vendor.businessName}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{vendor.phone}</span>
              <span className="text-[11px] opacity-90 font-medium">
                ({isEn ? 'Call' : 'सीधा कॉल करें'})
              </span>
            </a>
          ) : null}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
              aria-label={`Message ${vendor.businessName} on WhatsApp`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}

          <Link
            to={`/vendors/${vendor.id}`}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition shrink-0"
            title={isEn ? 'View Profile' : 'प्रोफाइल देखें'}
          >
            <ArrowRight className="w-4 h-4 text-stone-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
