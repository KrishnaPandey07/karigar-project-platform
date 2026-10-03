import React from 'react';

export default function Card({
  children,
  header,
  footer,
  className = '',
  hover = false,
  padding = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${
        hover ? 'hover:shadow-md hover:border-brand-300 transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>{children}</div>
      {footer && (
        <div className="px-6 py-3.5 border-t border-gray-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
}
