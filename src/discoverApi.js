<<<<<<< HEAD
/**
 * discoverApi - Descubrimiento y búsqueda usando TMDB como fuente de contenido.
 * Mantiene la misma firma de funciones que el original para compatibilidad con App.jsx.
 */
import {
  getPopularMovies,
  getPopularTV,
  searchMovies,
  searchTV,
  searchAll,
  getMovieDetails,
  getTVDetails,
  buildVideoApiUrl,
} from './api';

const SOURCE_APP = 'tapeflix';

export async function getFilters(sourceApp) {
  // Devolvemos filtros estáticos basados en géneros comunes de TMDB
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

export async function getProfile(sourceApp, name) {
  return null;
}

export async function searchUsers(query, limit = 4) {
  return [];
}

export async function searchAll(sourceApp, query, perGroup = 4) {
  return searchAll(query).slice(0, perGroup);
}

export async function getUserProfile(username) {
  return null;
}

export { buildVideoApiUrl, getMovieDetails, getTVDetails };
=======
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function getFilters(sourceApp) {
  const response = await fetch(`${API_URL}/api/discover/${sourceApp}/filters`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('No se pudieron cargar los filtros.');
  }
  return response.json();
}

export async function discover(sourceApp, { type = 'top', value = '', limit = 30, filters } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val) {
        params.set(key, val);
      }
    }
  } else {
    params.set('type', type);
    if (value) {
      params.set('value', value);
    }
  }

  const response = await fetch(`${API_URL}/api/discover/${sourceApp}?${params}`, { credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo cargar el contenido.');
  }
  return response.json();
}

export async function getProfile(sourceApp, name) {
  const params = new URLSearchParams({ value: name });
  const response = await fetch(`${API_URL}/api/discover/${sourceApp}/profile?${params}`, { credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

/** Búsqueda pública de usuarios (nombre visible + avatar, sin emails). */export async function searchUsers(query, limit = 4) {
  const q = (query || '').trim();
  if (q.length < 2) {
    return [];
  }
  const response = await fetch(`${API_URL}/api/users/search?${new URLSearchParams({ q })}`, { credentials: 'include' });
  if (!response.ok) {
    return [];
  }
  const users = await response.json().catch(() => []);
  return (Array.isArray(users) ? users : []).slice(0, limit).map((u) => ({
    externalId: `user:${u.username}`,
    title: u.displayName || u.username,
    subtitle: `@${u.username}`,
    description: 'Usuario de TapeCloud',
    imageUrl: u.avatarDataUri || null,
    genre: u.username,
    kind: 'user',
  }));
}

/**
 * Búsqueda agrupada del header: películas + personas + usuarios en paralelo.
 * Cada grupo trae como máximo `perGroup` resultados para que el panel muestre más sin mezclar.
 */
export async function searchAll(sourceApp, query, perGroup = 4) {
  const q = (query || '').trim();
  if (q.length < 2) {
    return { groups: [], flat: [] };
  }
  const [movies, people, users] = await Promise.all([
    discover(sourceApp, { type: 'search', value: q, limit: perGroup }).catch(() => []),
    discover(sourceApp, { type: 'people', value: q, limit: perGroup }).catch(() => []),
    searchUsers(q, perGroup),
  ]);
  const groups = [];
  if (movies.length > 0) {
    groups.push({ key: 'movies', label: 'Películas', items: movies.slice(0, perGroup) });
  }
  if (people.length > 0) {
    groups.push({ key: 'people', label: 'Actores y directores', items: people.slice(0, perGroup) });
  }
  if (users.length > 0) {
    groups.push({ key: 'users', label: 'Usuarios', items: users.slice(0, perGroup) });
  }
  return { groups, flat: groups.flatMap((g) => g.items) };
}

/** Perfil público de un usuario (stats de reseñas, sin email). */
export async function getUserProfile(username) {
  const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}/profile`, { credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  return response.json();
}
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
