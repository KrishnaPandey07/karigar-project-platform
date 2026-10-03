import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User,
  Wrench,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { RangoliMandala } from '../components/common/IndianArtDecorations';
import {
  INDIAN_CITIES,
  reverseGeocodeCoords,
  findNearestCity,
  searchIndianCities,
} from '../utils/indianLocations';
import RegisterSuccessModal from '../components/common/RegisterSuccessModal';

export default function RegisterPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('VENDOR'); // Default to Vendor/Artisan for fast onboarding
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    address: '',
    lat: 28.6139,
    lng: 77.2090,
  });

  const [idProofNumber, setIdProofNumber] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'lat' || name === 'lng' ? parseFloat(value) || 0 : value,
      };

      // If typing in address, attempt to resolve coordinates from known cities
      if (name === 'address' && value && value.length >= 3) {
        const matched = INDIAN_CITIES.find(
          (c) =>
            c.nameEn.toLowerCase() === value.trim().toLowerCase() ||
            c.nameHi === value.trim() ||
            value.toLowerCase().includes(c.nameEn.toLowerCase())
        );
        if (matched) {
          next.lat = matched.lat;
          next.lng = matched.lng;
        }
      }
      return next;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(isEn ? 'Geolocation is not supported by your browser.' : 'ब्राउज़र में लोकेशन सुविधा उपलब्ध नहीं है।');
      return;
    }
    setGpsStatus(isEn ? 'Detecting your location via GPS...' : 'GPS से आपकी लोकेशन खोजी जा रही है...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedAddress = '';
        try {
          const res = await reverseGeocodeCoords(latitude, longitude);
          detectedAddress = res.displayName || res.locality || res.city || '';
        } catch {
          const nearest = findNearestCity(latitude, longitude);
          detectedAddress = isEn ? nearest.nameEn : nearest.nameHi;
        }

        setFormData((prev) => ({
          ...prev,
          lat: Math.round(latitude * 10000) / 10000,
          lng: Math.round(longitude * 10000) / 10000,
          address: detectedAddress || prev.address,
        }));
        setGpsStatus(isEn ? `Location: ${detectedAddress}` : `लोकेशन मिल गई: ${detectedAddress}`);
      },
      () => {
        setGpsStatus(isEn ? 'Could not access GPS. Please pick or type your city below.' : 'लोकेशन नहीं मिल सकी। कृपया नीचे अपना शहर चुनें या लिखें।');
      }
    );
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const cleanPhone = (formData.phone || '').trim();
      const payload = {
        password: formData.password,
        role,
        phone: cleanPhone || undefined,
        address: formData.address || undefined,
      };

      if (formData.email && formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      if (role === 'CUSTOMER') {
        payload.fullName = formData.fullName;
      } else {
        payload.businessName = formData.businessName;
        payload.lat = formData.lat;
        payload.lng = formData.lng;
        if (idProofNumber.trim()) {
          payload.bio = `${isEn ? 'Verified Identity' : 'सत्यापित पहचान'}: ${idProofNumber.trim()}`;
        }
      }

      await register(payload);
      setShowSuccessModal(true);
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const errors = {};
        err.details.forEach((d) => {
          errors[d.field] = d.message;
        });
        setFieldErrors(errors);
      }
      setError(
        err.message ||
          (isEn
            ? 'Registration failed. Please check your information and try again.'
            : 'पंजीकरण विफल रहा। कृपया अपनी जानकारी जांचें और पुनः प्रयास करें।')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/40 via-white to-stone-50 relative overflow-hidden">
      <RangoliMandala className="w-64 h-64 text-amber-900/5 absolute -top-16 -right-16 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold mb-3 border border-amber-300">
          <span>{isEn ? 'Karigar • Direct Connection' : 'कारीगर (Karigar) • सीधा संपर्क'}</span>
        </div>
        <h2 className="text-3xl font-black text-stone-900 tracking-tight">
          {role === 'VENDOR'
            ? (isEn ? 'Artisan Free Registration' : 'कारीगर पंजीकरण (निःशुल्क)')
            : (isEn ? 'Create Customer Account' : 'ग्राहक पंजीकरण')}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 font-medium max-w-lg mx-auto">
          {role === 'VENDOR'
            ? (isEn
                ? 'Register with your phone number, trade and identity proof. Start receiving direct customer calls with zero commission!'
                : 'अपना मोबाइल नंबर, काम का नाम और पहचान पत्र दर्ज करें। बिना किसी कमीशन या बिचौलिए के सीधे ग्राहकों के फोन पाएं!')
            : (isEn
                ? 'Register to find and directly call verified local artisans in your neighborhood.'
                : 'अपने क्षेत्र के अनुभवी व हुनरमंद कारीगरों से सीधे संपर्क के लिए निःशुल्क खाता बनाएं।')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 relative z-10">
        <div className="bg-white py-8 px-6 shadow-md border-2 border-amber-200/90 rounded-3xl sm:px-10">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-stone-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('VENDOR')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                role === 'VENDOR'
                  ? 'bg-amber-800 text-amber-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              {isEn ? 'I am an Artisan' : 'मैं कुशल कारीगर हूँ'}
            </button>
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                role === 'CUSTOMER'
                  ? 'bg-amber-800 text-amber-50 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              {isEn ? 'I need an Artisan' : 'मुझे कारीगर चाहिए'}
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Primary Phone Number */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isEn ? 'Mobile Phone Number *' : 'मोबाइल नंबर (फोन) *'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-4 h-4 text-amber-800" />
                </div>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={isEn ? 'e.g. 9811122334' : 'उदा. 9811122334'}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-500 font-medium">
                {role === 'VENDOR'
                  ? (isEn ? 'Clients will call this number directly, and you can log in with it.' : 'ग्राहक इसी नंबर पर फोन करेंगे, और आप इसी से लॉग इन भी करेंगे।')
                  : (isEn ? 'Your contact number for direct updates.' : 'कारीगर से संपर्क के लिए आपका फोन नंबर।')}
              </p>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.phone}</p>
              )}
            </div>

            {/* 2. Name or Business Trade Name */}
            {role === 'CUSTOMER' ? (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Your Full Name *' : 'आपका पूरा नाम *'}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4 text-amber-800" />
                  </div>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={isEn ? 'e.g. Rahul Sharma' : 'उदा. राहुल शर्मा'}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.fullName}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Your Name & Trade Skill *' : 'आपका नाम व कारीगरी कार्य *'}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Building className="w-4 h-4 text-amber-800" />
                  </div>
                  <input
                    type="text"
                    required
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder={isEn ? 'e.g. Ramesh Sharma (Electrician), Ramphal (Gardener)' : 'उदा. रमेश शर्मा (इलेक्ट्रीशियन), रामफल (माली), राधे श्याम (हलवाई)'}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                  />
                </div>
                {fieldErrors.businessName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.businessName}</p>
                )}
              </div>
            )}

            {/* 3. Identity Verification Proof (Aadhaar / PAN) for Artisans */}
            {role === 'VENDOR' && (
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-300/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  <span>{isEn ? 'Identity Proof (Aadhaar / PAN Card Number) *' : 'पहचान पत्र (आधार कार्ड या पैन कार्ड नंबर) *'}</span>
                </div>
                <input
                  type="text"
                  required
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder={isEn ? 'e.g. 9823-4512-7801 or ABCDE1234F' : 'उदा. 9823-4512-7801 या ABCDE1234F'}
                  className="block w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-800 font-medium"
                />
                <span className="text-[11px] text-stone-600 block leading-tight">
                  {isEn
                    ? 'Verified ID badge builds instant trust among neighborhood clients.'
                    : 'पहचान सत्यापित होने से क्षेत्र के ग्राहक आप पर तुरंत विश्वास करते हैं।'}
                </span>
              </div>
            )}

            {/* 4. Area / City Address */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isEn ? 'City & Neighborhood Area *' : 'शहर व क्षेत्र / कॉलोनी *'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <MapPin className="w-4 h-4 text-amber-800" />
                </div>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={isEn ? 'e.g. Connaught Place, New Delhi or Kothrud, Pune' : 'उदा. करोल बाग, नई दिल्ली या कोथरुड, पुणे'}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                />
              </div>
              {fieldErrors.address && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.address}</p>
              )}
            </div>

            {/* Vendor Hyperlocal Coordinates Picker */}
            {role === 'VENDOR' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    {isEn ? 'Choose Your Operating City / Area:' : 'कार्य शहर / क्षेत्र चुनें:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition"
                  >
                    <Navigation className="w-3 h-3 text-amber-800" />
                    {isEn ? 'Auto-Detect (GPS)' : 'GPS से ऑटो-डिटेक्ट'}
                  </button>
                </div>

                {gpsStatus && (
                  <p className="text-[11px] font-semibold text-emerald-800">{gpsStatus}</p>
                )}

                {/* All-India Cities Dropdown */}
                <select
                  value={
                    INDIAN_CITIES.find(
                      (c) => c.lat === formData.lat && c.lng === formData.lng
                    )?.id || ''
                  }
                  onChange={(e) => {
                    const c = INDIAN_CITIES.find((x) => x.id === e.target.value);
                    if (c) {
                      setFormData((prev) => ({
                        ...prev,
                        lat: c.lat,
                        lng: c.lng,
                        address: prev.address || (isEn ? c.nameEn : c.nameHi),
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-800 outline-none"
                >
                  <option value="">
                    {isEn ? '-- Select City / District across India --' : '-- पूरे भारत में से अपना शहर / जिला चुनें --'}
                  </option>
                  {INDIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isEn ? c.nameEn : c.nameHi} ({isEn ? c.stateEn : c.stateHi})
                    </option>
                  ))}
                </select>

                {/* Popular Region Quick Chips */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">
                    {isEn ? 'Quick Select Popular Hubs:' : 'जल्दी चुनें:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {INDIAN_CITIES.slice(0, 15).map((c) => {
                      const cityName = isEn ? c.nameEn : c.nameHi;
                      const isSelected = formData.lat === c.lat && formData.lng === c.lng;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              lat: c.lat,
                              lng: c.lng,
                              address: prev.address || cityName,
                            }));
                          }}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                            isSelected
                              ? 'bg-amber-800 text-amber-50 border-amber-800'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
                          }`}
                        >
                          {cityName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Password */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {isEn ? 'Create Password *' : 'पासवर्ड बनाएं *'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4 text-amber-800" />
                </div>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEn ? 'At least 8 chars, 1 capital letter & 1 number' : 'कम से कम 8 अक्षर, 1 बड़ा अक्षर व 1 नंबर'}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* 6. Email Address - Strictly Optional */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Email Address (Optional)' : 'ईमेल पता (वैकल्पिक / Optional)'}
                </label>
                <span className="text-[11px] text-stone-500 font-medium">
                  {isEn ? 'Leave blank if you do not have email' : 'ईमेल न हो तो खाली छोड़ दें'}
                </span>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isEn ? 'name@gmail.com (optional)' : 'name@gmail.com (यदि हो तो भरें)'}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEn ? 'Registering...' : 'पंजीकरण हो रहा है...'}
                </>
              ) : (
                <>
                  {role === 'VENDOR'
                    ? (isEn ? 'Complete Artisan Registration' : 'कारीगर पंजीकरण पूरा करें')
                    : (isEn ? 'Create Customer Account' : 'ग्राहक खाता बनाएं')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-600 font-medium">
            {isEn ? 'Already have an account? ' : 'पहले से खाता है? '}
            <Link to="/login" className="font-bold text-amber-800 hover:text-amber-900 underline">
              {isEn ? 'Sign In with Mobile Number' : 'मोबाइल नंबर से लॉग इन करें'}
            </Link>
          </div>
        </div>
      </div>

      <RegisterSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        businessName={formData.businessName || formData.fullName}
        phone={formData.phone}
        city={formData.address}
        role={role}
      />
    </div>
  );
}

