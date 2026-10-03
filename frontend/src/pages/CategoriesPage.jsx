import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import {
  Zap,
  Scissors,
  BookOpen,
  Wrench,
  Sparkles,
  Search,
  ArrowRight,
  Layers,
  ChevronRight,
  Info,
  Flower,
  Utensils,
  Coffee,
  Hammer,
  Paintbrush,
  Car,
  Flame,
} from 'lucide-react';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { RangoliCornerFiligree, RangoliFloralDivider } from '../components/common/IndianArtDecorations';

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

export default function CategoriesPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories with live vendor counts
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch,
  } = useQuery({
    queryKey: ['categories-catalog'],
    queryFn: async () => {
      const res = await apiClient('/categories');
      return res?.data?.categories || [];
    },
  });

  // Fetch services for selected category
  const {
    data: servicesData,
    isLoading: servicesLoading,
  } = useQuery({
    queryKey: ['services-by-category', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      const res = await apiClient(`/services?category_id=${selectedCategory.id}`);
      return res?.data?.services || [];
    },
    enabled: Boolean(selectedCategory?.id),
  });

  if (categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingState message={isEn ? "Loading artisan categories..." : "कारीगरी श्रेणियां लोड हो रही हैं..."} />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState
          title={isEn ? "Could not load categories" : "श्रेणियां लोड नहीं हो सकीं"}
          message={categoriesError.message || (isEn ? 'Failed to fetch categories list' : 'कारीगर सूची लोड करने में समस्या आई')}
          onRetry={refetch}
        />
      </div>
    );
  }

  const categories = categoriesData || [];
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-800" /> {isEn ? 'Artisanal Trades Catalog' : 'कारीगरी कार्य सूची'}
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {isEn ? 'Local Trade Categories' : 'कुशल कारीगर श्रेणियां'}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {isEn
              ? 'Browse verified trades and services offered directly by independent solo artisans.'
              : 'अपने आस-पास के सत्यापित व स्वतंत्र कारीगरों की कार्य श्रेणियां देखें।'}
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? "Search trades (e.g. Electrician, Tailor)..." : "कार्य खोजें (उदा. इलेक्ट्रीशियन, दर्जी)..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          title={isEn ? "No matching categories" : "कोई श्रेणी नहीं मिली"}
          description={isEn ? `No trade matched "${searchTerm}".` : `"${searchTerm}" के लिए कोई कार्य श्रेणी नहीं मिली।`}
          actionLabel={isEn ? "Clear Filter" : "फ़िल्टर हटाएं"}
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Wrench;
            const titleObj = CATEGORY_TITLES[cat.slug];
            const title = titleObj ? (isEn ? titleObj.en : titleObj.hi) : cat.name;
            const isSelected = selectedCategory?.id === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat)}
                className={`bg-white rounded-2xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-600 ring-2 ring-amber-200 shadow-md'
                    : 'border-stone-200 shadow-sm hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <RangoliCornerFiligree className="w-10 h-10 text-amber-500/20 absolute -top-1 -right-1 pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {cat.vendorCount} {isEn ? (cat.vendorCount === 1 ? 'Artisan' : 'Artisans') : 'कारीगर'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-800">
                    {title}
                  </h3>
                  <p className="text-stone-600 text-sm mt-1 leading-relaxed">
                    {cat.description || (isEn ? 'Verified independent artisans in your area.' : 'आपके क्षेत्र के सत्यापित स्वतंत्र कारीगर।')}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                  <span>
                    {isSelected
                      ? (isEn ? 'Hide services list' : 'सेवाएं छुपाएं')
                      : (isEn ? 'View specific skills & services' : 'विशिष्ट कार्य व सेवाएं देखें')}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform text-amber-800 ${isSelected ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Category Services Drawer / Panel */}
      {selectedCategory && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {isEn ? 'Trade Services Breakdown' : 'कार्य व सेवा विवरण'}
              </span>
              <h2 className="text-2xl font-bold text-stone-900">
                {CATEGORY_TITLES[selectedCategory.slug]
                  ? (isEn ? CATEGORY_TITLES[selectedCategory.slug].en : CATEGORY_TITLES[selectedCategory.slug].hi)
                  : selectedCategory.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 underline self-start sm:self-auto"
            >
              {isEn ? 'Close Breakdown' : 'विवरण बंद करें'}
            </button>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (servicesData || []).length === 0 ? (
            <p className="text-sm text-stone-600">
              {isEn ? 'No specific services listed in this category yet.' : 'इस श्रेणी में अभी कोई विशिष्ट सेवा सूचीबद्ध नहीं है।'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(servicesData || []).map((service) => (
                <div
                  key={service.id}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs hover:border-amber-300 transition"
                >
                  <h4 className="font-bold text-stone-900 text-sm">{service.name}</h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                    {service.description || (isEn ? 'Standard neighborhood repair and work.' : 'क्षेत्रीय मरम्मत एवं स्थापना कार्य।')}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                      <Info className="w-3 h-3" /> {isEn ? 'Direct artisan consultation' : 'कारीगर से सीधा परामर्श'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

