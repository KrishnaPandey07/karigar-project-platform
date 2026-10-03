import React from 'react';
import { useAuth } from '../context/AuthContext';
import VendorDashboardPage from './vendor/VendorDashboardPage';
import CustomerDashboardPage from './customer/CustomerDashboardPage';
import AdminDashboardPage from './admin/AdminDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Delegate to Vendor Dashboard
  if (user.role === 'VENDOR') {
    return <VendorDashboardPage />;
  }

  // Delegate to Customer Dashboard
  if (user.role === 'CUSTOMER') {
    return <CustomerDashboardPage />;
  }

  // Delegate to Admin Dashboard
  if (user.role === 'ADMIN') {
    return <AdminDashboardPage />;
  }

  return null;
}
