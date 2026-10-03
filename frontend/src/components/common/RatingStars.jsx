import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({
  rating = 0,
  count,
  size = 'md',
  showScore = true,
  className = '',
}) {
  const numericRating = Number(rating) || 0;

  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  const starSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Rating: ${numericRating.toFixed(1)} out of 5 stars`}
    >
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= Math.round(numericRating);
          return (
            <Star
              key={starIndex}
              className={`${starSize} ${
                isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
              }`}
            />
          );
        })}
      </div>

      {showScore && (
        <span className={`font-bold text-gray-800 ${textSizes[size] || textSizes.md}`}>
          {numericRating > 0 ? numericRating.toFixed(1) : 'New'}
        </span>
      )}

      {count !== undefined && (
        <span className={`text-gray-400 font-normal ${textSizes[size] || textSizes.md}`}>
          ({count})
        </span>
      )}
    </div>
  );
}
