import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  ShieldCheck,
  Zap,
  Scissors,
  BookOpen,
  Wrench,
  Sparkles,
  Phone,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Star,
  Users,
  Compass,
  MessageCircle,
  Flower,
  Utensils,
  Coffee,
  Hammer,
  Paintbrush,
  Car,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import VendorCard from '../components/common/VendorCard';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import LocationPicker from '../components/common/LocationPicker';
import {
  RangoliMandala,
  BandhaniRibbon,
  WarliArtStrip,
  MadhubaniLotusMotif,
  ToranRibbon,
  RangoliFloralDivider,
  DeepamLampMotif,
  ChowkPurnaPattern,
  SikkuKolamMotif,
} from '../components/common/IndianArtDecorations';

const CATEGORY_ICONS = {
  'electrical-wiring': Zap,
  'tailoring-alterations': Scissors,
  'tutoring-academics': BookOpen,
  'plumbing-pipefitting': Wrench,
  'housekeeping-cleaning': Sparkles,
  'ac-appliance-repair': Wrench,
  'gardener-landscaping': Flower,
  'maid-cook-househelp': Utensils,
  'halwai-catering': Coffee,
  'carpenter-woodwork': Hammer,
  'painter-whitewash': Paintbrush,
  'driver-transport': Car,
  'pandit-purohit': Flame,
};

const CATEGORY_TITLES = {
  'electrical-wiring': { hi: 'इलेक्ट्रीशियन (विद्युत कार्य)', en: 'Electrician (Wiring & Electrical)' },
  'tailoring-alterations': { hi: 'दर्जी / टेलर (सिलाई व वस्त्र)', en: 'Tailor (Stitching & Alterations)' },
  'tutoring-academics': { hi: 'होम ट्यूशन (अध्ययन मार्गदर्शन)', en: 'Home Tutor (Academic Guidance)' },
  'plumbing-pipefitting': { hi: 'प्लंबर (नल व जल संयोजन)', en: 'Plumber (Water & Sanitation)' },
  'housekeeping-cleaning': { hi: 'गृह स्वच्छता (डीप क्लीनिंग)', en: 'Housekeeping (Deep Cleaning)' },
  'ac-appliance-repair': { hi: 'एसी व उपकरण मैकेनिक', en: 'AC & Appliance Technician' },
  'gardener-landscaping': { hi: 'माली व बागवानी (लॉन व पौधे)', en: 'Gardener & Landscaping' },
  'maid-cook-househelp': { hi: 'घरेलू सहायिका व रसोइया', en: 'Maid, Cook & Domestic Help' },
  'halwai-catering': { hi: 'हलवाई व पारंपरिक कैटरिंग', en: 'Halwai & Traditional Catering' },
  'carpenter-woodwork': { hi: 'बढ़ई / खाती (काष्ठ कार्य)', en: 'Carpenter & Woodwork' },
  'painter-whitewash': { hi: 'पेंटर व पुट्टी (रंग-रोगन)', en: 'Painter & Putty Work' },
  'driver-transport': { hi: 'ड्राइवर (कार व वाहन चालक)', en: 'Personal & City Driver' },
  'pandit-purohit': { hi: 'पंडित जी / पुरोहित (पूजा व अनुष्ठान)', en: 'Pandit Ji (Pooja & Rituals)' },
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchService, setSearchService] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterFreeOnly, setFilterFreeOnly] = useState(false);

  // 1. Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient('/categories');
      return res?.data?.categories || [];
    },
  });

  // 2. Fetch service locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await apiClient('/locations');
      return res?.data?.locations || [];
    },
  });

  // 3. Fetch top-rated vendors
  const {
    data: topVendorsData,
    isLoading: vendorsLoading,
    error: vendorsError,
  } = useQuery({
    queryKey: ['top-vendors'],
    queryFn: async () => {
      const res = await apiClient('/vendors/top?limit=12');
      return res?.data?.vendors || [];
    },
  });

  // 4. Fetch customer favorites
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
    },
  });

  const handleToggleFavorite = (vendorId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'CUSTOMER') {
      alert(isEn ? 'Only registered customers can save favorites.' : 'केवल ग्राहक खाते पसंदीदा कारीगर सहेज सकते हैं।');
      return;
    }
    favoriteMutation.mutate({
      vendorId,
      isFavorited: favoritedVendorIds.has(vendorId),
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchService.trim()) params.set('q', searchService.trim());
    if (selectedLocation) {
      if (selectedLocation.lat && selectedLocation.lng) {
        params.set('lat', selectedLocation.lat);
        params.set('lng', selectedLocation.lng);
      }
      if (selectedLocation.city) {
        params.set('area', selectedLocation.city);
      }
    }
    navigate(`/search?${params.toString()}`);
  };

  const categories = categoriesData || [];
  const allTopVendors = topVendorsData || [];

  const displayedVendors = filterFreeOnly
    ? allTopVendors.filter((v) => v.isAvailable || v.openNow)
    : allTopVendors;

  const freeCount = allTopVendors.filter((v) => v.isAvailable || v.openNow).length;

  return (
    <div className="space-y-16 pb-20">
      {/* Auspicious Toran Garland */}
      <ToranRibbon className="h-6 w-full text-amber-800/70" />

      {/* Hero Section: Traditional Indian Artisanal Welcome & Rangoli Motifs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/90 via-stone-50 to-stone-100/70 pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-amber-200/50">
        {/* Decorative Rangoli & Kolam Motifs */}
        <RangoliMandala className="w-56 h-56 text-amber-900/10 absolute -top-12 -right-12 pointer-events-none" />
        <RangoliMandala className="w-56 h-56 text-amber-900/10 absolute -bottom-12 -left-12 pointer-events-none" />
        <SikkuKolamMotif className="w-28 h-28 text-amber-900/10 absolute top-12 left-6 pointer-events-none hidden md:block" />
        <ChowkPurnaPattern className="w-24 h-24 text-amber-900/10 absolute top-12 right-6 pointer-events-none hidden md:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Respectful Artisanal Honor Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold mb-6 shadow-2xs">
            <MadhubaniLotusMotif className="w-4 h-4 text-amber-800" />
            <span>{isEn ? 'Karigar • Direct Connection with Skilled Artisans' : 'कारीगर • हुनर और परिश्रम का सच्चा सम्मान'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
            <span className="text-amber-800 font-semibold">{isEn ? 'Zero Commission' : 'बिना किसी बिचौलिए के'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {isEn ? 'Connect with Skilled Local Artisans, ' : 'आस-पास के कुशल कारीगर, '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900">
              {isEn ? 'Call Directly!' : 'सीधा फोन लगाएं!'}
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-stone-700 max-w-2xl mx-auto font-medium leading-relaxed">
            {isEn
              ? 'Electricians, Plumbers, Tailors, Technicians — connect directly with artisans available right now in your neighborhood. Fair prices, honest work, no middlemen!'
              : 'इलेक्ट्रीशियन, प्लंबर, दर्जी, एसी मैकेनिक — जो कारीगर अभी खाली हैं, उन्हें 1-क्लिक में फोन करें। किसी बिचौलिए या कमीशन के बिना!'}
          </p>

          {/* Quick Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-3xl mx-auto bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-amber-300/80 shadow-xl shadow-amber-950/5 flex flex-col md:flex-row items-center gap-3"
          >
            {/* Service Keyword */}
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                placeholder={isEn ? 'Which trade or skill do you need? (e.g. Electrician, Plumber, Tailor)' : 'किस कार्य के लिए कारीगर चाहिए? (उदा. इलेक्ट्रीशियन, प्लंबर, दर्जी)'}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-sm focus:outline-none text-stone-800 placeholder-stone-400 font-medium"
              />
            </div>

            <div className="hidden md:block w-px h-8 bg-stone-200" />

            {/* Neighborhood / Area Location Picker */}
            <div className="w-full md:w-64">
              <LocationPicker
                value={selectedLocation}
                onChange={(loc) => setSelectedLocation(loc)}
                label={null}
                showUseMyLocation={true}
                placeholder={isEn ? 'Select city or neighborhood' : 'शहर या क्षेत्र चुनें'}
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full md:w-auto px-7 py-3 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              {isEn ? 'Find Artisans' : 'कारीगर खोजें'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Popular Trade Quick Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-stone-500">{isEn ? 'Quick Select:' : 'जल्दी चुनें:'}</span>
            {[
              { label: isEn ? '⚡ Electrician' : '⚡ इलेक्ट्रीशियन', query: 'electrical' },
              { label: isEn ? '🔧 Plumber' : '🔧 प्लंबर', query: 'plumbing' },
              { label: isEn ? '✂️ Tailor' : '✂️ दर्जी / टेलर', query: 'tailoring' },
              { label: isEn ? '🌱 Gardener' : '🌱 माली', query: 'gardener' },
              { label: isEn ? '🍲 Maid & Cook' : '🍲 सहायिका व रसोइया', query: 'maid' },
              { label: isEn ? '🍬 Halwai' : '🍬 हलवाई', query: 'halwai' },
              { label: isEn ? '🪚 Carpenter' : '🪚 बढ़ई', query: 'carpenter' },
              { label: isEn ? '🎨 Painter' : '🎨 पेंटर', query: 'painter' },
              { label: isEn ? '🚗 Driver' : '🚗 ड्राइवर', query: 'driver' },
              { label: isEn ? '🪔 Pandit Ji' : '🪔 पंडित जी', query: 'pandit' },
              { label: isEn ? '❄️ AC Mechanic' : '❄️ एसी मैकेनिक', query: 'ac' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setSearchService(chip.query);
                  navigate(`/search?q=${encodeURIComponent(chip.query)}`);
                }}
                className="text-xs font-semibold px-3 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 rounded-full transition shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Popular City & Region Quick Pills */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-stone-500">{isEn ? '📍 Popular Cities:' : '📍 प्रमुख शहर:'}</span>
            {[
              { name: isEn ? 'Delhi NCR' : 'दिल्ली NCR', lat: 28.6139, lng: 77.2090 },
              { name: isEn ? 'Lucknow' : 'लखनऊ', lat: 26.8467, lng: 80.9462 },
              { name: isEn ? 'Kanpur' : 'कानपुर', lat: 26.4499, lng: 80.3319 },
              { name: isEn ? 'Varanasi' : 'वाराणसी', lat: 25.3176, lng: 82.9739 },
              { name: isEn ? 'Patna' : 'पटना', lat: 25.5941, lng: 85.1376 },
              { name: isEn ? 'Jaipur' : 'जयपुर', lat: 26.9124, lng: 75.7873 },
              { name: isEn ? 'Indore' : 'इंदौर', lat: 22.7196, lng: 75.8577 },
              { name: isEn ? 'Bhopal' : 'भोपाल', lat: 23.2599, lng: 77.4126 },
              { name: isEn ? 'Mumbai' : 'मुंबई', lat: 19.0760, lng: 72.8777 },
              { name: isEn ? 'Pune' : 'पुणे', lat: 18.5204, lng: 73.8567 },
              { name: isEn ? 'Kolkata' : 'कोलकाता', lat: 22.5726, lng: 88.3639 },
              { name: isEn ? 'Bengaluru' : 'बेंगलुरु', lat: 12.9716, lng: 77.5946 },
            ].map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => {
                  setSelectedLocation({
                    id: city.name.toLowerCase(),
                    city: city.name,
                    lat: city.lat,
                    lng: city.lng,
                  });
                  navigate(`/search?lat=${city.lat}&lng=${city.lng}&area=${encodeURIComponent(city.name)}`);
                }}
                className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-50/70 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-amber-200/70 rounded-full transition"
              >
                {city.name}
              </button>
            ))}
          </div>

          {/* 4 Core Trust Pillars */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold text-stone-700">
            <span className="flex items-center gap-1.5 text-stone-800 bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-amber-800" />
              {isEn ? 'Direct Phone & WhatsApp' : 'सीधा फोन या वॉट्सएप'}
            </span>
            <span className="flex items-center gap-1.5 text-stone-800 bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn ? 'Live Availability Status' : 'लाइव उपलब्धता स्थिति'}
            </span>
            <span className="flex items-center gap-1.5 text-stone-800 bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
              {isEn ? 'Govt ID Verified' : 'पहचान पत्र सत्यापित'}
            </span>
            <span className="flex items-center gap-1.5 text-stone-800 bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-800" />
              {isEn ? '0% Commission' : 'बिना किसी कमीशन के'}
            </span>
          </div>
        </div>
      </section>

      {/* Rangoli Floral Divider */}
      <div className="max-w-4xl mx-auto px-4">
        <RangoliFloralDivider className="h-6 w-full text-amber-800/35" />
      </div>

      {/* Artisans Respect & Free Registration Invitation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 rounded-3xl p-6 sm:p-8 text-amber-50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <RangoliMandala className="w-48 h-48 text-amber-500/10 absolute -right-6 -bottom-6 pointer-events-none" />

          <div className="flex items-center gap-4 text-left relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-800/80 border border-amber-600/40 flex items-center justify-center text-3xl shrink-0 shadow-inner">
              🎨
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-amber-800/60 border border-amber-600/40 px-2.5 py-0.5 rounded-full mb-1 text-amber-200">
                {isEn ? 'For Skilled Artisans & Crafts' : 'कुशल कारीगरों एवं शिल्पकारों के लिए'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isEn ? 'Are you an Electrician, Plumber, Tailor or Technician?' : 'क्या आप इलेक्ट्रीशियन, प्लंबर, दर्जी या कुशल तकनीशियन हैं?'}
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-xl leading-relaxed">
                {isEn
                  ? 'Join for free! Register with your phone number and govt identity (Aadhaar/PAN). Mark yourself "Free" whenever available and get direct customer calls with zero commission.'
                  : 'निःशुल्क जुड़ें! अपना मोबाइल नंबर और पहचान पत्र (आधार या पैन) दर्ज करें। जब भी काम के लिए उपलब्ध हों, स्थिति "खाली हूँ" चालू करें और ग्राहकों के सीधे फोन पाएं। कोई कमीशन नहीं!'}
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="px-6 py-3.5 bg-amber-100 hover:bg-white text-amber-950 font-black text-sm rounded-2xl transition shadow-md whitespace-nowrap shrink-0 flex items-center gap-2 relative z-10"
          >
            {isEn ? 'Register as Artisan' : 'कारीगर पंजीकरण (निःशुल्क)'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Rangoli Floral Divider */}
      <div className="max-w-4xl mx-auto px-4">
        <RangoliFloralDivider className="h-6 w-full text-amber-800/35" />
      </div>

      {/* Popular Trades Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" /> {isEn ? 'Essential Trades' : 'आवश्यक कारीगरी सेवाएं'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {isEn ? 'Popular Trades & Skills' : 'प्रमुख कार्य श्रेणियां'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {isEn ? 'Select verified, independent artisans in your area' : 'अपने आस-पास के अनुभवी व सत्यापित कारीगर चुनें'}
            </p>
          </div>
          <Link
            to="/categories"
            className="text-sm font-bold text-amber-800 hover:text-amber-900 mt-2 sm:mt-0 flex items-center gap-1"
          >
            {isEn ? 'View All Trades' : 'सभी कार्य देखें'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Wrench;
              const titleObj = CATEGORY_TITLES[cat.slug];
              const title = titleObj ? (isEn ? titleObj.en : titleObj.hi) : cat.name;

              return (
                <Link
                  key={cat.id}
                  to={`/search?category=${encodeURIComponent(cat.slug)}`}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 group flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-800 group-hover:text-amber-50 transition-all shadow-xs shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 group-hover:text-amber-800 transition text-base truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="mt-2 text-[11px] font-bold text-stone-600 flex items-center gap-1">
                      <span>{cat.vendorCount || 0} {isEn ? 'artisans available nearby' : 'कारीगर उपलब्ध'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Rangoli Floral Divider */}
      <div className="max-w-4xl mx-auto px-4">
        <RangoliFloralDivider className="h-6 w-full text-amber-800/35" />
      </div>

      {/* Top Nearby Pros Section with Free/Busy Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {isEn ? 'Direct Contact' : 'सीधे संपर्क करें'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {isEn ? 'Nearby Verified Artisans' : 'आस-पास के सत्यापित कारीगर'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {isEn ? 'Artisans available right now for direct calling' : 'जो कारीगर अभी उपलब्ध हैं, उन्हें तुरंत काम के लिए कॉल करें'}
            </p>
          </div>

          {/* Availability Filter Chips */}
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl self-start sm:self-auto border border-stone-200">
            <button
              type="button"
              onClick={() => setFilterFreeOnly(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                filterFreeOnly
                  ? 'bg-amber-800 text-amber-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isEn ? `Available Now (${freeCount})` : `केवल अभी उपलब्ध (${freeCount})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterFreeOnly(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                !filterFreeOnly
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isEn ? `All Artisans (${allTopVendors.length})` : `सभी कारीगर (${allTopVendors.length})`}
            </button>
          </div>
        </div>

        {vendorsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-stone-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : displayedVendors.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-stone-300 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto text-3xl">
              🎨
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              {filterFreeOnly
                ? (isEn ? 'All artisans are currently engaged' : 'फिलहाल सभी कारीगर कार्य में व्यस्त हैं')
                : (isEn ? 'No artisans registered in this neighborhood yet' : 'इस क्षेत्र में अभी कोई कारीगर पंजीकृत नहीं है')}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {filterFreeOnly
                ? (isEn ? 'You can switch to "All Artisans" tab or check back in a short while.' : 'आप "सभी कारीगर" टैब पर क्लिक करके कारीगरों की सूची देख सकते हैं।')
                : (isEn ? 'If you are an artisan or technician, create your profile in 2 minutes and start connecting with local clients!' : 'यदि आप कुशल कारीगर या तकनीशियन हैं तो 2 मिनट में अपनी प्रोफाइल बनाएं और काम पाएं!')}
            </p>
            {filterFreeOnly ? (
              <button
                type="button"
                onClick={() => setFilterFreeOnly(false)}
                className="px-5 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900"
              >
                {isEn ? 'View All Artisans' : 'सभी कारीगर देखें'}
              </button>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-xl transition shadow-sm"
              >
                {isEn ? 'Create Artisan Profile' : 'कारीगर प्रोफाइल बनाएं'} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                isFavorited={favoritedVendorIds.has(vendor.id)}
                onToggleFavorite={handleToggleFavorite}
                isFavoriteLoading={favoriteMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Rangoli Floral Divider */}
      <div className="max-w-4xl mx-auto px-4">
        <RangoliFloralDivider className="h-6 w-full text-amber-800/35" />
      </div>

      {/* Simple 3-Step Guide for Indian Neighborhoods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <RangoliMandala className="w-64 h-64 text-stone-700/20 absolute -top-16 -right-16 pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
            <DeepamLampMotif className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <span className="px-3.5 py-1 rounded-full bg-amber-800/40 text-amber-300 text-xs font-bold tracking-wider uppercase border border-amber-700/50">
              {isEn ? 'Simple & Direct • 3 Steps' : 'सरल एवं पारदर्शी • 3 चरण'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-3">
              {isEn ? 'How Karigar Works' : 'कारीगर मंच कैसे कार्य करता है?'}
            </h2>
            <p className="text-stone-300 mt-2 text-sm sm:text-base">
              {isEn
                ? 'Without middlemen or corporate markups, connect directly with artisans in your neighborhood'
                : 'बिना किसी दलाल या बिचौलिए के, सीधे अपने क्षेत्र के कारीगर से बात करें'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-stone-800/60 border border-stone-700/50 p-6 rounded-2xl text-center backdrop-blur-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-800 text-amber-50 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-white text-base mb-2">
                {isEn ? 'Select Trade & Location' : 'काम और क्षेत्र चुनें'}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                {isEn
                  ? 'Choose the craft you need (Electrician, Plumber, Tailor, Mechanic) and your neighborhood.'
                  : 'इलेक्ट्रीशियन, प्लंबर, दर्जी या मैकेनिक जो भी काम चाहिए, अपना शहर या क्षेत्र चुनें।'}
              </p>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/50 p-6 rounded-2xl text-center backdrop-blur-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-emerald-50 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-white text-base mb-2">
                {isEn ? 'Check Live Availability' : 'वर्तमान उपलब्धता देखें'}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                {isEn
                  ? 'Check who is available right now. Artisans update their own status directly so your time is saved.'
                  : 'देखें कौन सा कारीगर अभी खाली है। कारीगर स्वयं अपनी स्थिति अपडेट रखते हैं ताकि समय की बचत हो।'}
              </p>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/50 p-6 rounded-2xl text-center backdrop-blur-xs">
              <div className="w-12 h-12 rounded-2xl bg-stone-700 text-stone-100 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-white text-base mb-2">
                {isEn ? 'Call or WhatsApp Directly' : 'सीधा फोन लगाएं'}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                {isEn
                  ? 'Directly call or WhatsApp, agree on terms, and have the artisan visit with complete satisfaction.'
                  : 'सीधा फोन या वॉट्सएप करें, कार्य व दर तय करें और कारीगर को सम्मानपूर्वक बुलाकर काम कराएं।'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
