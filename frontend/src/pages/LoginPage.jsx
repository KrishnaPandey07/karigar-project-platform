import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Lock, Phone, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { RangoliMandala } from '../components/common/IndianArtDecorations';

export default function LoginPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ identifier: identifier.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.message ||
          (isEn
            ? 'Failed to sign in. Please verify your mobile number/email and password.'
            : 'लॉग इन विफल रहा। कृपया अपना मोबाइल नंबर या ईमेल और पासवर्ड जांचें।')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoTarget, demoPassword) => {
    setIdentifier(demoTarget);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/40 via-white to-stone-50 relative overflow-hidden">
      <RangoliMandala className="w-64 h-64 text-amber-900/5 absolute -top-16 -right-16 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold mb-3 border border-amber-300">
          <span>{isEn ? 'Karigar • Direct Connection' : 'कारीगर (Karigar) • सीधा संपर्क'}</span>
        </div>
        <h2 className="text-3xl font-black text-stone-900 tracking-tight">
          {isEn ? 'Sign In to Your Account' : 'खाते में प्रवेश करें'}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 font-medium">
          {isEn
            ? 'Login with your mobile number to view artisan dashboard and calls'
            : 'अपने मोबाइल नंबर से आसानी से लॉग इन करें और ग्राहकों के सीधे फोन पाएं'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-800">
                {isEn ? 'Mobile Number (or Email)' : 'मोबाइल नंबर (या ईमेल)'}
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-4 h-4 text-amber-800" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isEn ? 'e.g. 9811122334 or email' : 'उदा. 9811122334 या ईमेल'}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none font-medium"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {isEn ? 'Artisans can log in directly with their registered mobile number' : 'कारीगर अपने पंजीकृत मोबाइल नंबर से सीधे लॉग इन कर सकते हैं'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800">
                {isEn ? 'Password' : 'पासवर्ड'}
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4 text-amber-800" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-800 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEn ? 'Signing In...' : 'लॉग इन हो रहा है...'}
                </>
              ) : (
                <>
                  {isEn ? 'Sign In' : 'लॉग इन करें'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 text-center">
              {isEn ? '1-Click Quick Demo Sign In' : '1-क्लिक त्वरित डेमो लॉगिन'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('9811122334', 'Password123!')}
                className="px-2 py-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl hover:bg-amber-200 transition text-center"
              >
                <div>{isEn ? 'Artisan (Phone)' : 'कारीगर (फोन)'}</div>
                <div className="text-[10px] text-amber-700 font-normal">9811122334</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@locallink.com', 'Password123!')}
                className="px-2 py-2 text-xs font-bold text-stone-700 bg-stone-100 border border-stone-200 rounded-xl hover:bg-stone-200 transition text-center"
              >
                <div>{isEn ? 'Customer' : 'ग्राहक'}</div>
                <div className="text-[10px] text-stone-500 font-normal">Demo</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('lgtvk84@gmail.com', 'Krishna,0007')}
                className="px-2 py-2 text-xs font-bold text-stone-900 bg-stone-100 border border-stone-300 rounded-xl hover:bg-stone-200 transition text-center"
              >
                <div>{isEn ? 'Admin' : 'एडमिन'}</div>
                <div className="text-[10px] text-stone-500 font-normal">Krishna</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-stone-600">
            {isEn ? "Don't have an account? " : 'खाता नहीं है? '}
            <Link to="/register" className="font-bold text-amber-800 hover:text-amber-900 hover:underline">
              {isEn ? 'Register as Artisan / Customer' : 'कारीगर या ग्राहक पंजीकरण करें'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

