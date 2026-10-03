import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  X,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { createPinIcon } from '../utils/leafletIcons';
import LocationPicker from '../components/common/LocationPicker';
import VendorCard from '../components/common/VendorCard';
import FilterSheet from '../components/common/FilterSheet';
import { SearchResultsSkeleton } from '../components/common/SkeletonLoader';

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // URL search state
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const serviceParam = searchParams.get('service') || '';
  const latParam = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : undefined;
  const lngParam = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : undefined;
  const radiusParam = searchParams.get('radius') ? parseInt(searchParams.get('radius'), 10) : 15;
  const minRatingParam = searchParams.get('min_rating') || '';
  const priceMinParam = searchParams.get('price_min') || '';
  const priceMaxParam = searchParams.get('price_max') || '';
  const verifiedParam = searchParams.get('verified') === 'true';
  const availableNowParam = searchParams.get('available_now') === 'true';
  const sortParam = searchParams.get('sort') || 'best_match';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local UI State
  const [queryInput, setQueryInput] = useState(qParam);
  const [selectedLocation, setSelectedLocation] = useState(
    latParam && lngParam ? { lat: latParam, lng: lngParam, city: searchParams.get('area') || 'Search Location' } : null
  );
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsRef = useRef(null);

  // Sync query input when URL changes
  useEffect(() => {
    setQueryInput(qParam);
  }, [qParam]);

  // 1. Autocomplete Suggestions with Debounce
  const [debouncedQuery, setDebouncedQuery] = useState(queryInput);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryInput.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [queryInput]);

  const { data: suggestionsData } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      const res = await apiClient(`/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
      return res?.data?.suggestions || null;
    },
    enabled: Boolean(debouncedQuery && debouncedQuery.length >= 2),
  });

  // Close suggestions on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // 2. Main Search Query
  const searchEndpoint = useMemo(() => {
    const p = new URLSearchParams();
    if (qParam) p.set('q', qParam);
    if (categoryParam) p.set('category', categoryParam);
    if (serviceParam) p.set('service', serviceParam);
    if (latParam !== undefined && lngParam !== undefined) {
      p.set('lat', latParam);
      p.set('lng', lngParam);
    }
    p.set('radius', radiusParam);
    if (minRatingParam) p.set('min_rating', minRatingParam);
    if (priceMinParam) p.set('price_min', priceMinParam);
    if (priceMaxParam) p.set('price_max', priceMaxParam);
    if (verifiedParam) p.set('verified', 'true');
    if (availableNowParam) p.set('available_now', 'true');
    p.set('sort', sortParam);
    p.set('page', pageParam);
    p.set('limit', 12);
    return `/search/vendors?${p.toString()}`;
  }, [
    qParam,
    categoryParam,
    serviceParam,
    latParam,
    lngParam,
    radiusParam,
    minRatingParam,
    priceMinParam,
    priceMaxParam,
    verifiedParam,
    availableNowParam,
    sortParam,
    pageParam,
  ]);

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch,
  } = useQuery({
    queryKey: ['search-vendors', searchEndpoint],
    queryFn: async () => {
      const res = await apiClient(searchEndpoint);
      return res?.data || { vendors: [], meta: {} };
    },
  });

  // 3. Customer Favorites query & mutation
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!isAuthenticated || user?.role !== 'CUSTOMER') return [];
      const res = await apiClient('/favorites');
      return res?.data?.favorites || [];
    },
    enabled: isAuthenticated && user?.role === 'CUSTOMER',
  });

  const favoritedVendorIds = new Set(
    (favoritesData || []).map((f) => f.vendor?.id)
  );

  const favoriteMutation = useMutation({
    mutationFn: async ({ vendorId, isFavorited }) => {
      if (isFavorited) {
        return apiClient(`/favorites/${vendorId}`, { method: 'DELETE' });
      }
      return apiClient(`/favorites/${vendorId}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
  });

  const handleToggleFavorite = (vendorId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'CUSTOMER') {
      alert('Only registered customer accounts can save favorite pros.');
      return;
    }
    const isFavorited = favoritedVendorIds.has(vendorId);
    favoriteMutation.mutate({ vendorId, isFavorited });
  };

  // Helper to update specific search query parameters in the URL
  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === false) {
        updated.delete(k);
      } else {
        updated.set(k, String(v));
      }
    });
    // Reset to page 1 on filter changes
    updated.set('page', '1');
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSuggestionsOpen(false);
    updateFilters({ q: queryInput });
  };

  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    if (loc && loc.lat && loc.lng) {
      updateFilters({
        lat: loc.lat,
        lng: loc.lng,
        area: loc.city || '',
      });
    } else {
      updateFilters({ lat: '', lng: '', area: '' });
    }
  };

  const handleCenterPinDrag = (e) => {
    const newPos = e.target.getLatLng();
    updateFilters({
      lat: Math.round(newPos.lat * 10000) / 10000,
      lng: Math.round(newPos.lng * 10000) / 10000,
    });
  };

  const clearAllFilters = () => {
    const resetParams = new URLSearchParams();
    if (qParam) resetParams.set('q', qParam);
    if (latParam && lngParam) {
      resetParams.set('lat', String(latParam));
      resetParams.set('lng', String(lngParam));
    }
    setSearchParams(resetParams);
  };

  const vendors = searchData?.vendors || [];
  const meta = searchData?.meta || {};
  const totalVendors = meta.total || 0;

  // Active filter count for mobile badge
  const activeFiltersCount = [
    minRatingParam,
    priceMinParam,
    priceMaxParam,
    verifiedParam,
    availableNowParam,
    radiusParam !== 15,
  ].filter(Boolean).length;

  // Center coordinates for map view (Default: New Delhi, India)
  const mapCenterLat = latParam || (vendors[0]?.lat) || 28.6139;
  const mapCenterLng = lngParam || (vendors[0]?.lng) || 77.2090;
  const centerPinIcon = useMemo(() => createPinIcon('#dc2626'), []); // Red pin for center
  const vendorPinIcon = useMemo(() => createPinIcon('#0284c7'), []); // Blue pin for pros

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search & Location Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/90 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch gap-3">
          {/* Autocomplete Service / Keyword Input */}
          <div className="relative flex-1" ref={suggestionsRef}>
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder={t('search.searchBoxPlaceholder', 'काम या कारीगर खोजें (उदा: इलेक्ट्रीशियन, प्लंबर, दर्जी, एसी मैकेनिक)...')}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-gray-900 transition"
              aria-label="Search service by keyword"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('');
                  updateFilters({ q: '' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Suggestions Autocomplete Dropdown */}
            {suggestionsOpen && suggestionsData && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-30 divide-y divide-gray-100 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                {/* Services */}
                {suggestionsData.services?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 block">
                      Services
                    </span>
                    {suggestionsData.services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setQueryInput(s.name);
                          setSuggestionsOpen(false);
                          updateFilters({ q: s.name, service: '' });
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition flex items-center justify-between"
                      >
                        <span>{s.name}</span>
                        {s.category && (
                          <span className="text-[10px] text-gray-400 font-normal">in {s.category}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Categories */}
                {suggestionsData.categories?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 block">
                      Categories
                    </span>
                    {suggestionsData.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setQueryInput('');
                          setSuggestionsOpen(false);
                          updateFilters({ category: c.slug, q: '' });
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition flex items-center gap-2"
                      >
                        <Layers className="w-3.5 h-3.5 text-brand-600" />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Pros */}
                {suggestionsData.vendors?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 block">
                      Verified Pros
                    </span>
                    {suggestionsData.vendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setQueryInput(v.name);
                          setSuggestionsOpen(false);
                          updateFilters({ q: v.name });
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition flex items-center justify-between"
                      >
                        <span>{v.name}</span>
                        <span className="text-[10px] font-bold text-amber-500">★ {v.rating?.toFixed(1)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Area Picker with GPS button & Memory */}
          <div className="w-full md:w-72">
            <LocationPicker
              value={selectedLocation}
              onChange={handleLocationChange}
              label={null}
              showUseMyLocation={true}
              placeholder={t('landing.areaPlaceholder', 'Any Neighborhood')}
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full md:w-auto px-7 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-2xl transition shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            {t('common.search', 'Search')}
          </button>
        </form>

        {/* Action Controls Bar: Result Count, Mobile Filter Trigger, Sort, View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-stone-900 text-sm">{totalVendors}</span>
              <span>{t('search.resultsCount', 'artisans found')}</span>
              {radiusParam && (
                <span className="hidden sm:inline text-stone-400">({radiusParam} {i18n.language === 'en' ? 'km radius' : 'किमी दायरा'})</span>
              )}
            </div>

            {/* Quick Free Now Toggle Button */}
            <button
              type="button"
              onClick={() => updateFilters({ available_now: !availableNowParam })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                availableNowParam
                  ? 'bg-amber-800 text-amber-50 border-amber-800 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availableNowParam ? 'bg-amber-300 animate-pulse' : 'bg-amber-600'}`} />
              {i18n.language === 'en' ? 'Available Now Only' : 'केवल अभी उपलब्ध कारीगर'}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              aria-label="Open filter panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
              <span>{t('common.filter', 'Filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortParam}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 outline-none appearance-none cursor-pointer hover:border-gray-400 transition"
                aria-label="Sort service professionals"
              >
                <option value="best_match">{t('search.sortBestMatch', 'Best Match (Default)')}</option>
                <option value="nearest">{t('search.sortNearest', 'Nearest First')}</option>
                <option value="highest_rated">{t('search.sortHighestRated', 'Highest Rated')}</option>
                <option value="lowest_price">{t('search.sortLowestPrice', 'Lowest Price')}</option>
                <option value="most_reviewed">{t('search.sortMostReviewed', 'Most Reviewed')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* List / Map View Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Switch to list view"
              >
                <ListIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('search.listView', 'List')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'map' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Switch to map view"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('search.mapView', 'Map')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-medium text-gray-400">Active filters:</span>
            {minRatingParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                ★ {minRatingParam}+ Rating
                <button type="button" onClick={() => updateFilters({ min_rating: '' })} className="hover:text-amber-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceMinParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Min ₹{priceMinParam}
                <button type="button" onClick={() => updateFilters({ price_min: '' })} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceMaxParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Max ₹{priceMaxParam}
                <button type="button" onClick={() => updateFilters({ price_max: '' })} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {verifiedParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Verified Only
                <button type="button" onClick={() => updateFilters({ verified: false })} className="hover:text-emerald-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {availableNowParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Available Now
                <button type="button" onClick={() => updateFilters({ available_now: false })} className="hover:text-emerald-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {radiusParam !== 15 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                {radiusParam} km Radius
                <button type="button" onClick={() => updateFilters({ radius: 15 })} className="hover:text-purple-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline ml-1"
            >
              {t('common.clearAll', 'Reset all')}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Desktop Filter Sidebar (1 Col) & Search Results / Map (3 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block md:col-span-1">
          <FilterSheet
            isOpen={true}
            onClose={() => {}}
            filters={{
              radius: radiusParam,
              minRating: minRatingParam,
              priceMin: priceMinParam,
              priceMax: priceMaxParam,
              verified: verifiedParam,
              availableNow: availableNowParam,
            }}
            onChange={(f) => {
              updateFilters({
                radius: f.radius,
                min_rating: f.minRating,
                price_min: f.priceMin,
                price_max: f.priceMax,
                verified: f.verified,
                available_now: f.availableNow,
              });
            }}
            onReset={clearAllFilters}
            isMobile={false}
          />
        </div>

        {/* Mobile Filter Sheet */}
        <FilterSheet
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filters={{
            radius: radiusParam,
            minRating: minRatingParam,
            priceMin: priceMinParam,
            priceMax: priceMaxParam,
            verified: verifiedParam,
            availableNow: availableNowParam,
          }}
          onChange={(f) => {
            updateFilters({
              radius: f.radius,
              min_rating: f.minRating,
              price_min: f.priceMin,
              price_max: f.priceMax,
              verified: f.verified,
              available_now: f.availableNow,
            });
          }}
          onReset={clearAllFilters}
          isMobile={true}
        />

        {/* Results Area */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {isSearchLoading ? (
            <SearchResultsSkeleton />
          ) : searchError ? (
            <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">Search Error</h3>
              <p className="text-xs text-gray-500">{searchError.message || 'Could not execute search'}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : vendors.length === 0 ? (
            /* Artisanal Zero Results State */
            <div className="bg-white rounded-3xl p-8 sm:p-14 border-2 border-dashed border-amber-200 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900">
                  {isEn
                    ? (selectedLocation?.city
                        ? `No artisans listed yet in ${selectedLocation.city}`
                        : 'No artisans found in this immediate radius')
                    : (selectedLocation?.city
                        ? `${selectedLocation.city} में अभी कोई कारीगर दर्ज नहीं है`
                        : 'इस दायरे में अभी कोई कारीगर नहीं मिला')}
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed max-w-lg mx-auto">
                  {isEn
                    ? 'Karigar connects independent artisans across India. Try widening your search radius to discover artisans in nearby neighborhoods, or register as the first artisan here!'
                    : 'कारीगर पूरे भारत के हुनरमंद कारीगरों को सीधे ग्राहकों से जोड़ता है। आस-पास के क्षेत्रों के कारीगर देखने के लिए दायरा बढ़ाएं या स्वयं यहाँ पहले कारीगर के रूप में जुड़ें!'}
                </p>
              </div>

              {/* Action buttons: Widen radius, Clear filters, Browse categories */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => updateFilters({ radius: 50 })}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition"
                >
                  {isEn ? '📍 Widen Radius to 50 km' : '📍 दायरा 50 किमी तक बढ़ाएं'}
                </button>

                <button
                  type="button"
                  onClick={() => updateFilters({ radius: 100 })}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition"
                >
                  {isEn ? '🌐 Widen to 100 km' : '🌐 दायरा 100 किमी करें'}
                </button>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition"
                >
                  {isEn ? 'Clear All Filters' : 'सभी फिल्टर हटाएं'}
                </button>
              </div>

              {/* "Be the first artisan here" callout */}
              <div className="pt-6 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left bg-gradient-to-r from-amber-50/80 to-stone-50 p-5 rounded-2xl border border-amber-200">
                <div>
                  <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                    {isEn
                      ? `Are you a skilled artisan in ${selectedLocation?.city || 'this area'}?`
                      : `क्या आप ${selectedLocation?.city || 'इस क्षेत्र'} के कुशल कारीगर हैं?`}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">
                    {isEn
                      ? 'Register in 1 minute with just your phone number. 100% free with direct customer calls!'
                      : 'केवल अपने मोबाइल नंबर से 1 मिनट में जुड़ें। 100% निःशुल्क और सीधे ग्राहकों से काम पाएं!'}
                  </p>
                </div>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-xl text-xs font-bold shrink-0 transition shadow-sm"
                >
                  {isEn ? 'Register as Artisan' : 'कारीगर पंजीकरण करें'}
                </Link>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* 1. List View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {vendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    isFavorited={favoritedVendorIds.has(vendor.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isFavoriteLoading={favoriteMutation.isPending}
                    showRankingPopover={true}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="pt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={pageParam <= 1}
                    onClick={() => updateFilters({ page: pageParam - 1 })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-gray-600">
                    Page {pageParam} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageParam >= meta.totalPages}
                    onClick={() => updateFilters({ page: pageParam + 1 })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 2. Map View: Leaflet + OpenStreetMap */
            <div className="bg-white rounded-3xl border border-gray-200/90 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Drag the red pin to adjust your search center
                </span>
                <span className="text-[11px] text-gray-400">
                  {t('search.mapOSMAttribution', '© OpenStreetMap contributors')}
                </span>
              </div>

              <div className="h-[550px] w-full rounded-2xl overflow-hidden border border-gray-200">
                <MapContainer
                  center={[mapCenterLat, mapCenterLng]}
                  zoom={12}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Center Search Pin (Draggable) */}
                  <Marker
                    position={[mapCenterLat, mapCenterLng]}
                    icon={centerPinIcon}
                    draggable={true}
                    eventHandlers={{ dragend: handleCenterPinDrag }}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <span className="font-bold block">Search Center</span>
                        <span className="text-[10px] text-gray-500">
                          Radius: {radiusParam} km. Drag to re-center search.
                        </span>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Radius Circle */}
                  <Circle
                    center={[mapCenterLat, mapCenterLng]}
                    radius={radiusParam * 1000}
                    pathOptions={{
                      color: '#0284c7',
                      fillColor: '#0284c7',
                      fillOpacity: 0.08,
                      weight: 1.5,
                      dashArray: '4, 4',
                    }}
                  />

                  {/* Vendor Pins */}
                  {vendors.map((v) => {
                    if (!v.lat || !v.lng) return null;
                    return (
                      <Marker
                        key={v.id}
                        position={[v.lat, v.lng]}
                        icon={vendorPinIcon}
                      >
                        <Popup>
                          <div className="p-1 max-w-[200px] space-y-1.5 text-xs">
                            <span className="font-bold text-gray-900 block truncate">
                              {v.businessName}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-gray-600">
                              <span className="text-amber-500 font-bold">★ {v.avgRating?.toFixed(1) || 'New'}</span>
                              {v.distanceKm !== undefined && (
                                <span>{v.distanceKm} km away</span>
                              )}
                            </div>
                            {v.startingPrice > 0 && (
                              <span className="font-semibold text-emerald-600 block text-[11px]">
                                From ₹{v.startingPrice}
                              </span>
                            )}
                            <Link
                              to={`/vendors/${v.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline pt-1"
                            >
                              View Profile <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Accessible List alternative underneath map */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-700 block mb-2">
                  Map Vendors Summary ({vendors.length} in area):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {vendors.slice(0, 4).map((v) => (
                    <div key={v.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                      <Link to={`/vendors/${v.id}`} className="font-semibold text-gray-900 hover:text-brand-600 truncate max-w-[160px]">
                        {v.businessName}
                      </Link>
                      <span className="text-gray-500 font-medium">{v.distanceKm} km</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
