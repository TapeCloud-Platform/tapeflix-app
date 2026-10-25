<<<<<<< HEAD
export function formatYear(dateStr) {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})/);
  return m ? m[1] : '';
}

export function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
=======
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
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
}
