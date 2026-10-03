import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import BaseLayout from './layouts/BaseLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CategoriesPage from './pages/CategoriesPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import NotFoundPage from './pages/NotFoundPage';

// Common Dashboard Dispatcher
import DashboardPage from './pages/DashboardPage';

// Customer Pages (Phase 3 & 5)
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerFavoritesPage from './pages/customer/CustomerFavoritesPage';
import CustomerRequestsPage from './pages/customer/CustomerRequestsPage';
import RequestDetailsPage from './pages/customer/RequestDetailsPage';
import CustomerReviewsPage from './pages/customer/CustomerReviewsPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';

// Vendor Pages (Phase 2 & 5)
import VendorProfileWizard from './pages/vendor/VendorProfileWizard';
import VendorServicesPage from './pages/vendor/VendorServicesPage';
import VendorAvailabilityPage from './pages/vendor/VendorAvailabilityPage';
import VendorRequestsPage from './pages/vendor/VendorRequestsPage';
import VendorRequestDetailsPage from './pages/vendor/VendorRequestDetailsPage';

// Admin Pages (Phase 7)
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <BaseLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/services" element={<CategoriesPage />} />
              <Route path="/vendors/:id" element={<VendorDetailsPage />} />

              {/* Protected Authenticated Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Role-Guarded Area */}
              <Route
                path="/customer/settings"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/favorites"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerFavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/requests"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests/:id"
                element={
                  <ProtectedRoute>
                    <RequestDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/reviews"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/notifications"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <CustomerNotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Vendor Role-Guarded Area */}
              <Route
                path="/vendor/requests"
                element={
                  <ProtectedRoute allowedRoles={['VENDOR']}>
                    <VendorRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/requests/:id"
                element={
                  <ProtectedRoute allowedRoles={['VENDOR']}>
                    <VendorRequestDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/profile"
                element={
                  <ProtectedRoute allowedRoles={['VENDOR']}>
                    <VendorProfileWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/services"
                element={
                  <ProtectedRoute allowedRoles={['VENDOR']}>
                    <VendorServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/availability"
                element={
                  <ProtectedRoute allowedRoles={['VENDOR']}>
                    <VendorAvailabilityPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Console Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BaseLayout>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
