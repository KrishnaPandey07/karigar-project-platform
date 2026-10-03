import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import {
  Wrench,
  Plus,
  Trash2,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

export default function VendorServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serviceId: '',
    priceType: 'RANGE',
    priceMin: 50,
    priceMax: 150,
    description: '',
    isAvailable: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient('/vendors/me/services');
      if (res.success) {
        setServices(res.data.services || []);
      }

      // Load mock/fallback catalog services if not loaded
      // We can also fetch vendor's profile to inspect current catalog
      const profRes = await apiClient('/vendors/me/profile');
      if (profRes.success && profRes.data.vendor?.vendorServices) {
        setServices(profRes.data.vendor.vendorServices);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'priceMin' || name === 'priceMax'
          ? parseFloat(value) || 0
          : value,
    }));
    setError(null);
  };

  const handleOpenAddModal = (existing = null) => {
    if (existing) {
      setFormData({
        serviceId: existing.serviceId,
        priceType: existing.priceType || 'RANGE',
        priceMin: Number(existing.priceMin) || 0,
        priceMax: Number(existing.priceMax) || 0,
        description: existing.description || '',
        isAvailable: existing.isAvailable ?? true,
      });
    } else {
      setFormData({
        serviceId: services[0]?.serviceId || '',
        priceType: 'RANGE',
        priceMin: 40,
        priceMax: 120,
        description: '',
        isAvailable: true,
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.priceMax < formData.priceMin) {
      setError('Maximum price must be greater than or equal to minimum price (price_max >= price_min)');
      return;
    }

    if (!formData.serviceId) {
      setError('Please select a service from the catalog');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/vendors/me/services', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setSuccess('Service pricing saved successfully!');
        setIsModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to remove this service from your offerings?')) {
      return;
    }

    try {
      await apiClient(`/vendors/me/services/${serviceId}`, {
        method: 'DELETE',
      });
      setSuccess('Service removed');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete service');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your services & pricing..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-600" />
            Services & Pricing Catalog
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Define your service menu, pricing models, and transparent rate cards for customers.
          </p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add / Update Service
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No services added yet"
          description="Your profile won't appear in search results until you list at least one service with your pricing."
          actionLabel="Add Your First Service"
          onAction={() => handleOpenAddModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((item) => (
            <div
              key={item.id || item.serviceId}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-brand-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 uppercase tracking-wider">
                      {item.service?.category?.name || 'General Service'}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      {item.service?.name || 'Custom Service Offering'}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.isAvailable ? 'Offered' : 'Paused'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {item.description || item.service?.description || 'Standard service offering.'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-400 font-medium">{item.priceType}:</span>
                  <span className="text-lg font-extrabold text-gray-900">
                    ₹{Number(item.priceMin).toFixed(0)} - ₹{Number(item.priceMax).toFixed(0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddModal(item)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(item.serviceId)}
                    title="Remove"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form for Add / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              Configure Service & Pricing
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Set clear expectations so customers know your base pricing models.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Selection *
                </label>
                {services.length > 0 && !formData.serviceId ? (
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">Choose a service...</option>
                    {services.map((s) => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.service?.name || s.serviceId}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    placeholder="Enter or paste service UUID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pricing Model
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-xl text-[11px] font-semibold text-center">
                  {['RANGE', 'FIXED', 'HOURLY', 'QUOTE_ONLY'].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, priceType: pt }))}
                      className={`py-1.5 rounded-lg transition ${
                        formData.priceType === pt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {pt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Minimum Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    name="priceMin"
                    value={formData.priceMin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Maximum Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    name="priceMax"
                    value={formData.priceMax}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Notes / Custom Scope
                </label>
                <textarea
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Includes materials, clean up, and 30-day labor warranty."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailableCheck"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <label htmlFor="isAvailableCheck" className="text-xs text-gray-700 font-medium">
                  Currently accepting orders for this service
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
