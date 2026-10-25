import { useState } from 'react';

export default function StarRating({ value = 0, size = 'md', onChange }) {
  const sizes = { sm: 16, md: 20, lg: 24 };
  const starSize = sizes[size] || 20;
  const [hover, setHover] = useState(null);
  const displayValue = onChange ? (hover ?? value) : value;

  return (
    <div
      role="radiogroup"
      aria-label="Calificación"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: '#fbbf24',
        fontSize: starSize,
        cursor: onChange ? 'pointer' : 'default',
      }}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = displayValue >= star;
        const hovered = hover === star;
        return (
          <span
            key={star}
            role="radio"
            aria-checked={active}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange && onChange(star)}
            style={{
              userSelect: 'none',
              transition: 'transform 0.1s ease',
              transform: (hovered || active) ? 'scale(1.1)' : 'scale(1)',
              color: (hovered || active) ? '#fbbf24' : '#475569',
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
