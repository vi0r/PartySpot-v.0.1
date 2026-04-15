'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  totalStars = 5,
  onRatingChange,
  readOnly = false,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleClick = (value: number) => {
    if (!readOnly && onRatingChange) {
      setRating(value);
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-all active:scale-90`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
          >
            <Star
              size={20}
              className={`${
                starValue <= (hover || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-zinc-600'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
};
