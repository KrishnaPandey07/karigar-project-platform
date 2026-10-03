import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../../components/common/LocationPicker';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';

export default function CustomerProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Deactivate Modal State
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);

  // Fetch full user profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await apiClient('/users/me');
      return res?.data?.user || null;
    },
  });

  useEffect(() => {
    if (profileData) {
      const p = profileData.customerProfile || {};
      setFullName(p.fullName || '');
      setPhone(p.phone || '');
      setAddress(p.address || '');
      if (p.defaultLocation) {
        setDefaultLocation(p.defaultLocation);
      } else if (p.defaultLocationId) {
        setDefaultLocation({ id: p.defaultLocationId });
      }
    }
  }, [profileData]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient('/users/me', {
        method: 'PUT',
        body: payload,
      });
    },
    onSuccess: async () => {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      setTimeout(() => setProfileMsg(null), 3000);
    },
    onError: (err) => {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    },
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient('/users/me/password', {
        method: 'PUT',
        body: payload,
      });
    },
    onSuccess: () => {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    },
    onError: (err) => {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
    },
  });

  // Soft delete mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiClient('/users/me', { method: 'DELETE' });
    },
    onSuccess: async () => {
      setDeactivateModalOpen(false);
      await logout();
      navigate('/login?deactivated=true');
    },
    onError: (err) => {
      setDeactivateError(err.message || 'Failed to deactivate account.');
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileMsg(null);
    profileMutation.mutate({
      fullName,
      phone,
      address,
      defaultLocationId: defaultLocation?.id || undefined,
      defaultLat: defaultLocation?.lat || undefined,
      defaultLng: defaultLocation?.lng || undefined,
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    passwordMutation.mutate({
      oldPassword,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState message="Loading your account settings and profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your personal details, default service neighborhood, and security credentials.
        </p>
      </div>

      {/* 1. Customer Personal Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Personal & Location Profile</h2>
            <p className="text-xs text-gray-400">Used for nearby service matching and vendor communication</p>
          </div>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {profileMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alice Johnson"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Street / Apt Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* LocationPicker Shared Component with GPS Fallback */}
          <LocationPicker
            value={defaultLocation}
            onChange={(loc) => setDefaultLocation(loc)}
            label="Default Service Neighborhood"
            placeholder="Select your primary neighborhood..."
          />

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={profileMutation.isPending}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Password Security Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-400">Requires verification of your current password</p>
          </div>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {passwordMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              isLoading={passwordMutation.isPending}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Account Deactivation Danger Zone */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-bold text-rose-900">Deactivate Account</h2>
        </div>
        <p className="text-xs text-rose-700 max-w-xl leading-relaxed">
          Deactivating your account will soft-delete your customer profile, revoke all login tokens,
          and remove you from notifications. Note: You cannot deactivate your account while you have active
          service requests pending or in progress.
        </p>

        <div>
          <button
            type="button"
            onClick={() => {
              setDeactivateError(null);
              setDeactivateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Trash2 className="w-4 h-4" /> Deactivate My Account
          </button>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Confirm Account Deactivation"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeactivateModalOpen(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              Yes, Deactivate Account
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-700 text-center">
            Are you sure you want to deactivate your account? This action cannot be undone if any
            open orders exist.
          </p>

          {deactivateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {deactivateError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
