import { getPopularMovies, getPopularTV, searchMovies, searchTV, searchAll, getMovieDetails, getTVDetails, buildVideoApiUrl } from './api';

export async function getFilters(sourceApp) {
  return [
    { type: 'genre', options: [
      { value: 'action', label: 'Acción' },
      { value: 'adventure', label: 'Aventura' },
      { value: 'animation', label: 'Animación' },
      { value: 'comedy', label: 'Comedia' },
      { value: 'crime', label: 'Crimen' },
      { value: 'documentary', label: 'Documental' },
      { value: 'drama', label: 'Drama' },
      { value: 'horror', label: 'Terror' },
      { value: 'scifi', label: 'Ciencia Ficción' },
      { value: 'romance', label: 'Romance' },
      { value: 'thriller', label: 'Suspenso' },
    ] },
    { type: 'top', options: [{ value: '', label: 'Más populares' }] },
  ];
}

export async function discover(sourceApp, { type = 'top', value = '', limit = 30, filters } = {}) {
  if (filters && filters.search) {
    return searchAll(filters.search).slice(0, limit);
  }
  if (type === 'top') {
    const [movies, tv] = await Promise.all([getPopularMovies(1), getPopularTV(1)]);
    return [...movies, ...tv].slice(0, limit);
  }
  if (type === 'search') {
    return searchAll(value).slice(0, limit);
  }
  return [];
}

export async function getProfile() { return null; }
export async function searchUsers() { return []; }
export async function getUserProfile() { return null; }

export { buildVideoApiUrl, getMovieDetails, getTVDetails };
