import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { MapPin, Navigation, Loader2, AlertCircle, Check, X, Search } from 'lucide-react';
import {
  INDIAN_CITIES,
  searchIndianCities,
  reverseGeocodeCoords,
  findNearestCity,
} from '../../utils/indianLocations';

const LAST_AREA_STORAGE_KEY = 'karigar_last_selected_area';

export default function LocationPicker({
  value,
  onChange,
  label,
  placeholder,
  showUseMyLocation = true,
  error,
  className = '',
}) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  const containerRef = useRef(null);

  // Fetch standard active service locations from backend
  const { data: dbLocationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await apiClient('/locations');
      return res?.data?.locations || [];
    },
  });

  const dbLocations = dbLocationsData || [];

  // Determine current display label
  const displayLabel = () => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value.city) {
      if (value.state) return `${value.city}, ${value.state}`;
      return value.city;
    }
    return '';
  };

  // Restore saved area from localStorage if no initial value provided
  useEffect(() => {
    if (!value) {
      try {
        const savedJson = localStorage.getItem(LAST_AREA_STORAGE_KEY);
        if (savedJson) {
          const parsed = JSON.parse(savedJson);
          if (parsed && onChange) {
            onChange(parsed);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [value, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelection = (selectedLoc) => {
    if (selectedLoc) {
      try {
        localStorage.setItem(LAST_AREA_STORAGE_KEY, JSON.stringify(selectedLoc));
      } catch {
        // ignore storage errors
      }
    }
    if (onChange) {
      onChange(selectedLoc);
    }
    setIsOpen(false);
    setSearchInput('');
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage({
        type: 'error',
        text: isEn
          ? 'Geolocation is not supported by your browser.'
          : 'ब्राउज़र में लोकेशन सुविधा उपलब्ध नहीं है। कृपया अपना शहर सूची से चुनें।',
      });
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Perform reverse geocoding via OpenStreetMap
          const geoResult = await reverseGeocodeCoords(latitude, longitude);
          const detectedLoc = {
            id: `gps-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
            city: geoResult.locality || geoResult.city || 'My Location',
            state: geoResult.state,
            postalCode: geoResult.postalCode,
            lat: latitude,
            lng: longitude,
          };
          handleSelection(detectedLoc);
          setGpsMessage({
            type: 'success',
            text: isEn
              ? `Detected: ${detectedLoc.city} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
              : `लोकेशन मिली: ${detectedLoc.city}`,
          });
        } catch {
          const nearest = findNearestCity(latitude, longitude);
          const fallbackLoc = {
            id: nearest.id,
            city: isEn ? nearest.nameEn : nearest.nameHi,
            state: isEn ? nearest.stateEn : nearest.stateHi,
            lat: latitude,
            lng: longitude,
          };
          handleSelection(fallbackLoc);
          setGpsMessage({
            type: 'success',
            text: isEn
              ? `Nearby location: ${fallbackLoc.city}`
              : `निकटतम क्षेत्र: ${fallbackLoc.city}`,
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (geoError) => {
        setGpsLoading(false);
        let msg = isEn
          ? 'Could not access GPS. Please choose your city/area from the list.'
          : 'लोकेशन अनुमति नहीं मिली। कृपया नीचे अपना शहर चुनें।';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = isEn
            ? 'Location permission was denied. You can select your area manually.'
            : 'लोकेशन की अनुमति अस्वीकृत की गई। आप अपना शहर स्वयं चुन सकते हैं।';
        }
        setGpsMessage({
          type: 'error',
          text: msg,
        });
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Filtered Indian Cities list based on user search
  const filteredCities = searchIndianCities(searchInput);

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold text-stone-800">
            {label}
          </label>
        )}

        {showUseMyLocation && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={gpsLoading}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50 ml-auto"
            aria-label="Detect my current location with GPS"
          >
            {gpsLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-amber-800" />
            )}
            {isEn ? 'Use GPS' : 'मेरी लोकेशन'}
          </button>
        )}
      </div>

      {gpsMessage && (
        <div
          className={`flex items-start gap-2 p-2 rounded-xl text-[11px] font-medium ${
            gpsMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {gpsMessage.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
          ) : (
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
          )}
          <span>{gpsMessage.text}</span>
        </div>
      )}

      {/* Main Trigger Input / Button */}
      <div className="relative">
        <MapPin className="w-4 h-4 text-amber-800 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full pl-10 pr-8 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-left focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none text-stone-900 transition flex items-center justify-between"
        >
          <span className={displayLabel() ? 'font-semibold text-stone-900 truncate' : 'text-stone-400 truncate'}>
            {displayLabel() || placeholder || (isEn ? 'Select or type any city/area' : 'शहर या क्षेत्र चुनें')}
          </span>
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleSelection(null);
              }}
              className="p-1 hover:bg-stone-100 rounded-md text-stone-400 hover:text-stone-700"
              title={isEn ? 'Clear area' : 'हटाएं'}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>

        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]">
          ▼
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-amber-300 rounded-2xl shadow-xl p-3 max-h-80 overflow-y-auto space-y-2">
          {/* Search Field inside Popover */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isEn ? 'Search city, town or PIN code...' : 'शहर, कस्बा या पिनकोड खोजें...'}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800 font-medium"
            />
          </div>

          {/* Quick Option: Any / All Areas */}
          <button
            type="button"
            onClick={() => handleSelection(null)}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-amber-50 hover:text-amber-900 transition flex items-center justify-between"
          >
            <span>{isEn ? '📍 All India / Anywhere' : '📍 पूरे भारत में / कहीं भी'}</span>
            {!value && <Check className="w-3.5 h-3.5 text-amber-800" />}
          </button>

          {/* List of matched Indian Cities */}
          <div className="divide-y divide-stone-100 pt-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-3 pb-1 block">
              {isEn ? 'Popular Indian Cities & Districts' : 'प्रमुख भारतीय शहर व जिले'}
            </span>
            {filteredCities.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-500">
                <p>{isEn ? `No preset for "${searchInput}".` : `"${searchInput}" के लिए प्रीसेट नहीं मिला।`}</p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelection({
                      id: `custom-${Date.now()}`,
                      city: searchInput.trim(),
                    });
                  }}
                  className="mt-2 inline-block px-3 py-1 bg-amber-800 text-amber-50 rounded-lg text-xs font-bold"
                >
                  {isEn ? `Search as "${searchInput}"` : `"${searchInput}" नाम से खोजें`}
                </button>
              </div>
            ) : (
              filteredCities.map((city) => {
                const cityName = isEn ? city.nameEn : city.nameHi;
                const stateName = isEn ? city.stateEn : city.stateHi;
                const isSelected =
                  value &&
                  (value.id === city.id ||
                    (value.city && value.city.toLowerCase() === city.nameEn.toLowerCase()));

                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() =>
                      handleSelection({
                        id: city.id,
                        city: city.nameEn,
                        cityHi: city.nameHi,
                        state: city.stateEn,
                        postalCode: city.pincode,
                        lat: city.lat,
                        lng: city.lng,
                      })
                    }
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 font-bold'
                        : 'hover:bg-amber-50 text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-stone-900">{cityName}</div>
                      <div className="text-[10px] text-stone-500">
                        {stateName} {city.pincode ? `• PIN: ${city.pincode}` : ''}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-800 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
