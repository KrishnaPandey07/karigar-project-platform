import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import ProfileCompletenessCard from '../../components/vendor/ProfileCompletenessCard';
import VendorProfileWizard from './VendorProfileWizard';
import VendorServicesPage from './VendorServicesPage';
import VendorAvailabilityPage from './VendorAvailabilityPage';
import LoadingState from '../../components/common/LoadingState';
import DutyStatusSwitcher from '../../components/common/DutyStatusSwitcher';
import {
  Wrench,
  ToggleLeft,
  ToggleRight,
  Star,
  Clock,
  Tag,
  Calendar,
  Eye,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function VendorDashboardPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | profile | services | availability | preview
  const [wizardStep, setWizardStep] = useState(1);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  const fetchVendorData = async () => {
    try {
      const res = await apiClient('/vendors/me/profile');
      if (res.success && res.data?.vendor) {
        setVendor(res.data.vendor);
      }
    } catch (err) {
      console.error('Failed to fetch vendor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!vendor) return;
    setIsTogglingAvailability(true);
    const newStatus = !vendor.isAvailable;

    try {
      const res = await apiClient('/vendors/me/availability', {
        method: 'PATCH',
        body: { isAvailable: newStatus },
      });

      if (res.success) {
        setVendor((prev) => ({ ...prev, isAvailable: newStatus }));
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleCompletenessAction = (fieldDescription) => {
    if (fieldDescription.includes('bio') || fieldDescription.includes('address')) {
      setWizardStep(1);
      setActiveTab('profile');
    } else if (fieldDescription.includes('picture') || fieldDescription.includes('logo')) {
      setWizardStep(3);
      setActiveTab('profile');
    } else if (fieldDescription.includes('service')) {
      setActiveTab('services');
    } else if (fieldDescription.includes('working hours') || fieldDescription.includes('schedule')) {
      setActiveTab('availability');
    } else if (fieldDescription.includes('license') || fieldDescription.includes('verification')) {
      setWizardStep(4);
      setActiveTab('profile');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your vendor workspace..." />;
  }

  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Vendor Profile Not Found</h2>
        <p className="text-gray-500 text-sm mt-1">Please ensure your account has the VENDOR role.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Instant Availability Toggle Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {vendor.avatarUrl ? (
            <img
              src={vendor.avatarUrl}
              alt={vendor.businessName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-2xl border border-brand-200">
              {vendor.businessName.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {vendor.businessName}
              </h1>
              {vendor.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Pro
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {vendor.address || 'Address pending'} • Response ~{vendor.responseTimeAvg} mins
            </p>
          </div>
        </div>

        {/* Live Status Switch */}
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200">
          <div className="text-right">
            <span className="block text-xs font-bold text-gray-700">Quick Switch</span>
            <span className="text-[11px] text-gray-500">
              {vendor.isAvailable ? '🟢 Free Now' : '🔴 Busy'}
            </span>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={isTogglingAvailability}
            className="flex items-center transition"
            title="Click to toggle live availability"
          >
            {vendor.isAvailable ? (
              <ToggleRight className="w-10 h-10 text-emerald-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-400 cursor-pointer" />
            )}
          </button>
        </div>
      </div>

      {/* 3-State Work Status Switcher & Daily Reminder */}
      <DutyStatusSwitcher
        currentStatus={vendor.dutyStatus}
        isAvailable={vendor.isAvailable}
        onChange={(newStatus) => {
          setVendor((prev) => ({
            ...prev,
            dutyStatus: newStatus,
            isAvailable: newStatus === 'AVAILABLE',
          }));
        }}
      />

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-1 text-sm font-semibold">
        {[
          { key: 'overview', label: 'Overview', icon: UserCheck },
          { key: 'profile', label: 'Edit Profile & Map Pin', icon: MapPin },
          { key: 'services', label: 'Services & Rates', icon: Tag },
          { key: 'availability', label: 'Hours & Time Off', icon: Calendar },
          { key: 'preview', label: 'Customer View', icon: Eye },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Profile Completeness Health Bar */}
          <ProfileCompletenessCard
            completeness={vendor.completeness}
            onActionClick={handleCompletenessAction}
          />

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bayesian Rating
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <span className="text-3xl font-extrabold text-gray-900">
                  {vendor.ratingAvg ? vendor.ratingAvg.toFixed(1) : '5.0'}
                </span>
                <span className="text-xs text-gray-400">({vendor.ratingCount || 0} reviews)</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Services Offered
              </span>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">
                {vendor.vendorServices?.length || 0}
              </p>
              <button
                onClick={() => setActiveTab('services')}
                className="text-xs text-brand-600 font-semibold hover:underline mt-1 block"
              >
                Manage rates &rarr;
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trust Verification
              </span>
              <div className="flex items-center gap-2 mt-2">
                {vendor.isVerified ? (
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Fully Verified
                  </span>
                ) : (
                  <span className="text-sm font-bold text-amber-700 flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-amber-600" /> Verification Pending
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setWizardStep(4);
                  setActiveTab('profile');
                }}
                className="text-xs text-brand-600 font-semibold hover:underline mt-1 block"
              >
                Upload documents &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profile Wizard */}
      {activeTab === 'profile' && (
        <VendorProfileWizard
          initialStep={wizardStep}
          onProfileUpdated={fetchVendorData}
        />
      )}

      {/* Tab: Services & Rates */}
      {activeTab === 'services' && <VendorServicesPage />}

      {/* Tab: Working Hours & Time Off */}
      {activeTab === 'availability' && <VendorAvailabilityPage />}

      {/* Tab: Customer Preview */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wider">
              Customer Profile Preview
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">{vendor.businessName}</h2>
            <p className="text-xs text-gray-500 mt-1">{vendor.address}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {vendor.bio || 'No biography written yet.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Available Services ({vendor.vendorServices?.length || 0})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendor.vendorServices?.map((vs) => (
                <div key={vs.id || vs.serviceId} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <h5 className="font-semibold text-xs text-gray-900">{vs.service?.name || 'Service'}</h5>
                  <span className="text-xs font-bold text-brand-700 mt-1 block">
                    ₹{Number(vs.priceMin)} - ₹{Number(vs.priceMax)} ({vs.priceType})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
