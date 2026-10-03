import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Wrench,
  LayoutDashboard,
  Heart,
  Clock,
  Settings,
  Calendar,
  Layers,
} from 'lucide-react';
import NotificationBell from '../components/notifications/NotificationBell';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import DutyStatusSwitcher from '../components/common/DutyStatusSwitcher';
import { RangoliMandala, BandhaniRibbon, WarliArtStrip } from '../components/common/IndianArtDecorations';

export default function BaseLayout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'VENDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
            <Wrench className="w-3 h-3" /> {i18n.language === 'en' ? 'Artisan' : 'कारीगर'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700">
            {i18n.language === 'en' ? 'Customer' : 'ग्राहक'}
          </span>
        );
    }
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      {/* Traditional Bandhani Decorative Cultural Top Bar */}
      <div className="bg-amber-950 text-amber-100 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium tracking-wide relative overflow-hidden">
        <div className="flex items-center justify-center gap-2">
          <span>🎨 <strong>कारीगर (Karigar)</strong> • {t('common.tagline')}</span>
        </div>
        <BandhaniRibbon className="h-1.5 w-full text-amber-500/30 mt-0.5" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-800 via-amber-700 to-amber-600 text-amber-50 flex items-center justify-center shadow-md group-hover:scale-105 transition relative overflow-hidden">
                <RangoliMandala className="w-12 h-12 text-amber-300/30 absolute" />
                <span className="font-extrabold text-base relative z-10">का</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-amber-800 transition">
                    {i18n.language === 'en' ? 'Karigar' : 'कारीगर'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    {i18n.language === 'en' ? 'कारीगर' : 'Karigar'}
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] text-stone-500 font-medium -mt-0.5 tracking-wider">
                  {t('common.tagline')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
              <Link
                to="/"
                className={`hover:text-amber-800 transition ${isCurrent('/') ? 'text-amber-800 font-semibold' : ''}`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/search"
                className={`hover:text-amber-800 transition flex items-center gap-1 ${
                  isCurrent('/search') ? 'text-amber-800 font-semibold' : ''
                }`}
              >
                {t('nav.search')}
              </Link>
              <Link
                to="/categories"
                className={`hover:text-amber-800 transition flex items-center gap-1 ${
                  isCurrent('/categories') ? 'text-amber-800 font-semibold' : ''
                }`}
              >
                <Layers className="w-4 h-4 text-stone-400" />
                {t('nav.categories')}
              </Link>

              {/* Customer quick navigation */}
              {isAuthenticated && user?.role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/customer/favorites"
                    className={`hover:text-amber-800 transition flex items-center gap-1 ${
                      isCurrent('/customer/favorites') ? 'text-amber-800 font-semibold' : ''
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {t('nav.favorites')}
                  </Link>
                  <Link
                    to="/customer/requests"
                    className={`hover:text-amber-800 transition flex items-center gap-1 ${
                      isCurrent('/customer/requests') ? 'text-amber-800 font-semibold' : ''
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    {t('nav.myRequests')}
                  </Link>
                </>
              )}

              {/* Vendor quick navigation */}
              {isAuthenticated && user?.role === 'VENDOR' && (
                <>
                  <Link
                    to="/vendor/requests"
                    className={`hover:text-amber-800 transition flex items-center gap-1 ${
                      isCurrent('/vendor/requests') ? 'text-amber-800 font-semibold' : ''
                    }`}
                  >
                    {i18n.language === 'en' ? 'Job Queue' : 'कार्य सूची'}
                  </Link>
                  <Link
                    to="/vendor/services"
                    className={`hover:text-amber-800 transition ${
                      isCurrent('/vendor/services') ? 'text-amber-800 font-semibold' : ''
                    }`}
                  >
                    {i18n.language === 'en' ? 'Rate Cards' : 'मूल्य सूची'}
                  </Link>
                  <Link
                    to="/vendor/availability"
                    className={`hover:text-amber-800 transition ${
                      isCurrent('/vendor/availability') ? 'text-amber-800 font-semibold' : ''
                    }`}
                  >
                    {i18n.language === 'en' ? 'Schedule' : 'समय सारणी'}
                  </Link>
                </>
              )}

              {/* Admin quick navigation */}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`hover:text-purple-600 transition flex items-center gap-1 ${
                    isCurrent('/admin') ? 'text-purple-600 font-semibold' : ''
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  {i18n.language === 'en' ? 'Admin Console' : 'प्रशासन कक्ष'}
                </Link>
              )}
            </nav>

            {/* User Auth Nav & Language Switcher */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  {user.role === 'VENDOR' && (
                    <DutyStatusSwitcher
                      mode="compact"
                      currentStatus={user.vendorProfile?.dutyStatus}
                      isAvailable={user.vendorProfile?.isAvailable}
                    />
                  )}

                  <NotificationBell />

                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <span className="text-xs font-semibold text-stone-700 truncate max-w-[130px]">
                      {user.customerProfile?.fullName || user.vendorProfile?.businessName || user.email}
                    </span>
                  </div>

                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t('nav.dashboard')}
                  </Link>

                  {user.role === 'CUSTOMER' && (
                    <Link
                      to="/customer/settings"
                      title={t('nav.settings')}
                      className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    title={t('nav.signOut')}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition px-2 py-1"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-xl transition shadow-sm"
                  >
                    {t('nav.getStarted')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSwitcher />
              {isAuthenticated && <NotificationBell />}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-stone-800 hover:text-amber-800"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-stone-800 hover:text-amber-800"
            >
              {t('nav.search')}
            </Link>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-stone-800 hover:text-amber-800"
            >
              {t('nav.categories')}
            </Link>

            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <>
                <Link
                  to="/customer/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-stone-800 hover:text-amber-800"
                >
                  {t('nav.favorites')}
                </Link>
                <Link
                  to="/customer/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-stone-800 hover:text-amber-800"
                >
                  {t('nav.myRequests')}
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'VENDOR' && (
              <>
                <Link
                  to="/vendor/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-stone-800 hover:text-amber-800"
                >
                  {i18n.language === 'en' ? 'Job Queue' : 'कार्य सूची'}
                </Link>
                <Link
                  to="/vendor/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-stone-800 hover:text-amber-800"
                >
                  {i18n.language === 'en' ? 'Rate Cards' : 'मूल्य सूची'}
                </Link>
                <Link
                  to="/vendor/availability"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-semibold text-stone-800 hover:text-amber-800"
                >
                  {i18n.language === 'en' ? 'Schedule' : 'समय सारणी'}
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-semibold text-purple-700"
              >
                {i18n.language === 'en' ? 'Admin Console' : 'प्रशासन कक्ष'}
              </Link>
            )}

            <hr className="border-stone-200" />

            {isAuthenticated && user ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  {getRoleBadge(user.role)}
                  <span className="text-sm font-bold text-stone-900 truncate">
                    {user.customerProfile?.fullName || user.vendorProfile?.businessName || user.email}
                  </span>
                </div>

                {user.role === 'VENDOR' && (
                  <div className="py-1">
                    <DutyStatusSwitcher
                      mode="full"
                      currentStatus={user.vendorProfile?.dutyStatus}
                      isAvailable={user.vendorProfile?.isAvailable}
                    />
                  </div>
                )}
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-amber-800"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-amber-800 rounded-xl hover:bg-amber-900"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Cultural Indian Folk Art Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-auto pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Warli Art Strip Celebrating Artisans & Crafts */}
          <div className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700/50">
            <div className="text-[11px] font-semibold text-amber-400/80 mb-1 text-center tracking-wider uppercase">
              {i18n.language === 'en' ? 'Honoring the Skilled Artisans & Crafts of India' : 'भारत के कुशल कारीगरों और हस्तकला का सम्मान'}
            </div>
            <WarliArtStrip className="h-10 w-full text-amber-400/50" />
          </div>

          <BandhaniRibbon className="h-2 w-full text-amber-500/20" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-sm relative overflow-hidden">
                <RangoliMandala className="w-10 h-10 text-amber-200/20 absolute" />
                <span className="relative z-10">का</span>
              </div>
              <div>
                <span className="font-bold text-stone-100 text-sm">
                  {i18n.language === 'en' ? 'Karigar' : 'कारीगर'}
                </span>
                <span className="text-stone-400 ml-2">
                  {t('common.tagline')}
                </span>
              </div>
            </div>

            <p className="text-stone-400 text-center md:text-right">
              &copy; {new Date().getFullYear()} Karigar. {i18n.language === 'en' ? 'Direct Connection with Artisans • Zero Middleman Fees' : 'कुशल कारीगरों से सीधा संपर्क • कोई बिचौलिया कमीशन नहीं'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
