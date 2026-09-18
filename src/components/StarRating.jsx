/**
 * Estrellas de calificación. En modo lectura solo muestra el promedio;
 * si se pasa onChange, cada estrella se puede clickear para elegir 1-5.
 */
export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const readOnly = !onChange;
  const rounded = Math.round(value);

  return (
    <div
      className={`star-rating star-rating--${size}${readOnly ? ' is-readonly' : ''}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${value} de 5 estrellas` : 'Elegí una calificación'}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className="star-rating__star"
          tabIndex={readOnly ? -1 : 0}
          aria-hidden={readOnly || undefined}
          aria-label={readOnly ? undefined : `${star} estrella${star > 1 ? 's' : ''}`}
          aria-checked={readOnly ? undefined : star === value}
          onClick={readOnly ? undefined : () => onChange(star)}
        >
          {star <= rounded ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
