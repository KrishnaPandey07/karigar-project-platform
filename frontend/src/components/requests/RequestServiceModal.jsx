/**
 * RequestServiceModal Component
 * Accessible 3-step modal for booking local service professionals.
 * Step 1: What do you need? (Service picker, plain description, urgent toggle)
 * Step 2: When and where? (Date, time slot chips, address)
 * Step 3: Check and send (Summary, price tier, phone confirmation)
 * Reference: Blueprint Sections 6, 10, 13
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  Phone,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const TIME_SLOTS = [
  { id: 'Morning', label: 'Morning (8 AM - 12 PM)' },
  { id: 'Afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { id: 'Evening', label: 'Evening (4 PM - 8 PM)' },
  { id: 'Anytime', label: 'Flexible / Anytime' },
];

export default function RequestServiceModal({
  isOpen,
  onClose,
  vendor,
  initialServiceId = null,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || '');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  );
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('Morning');
  const [address, setAddress] = useState(user?.customerProfile?.address || '');
  const [phone, setPhone] = useState(user?.customerProfile?.phone || '');
  const [duplicateError, setDuplicateError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Initialize service selection if vendor has services
  useEffect(() => {
    if (vendor?.services && vendor.services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(vendor.services[0].id || vendor.services[0].vendorServiceId || '');
    }
  }, [vendor, selectedServiceId]);

  // Pre-fill address and phone from user profile
  useEffect(() => {
    if (user?.customerProfile) {
      if (user.customerProfile.address && !address) {
        setAddress(user.customerProfile.address);
      }
      if (user.customerProfile.phone && !phone) {
        setPhone(user.customerProfile.phone);
      }
    }
  }, [user]);

  // Reset modal state on close
  const handleClose = () => {
    setStep(1);
    setDuplicateError(null);
    setSuccessData(null);
    onClose();
  };

  const selectedService = (vendor?.services || []).find(
    (s) => s.id === selectedServiceId || s.vendorServiceId === selectedServiceId
  );

  // Mutation to submit request
  const requestMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient('/requests', {
        method: 'POST',
        body: payload,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setSuccessData(res.data?.request || true);
    },
    onError: (err) => {
      if (err.code === 'DUPLICATE_REQUEST') {
        const existingId = err.details?.[0]?.existingRequestId;
        setDuplicateError(existingId || true);
      } else {
        alert(err.message || 'Failed to submit service request.');
      }
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    setDuplicateError(null);

    const payload = {
      vendor_service_id: selectedService?.vendorServiceId || selectedService?.id,
      description: description.trim(),
      address: address.trim(),
      preferred_date: preferredDate,
      preferred_time_slot: preferredTimeSlot,
      is_urgent: isUrgent,
    };

    requestMutation.mutate(payload);
  };

  if (!isOpen) return null;

  const isCustomer = user?.role === 'CUSTOMER';
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 id="request-modal-title" className="text-lg font-bold text-gray-900">
              Request Service from {vendor?.businessName}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct connection • Free inquiry • Transparent rates
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        {!successData && !duplicateError && isCustomer && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
              <span className={step >= 1 ? 'text-brand-600 font-bold' : ''}>
                1. {t('requests.step1Title', 'What do you need?')}
              </span>
              <span className={step >= 2 ? 'text-brand-600 font-bold' : ''}>
                2. {t('requests.step2Title', 'When & where?')}
              </span>
              <span className={step >= 3 ? 'text-brand-600 font-bold' : ''}>
                3. {t('requests.step3Title', 'Review & send')}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Guest Check */}
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sign in to request service</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  To keep neighborhood service safe and communicate directly with {vendor?.businessName}, please log in or create a free customer account.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <Link
                  to="/login"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition shadow-sm text-center"
                >
                  Sign In to Continue
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition text-center"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          ) : !isCustomer ? (
            /* Vendor / Admin Role Restriction Banner */
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Customer Account Required</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  You are currently logged in as a <strong>{user.role}</strong>. Only customer accounts can submit service requests to vendors.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : duplicateError ? (
            /* Duplicate Request Error Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request Already Open</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto mt-1 leading-relaxed">
                  {t(
                    'requests.duplicateRequest',
                    'You already have an active request for this service with this vendor.'
                  )}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                {duplicateError !== true && (
                  <Link
                    to={`/requests/${duplicateError}`}
                    onClick={handleClose}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition text-center"
                  >
                    View Existing Request
                  </Link>
                )}
                <Button variant="secondary" size="sm" onClick={handleClose}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : successData ? (
            /* Success Feedback Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Request Sent!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto mt-2 leading-relaxed">
                  Your service inquiry has been sent to{' '}
                  <span className="font-bold text-gray-900">{vendor?.businessName}</span>. We will notify you as soon as they respond with an acceptance or quote.
                </p>
              </div>
              <div className="pt-3 flex flex-col gap-2 max-w-xs mx-auto">
                <Link
                  to="/customer/requests"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition text-center"
                >
                  View My Requests
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  Done
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* Step 1: What do you need? */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Required Service *
                </label>
                {(!vendor?.services || vendor.services.length === 0) ? (
                  <p className="text-xs text-gray-500 italic">No specific service rate cards available.</p>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                  >
                    {vendor.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.priceType === 'RANGE' ? `₹${s.priceMin} - ₹${s.priceMax}` : `₹${s.priceMin}`})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Describe what you need help with *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Kitchen sink pipe is leaking at the joint; need diagnosis and washer/fitting replacement."
                  className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Be as specific as possible so the pro can give an accurate estimate.
                </span>
              </div>

              {/* Urgent Toggle */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      I need this today (Urgent)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Notifies the pro immediately; request expires in 12h if unaccepted.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                  aria-label="Mark request as urgent"
                />
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: When and where? */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Preferred Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    min={minDate}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Preferred Time Slot *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setPreferredTimeSlot(slot.id)}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition ${
                        preferredTimeSlot === slot.id
                          ? 'bg-brand-50 text-brand-700 border-brand-300 ring-1 ring-brand-300'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Service Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address, building, or apartment number"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Check and send */
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Vendor:</span>
                  <span className="font-bold text-gray-900">{vendor?.businessName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-bold text-gray-900">{selectedService?.name || 'General'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Estimated Rate:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedService?.priceType === 'RANGE'
                      ? `₹${selectedService.priceMin} - ₹${selectedService.priceMax}`
                      : `₹${selectedService?.priceMin || 'TBD'}`}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Preferred Time:</span>
                  <span className="font-semibold text-gray-800">
                    {preferredDate} • {preferredTimeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-semibold text-gray-800 max-w-[200px] truncate text-right">
                    {address}
                  </span>
                </div>
                {isUrgent && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-amber-700 font-bold">
                    <span>Priority:</span>
                    <span>Urgent (12h Expiration)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm Your Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number for direct coordination"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Shared with the pro once they accept your request.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Buttons */}
        {!successData && !duplicateError && isCustomer && (
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-slate-50/60 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={step === 1 && !description.trim()}
                onClick={() => {
                  if (step === 1 && !description.trim()) return;
                  if (step === 2 && !address.trim()) {
                    alert('Please provide a service address.');
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={requestMutation.isPending || !phone.trim()}
                onClick={handleSubmit}
              >
                {requestMutation.isPending ? 'Sending Request...' : 'Send Service Request'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
