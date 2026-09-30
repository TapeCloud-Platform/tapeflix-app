const FULL_DATE_FORMAT = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** El backend manda la fecha de estreno como texto ISO ("2026-07-29") en subtitle/releaseDate. */
export function formatYear(dateString) {
  if (!dateString) {
    return null;
  }
  const year = dateString.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function formatFullDate(dateString) {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : FULL_DATE_FORMAT.format(date);
}
