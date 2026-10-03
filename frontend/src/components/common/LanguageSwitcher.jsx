import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'hi';

  const handleSelect = (lang) => {
    changeLanguage(lang);
  };

  return (
    <div className={`inline-flex items-center p-0.5 rounded-xl bg-amber-100/70 border border-amber-200/80 shadow-2xs ${className}`}>
      <button
        type="button"
        onClick={() => handleSelect('hi')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
          currentLang.startsWith('hi')
            ? 'bg-amber-800 text-amber-50 shadow-xs'
            : 'text-amber-900 hover:text-amber-950 hover:bg-amber-200/50'
        }`}
        aria-label="हिन्दी में बदलें"
      >
        हिन्दी
      </button>

      <button
        type="button"
        onClick={() => handleSelect('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
          currentLang.startsWith('en')
            ? 'bg-amber-800 text-amber-50 shadow-xs'
            : 'text-amber-900 hover:text-amber-950 hover:bg-amber-200/50'
        }`}
        aria-label="Switch to English"
      >
        English
      </button>
    </div>
  );
}
