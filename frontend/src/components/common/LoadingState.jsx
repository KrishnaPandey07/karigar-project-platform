import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...', fullScreen = false }) {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4'
    : 'flex flex-col items-center justify-center py-12 px-4 text-center';

  return (
    <div className={containerClass}>
      <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
      <p className="text-gray-600 font-medium text-sm sm:text-base animate-pulse">{message}</p>
    </div>
  );
}
