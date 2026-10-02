import { useState } from 'react';

/**
 * Estrellas de calificación con soporte de medias (incrementos de 0.5).
 * - Solo lectura: muestra 5 estrellas con relleno fraccional.
 * - Editable (onChange): click en mitad izquierda = x.5, mitad derecha = x entero.
 */
function starFill(value, index) {
  const fill = value - (index - 1);
  if (fill >= 1) return 1;
  if (fill >= 0.5) return 0.5;
  return 0;
}

function StarVisual({ fill }) {
  if (fill >= 1) return <span aria-hidden="true" className="star-rating__fill">★</span>;
  if (fill >= 0.5) {
    return (
      <span aria-hidden="true" className="star-rating__half">
        <span className="star-rating__half-bg">★</span>
        <span className="star-rating__half-fg">★</span>
      </span>
    );
  }
  return <span aria-hidden="true" className="star-rating__empty">★</span>;
}

export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const readOnly = !onChange;
  const [hoverValue, setHoverValue] = useState(null);
  const shown = hoverValue ?? value;
  const optionValue = hoverValue != null ? hoverValue : value;

  if (readOnly) {
    return (
      <div
        className={`star-rating star-rating--${size} is-readonly`}
        role="img"
        aria-label={`${value} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="star-rating__star" aria-hidden="true">
            <StarVisual fill={starFill(value, star)} />
          </span>
        ))}
      </div>
    );
  }

  function valueFromEvent(event, star) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? star - 0.5 : star;
  }

  return (
    <div
      className={`star-rating star-rating--${size}`}
      role="radiogroup"
      aria-label="Elegí una calificación"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const v = starFill(shown, star);
        return (
          <button
            key={star}
            type="button"
            className="star-rating__star"
            role="radio"
            aria-label={`${star - 0.5} o ${star} estrellas`}
            aria-checked={value === star || value === star - 0.5}
            onMouseMove={(e) => setHoverValue(valueFromEvent(e, star))}
            onFocus={() => setHoverValue(star)}
            onClick={(e) => {
              const next = valueFromEvent(e, star);
              setHoverValue(null);
              onChange(Math.max(0.5, next));
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                onChange(Math.min(5, (value || 0) + 0.5));
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                onChange(Math.max(0.5, (value || 0) - 0.5));
              }
            }}
          >
            <StarVisual fill={v} />
          </button>
        );
      })}
      <span className="star-rating__value" aria-live="polite">
        {optionValue != null ? Number(optionValue).toFixed(1) : ''}
      </span>
    </div>
  );
}
