import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import LocationPickerMap from '../../components/vendor/LocationPickerMap';
import LoadingState from '../../components/common/LoadingState';
import {
  Building2,
  MapPin,
  Camera,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function VendorProfileWizard({ onProfileUpdated, initialStep = 1 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: null, success: null });

  const [profileData, setProfileData] = useState({
    businessName: '',
    bio: '',
    phone: '',
    address: '',
    lat: 28.6139,
    lng: 77.2090,
    responseTimeAvg: 20,
    serviceRadiusKm: 15,
    avatarUrl: null,
    bannerUrl: null,
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('AADHAAR_CARD');
  const [docIdNumber, setDocIdNumber] = useState('');

  useEffect(() => {
    async function loadVendorData() {
      try {
        const res = await apiClient('/vendors/me/profile');
        if (res.success && res.data?.vendor) {
          const v = res.data.vendor;
          setProfileData({
            businessName: v.businessName || '',
            bio: v.bio || '',
            phone: v.phone || '',
            address: v.address || '',
            lat: v.lat || 28.6139,
            lng: v.lng || 77.2090,
            responseTimeAvg: v.responseTimeAvg || 20,
            serviceRadiusKm: v.serviceAreas?.[0]?.radiusKm || 15,
            avatarUrl: v.avatarUrl || null,
            bannerUrl: v.bannerUrl || null,
          });
          if (v.avatarUrl) {
            setAvatarPreview(v.avatarUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendorData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]:
        name === 'lat' || name === 'lng' || name === 'responseTimeAvg' || name === 'serviceRadiusKm'
          ? parseFloat(value) || 0
          : value,
    }));
    setFeedback({ error: null, success: null });
  };

  const handleLocationChange = (newLat, newLng) => {
    setProfileData((prev) => ({ ...prev, lat: newLat, lng: newLng }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const saveCurrentStep = async () => {
    setIsSaving(true);
    setFeedback({ error: null, success: null });

    try {
      // 1. Update basic profile & coordinates
      const updatePayload = {
        businessName: profileData.businessName,
        bio: profileData.bio,
        phone: profileData.phone,
        address: profileData.address,
        lat: profileData.lat,
        lng: profileData.lng,
        responseTimeAvg: Math.round(profileData.responseTimeAvg),
        serviceRadiusKm: Math.round(profileData.serviceRadiusKm),
      };

      await apiClient('/vendors/me/profile', {
        method: 'PUT',
        body: updatePayload,
      });

      // 2. Upload avatar if selected in step 3
      if (currentStep === 3 && avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        formData.append('type', 'avatar');

        const token = localStorage.getItem('locallink_token');
        const uploadRes = await fetch('/api/v1/vendors/me/upload-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) {
          throw new Error(uploadJson.error?.message || 'Avatar upload failed');
        }
      }

      // 3. Upload verification document if selected in step 4
      if (currentStep === 4 && docFile) {
        const compositeDocType = docIdNumber.trim() ? `${docType}:${docIdNumber.trim()}` : docType;
        formData.append('documentType', compositeDocType);

        const token = localStorage.getItem('locallink_token');
        const docRes = await fetch('/api/v1/vendors/me/upload-document', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const docJson = await docRes.json();
        if (!docJson.success) {
          throw new Error(docJson.error?.message || 'Document upload failed');
        }
      }

      setFeedback({ success: 'Changes saved successfully!', error: null });
      if (onProfileUpdated) onProfileUpdated();

      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      }
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to save changes. Please check all fields.', success: null });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your business profile..." />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Friendly Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>Step {currentStep} of 4</span>
          <span>{currentStep === 1 ? 'Business Basics' : currentStep === 2 ? 'Location Pin' : currentStep === 3 ? 'Visuals' : 'Credentials'}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                step <= currentStep ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {feedback.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{feedback.error}</span>
        </div>
      )}

      {feedback.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Step 1: Basics */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              Tell Neighbors About Your Business
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Give your business an authentic, professional voice. Clear details build immediate confidence.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Business or Trade Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={profileData.businessName}
                onChange={handleInputChange}
                placeholder="e.g. Sharma Electricals & Appliances"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  About You & Your Experience *
                </label>
                <span className="text-xs text-gray-400">
                  {profileData.bio.length}/1500 chars
                </span>
              </div>
              <textarea
                rows={4}
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="Share your years of expertise, specialized tools, guarantees, and what makes your craft unique..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Mentioning certifications or years of local service increases customer inquiry rates by 40%.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                  📞 Customers can directly call this number or click "WhatsApp" on your profile to discuss jobs and confirm appointments.
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" />
                  Average Response Time (minutes)
                </label>
                <input
                  type="number"
                  name="responseTimeAvg"
                  min="5"
                  max="1440"
                  value={profileData.responseTimeAvg}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <span className="text-[11px] text-gray-400">Used in our ranking formula (T score).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location Map */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Set Your Precise Neighborhood Location
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              LocalLink connects you with customers in your immediate vicinity. Position your pin on the map.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Physical Street Address or Base Area *
            </label>
            <input
              type="text"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              placeholder="e.g. Shop 14, Main Market, Connaught Place, New Delhi"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-3"
            />
          </div>

          {/* Interactive Leaflet Map Pin */}
          <LocationPickerMap
            lat={profileData.lat}
            lng={profileData.lng}
            radiusKm={profileData.serviceRadiusKm}
            address={profileData.address}
            onLocationChange={handleLocationChange}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Service Radius: {profileData.serviceRadiusKm} km
              </label>
              <span className="text-xs text-gray-500 font-medium">
                ~{(profileData.serviceRadiusKm * 0.621371).toFixed(1)} miles
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              name="serviceRadiusKm"
              value={profileData.serviceRadiusKm}
              onChange={handleInputChange}
              className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              Green dashed circle shows how far your profile is pre-filtered for nearby customer search requests.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Photos & Branding */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-600" />
              Upload Profile Photo or Logo
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Customers like seeing the human face or official trademark behind local services.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Preview"
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-brand-500 shadow-sm"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[11px]">No Photo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="text-sm font-semibold text-gray-900">Choose Profile Picture</h4>
              <p className="text-xs text-gray-500">
                Recommended: Square image (JPEG, PNG, WebP) up to 5MB.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition shadow-sm">
                <Upload className="w-4 h-4 text-brand-600" />
                Select File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
              {avatarFile && (
                <span className="block text-xs text-brand-700 font-medium">
                  Selected: {avatarFile.name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Verification & Trust Badge */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              Submit Credentials for Verified Pro Badge
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Verified vendors receive an instant 10% ranking boost and an official trust badge shown to customers.
            </p>
          </div>

          <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-purple-900 text-xs sm:text-sm flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Private & Secure Storage</span>
              All credentials uploaded here are strictly marked private in compliance with Section 17 security rules. Only authorized platform administrators can inspect them for review.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Document / Identification Type *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-gray-800"
              >
                <option value="AADHAAR_CARD">🪪 Aadhaar Card (UIDAI)</option>
                <option value="PAN_CARD">💳 PAN Card (Income Tax Dept)</option>
                <option value="VOTER_ID">🗳️ Voter Identity Card (EPIC)</option>
                <option value="DRIVING_LICENSE">🚗 Driving Licence</option>
                <option value="PASSPORT">🛂 Passport</option>
                <option value="TRADE_LICENSE">🏢 Trade License / Municipal Shop Act</option>
                <option value="GST_MSME">📑 GST Registration / MSME Udyam Certificate</option>
                <option value="CERTIFICATE">📜 Vocational Skill / Trade Certificate</option>
                <option value="INSURANCE">🛡️ Proof of General Liability Insurance</option>
                <option value="OTHER_GOVT_ID">📄 Other Official Government Photo ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Identification / Document Number (Optional)
              </label>
              <input
                type="text"
                value={docIdNumber}
                onChange={(e) => setDocIdNumber(e.target.value)}
                placeholder={
                  docType === 'AADHAAR_CARD'
                    ? 'e.g. 12-digit Aadhaar No (XXXX XXXX 1234)'
                    : docType === 'PAN_CARD'
                    ? 'e.g. 10-digit PAN (ABCDE1234F)'
                    : docType === 'VOTER_ID'
                    ? 'e.g. Voter ID / EPIC Number'
                    : docType === 'DRIVING_LICENSE'
                    ? 'e.g. Driving Licence Number'
                    : 'e.g. Document registration or license number'
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Helps our administration team verify your business credentials faster.
              </span>
            </div>

            <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-brand-500 transition">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">
                Upload Verification Document (PDF, JPG, PNG)
              </p>
              <p className="text-xs text-gray-500 mb-4">Max file size: 5MB</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm">
                Browse Document
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {docFile && (
                <div className="mt-3 text-xs font-medium text-emerald-700">
                  Ready to submit: {docFile.name} ({(docFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={saveCurrentStep}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : currentStep === 4 ? 'Finish & Save Profile' : 'Save & Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
