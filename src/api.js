<<<<<<< HEAD
/**
 * TapeFlix VideoAPI - Capa de datos adaptada a TMDB + videoapi.la
 * Reemplaza el backend de TapeCloud por TMDB (metadatos) y videoapi.la (reproductor).
 */

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'TU_TMDB_API_KEY';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const VIDEOAPI_BASE = 'https://videoapi.la';

/**
 * Construye una URL de embed de videoapi.la respetando su API pública:
 * Película: /e/movie/{tmdb}
 * Serie: /e/tv/{tmdb}/{season}/{episode}
 * Parámetros permitidos: skin, quality_selector, subtitles, hide_title, hide_controls, autoplay, start_at, etc.
 */
export function buildVideoApiUrl(type, tmdb, season = 1, episode = 1) {
  const qs = new URLSearchParams({
    skin: 'prime',
    quality_selector: 1,
    subtitles: 1,
  }).toString();

  if (type === 'movie') {
    return `${VIDEOAPI_BASE}/e/movie/${tmdb}?${qs}`;
  }
  return `${VIDEOAPI_BASE}/e/tv/${tmdb}/${season}/${episode}?${qs}`;
}

/**
 * Valida un embed antes de insertarlo (endpoint público de videoapi.la).
 */
export async function validateEmbed(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${VIDEOAPI_BASE}/api/v1/public/validate-embed?${qs}`);
  if (!res.ok) return { valid: false };
  return await res.json();
}

/* -----------------------
   TMDB FETCH HELPER
   ----------------------- */
async function tmdbFetch(endpoint, params = {}) {
  const search = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'es-ES',
    ...params,
  });
  const res = await fetch(`${TMDB_BASE}${endpoint}?${search}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return await res.json();
}

/* -----------------------
   PELÍCULAS
   ----------------------- */
export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch('/movie/popular', { page });
  return data.results.map((m) => ({
    id: m.id,
    tmdbId: m.id,
    title: m.title,
    type: 'movie',
    year: m.release_date ? m.release_date.slice(0, 4) : '',
    releaseDate: m.release_date || '',
    plot: m.overview || '',
    voteAverage: m.vote_average || 0,
    voteCount: m.vote_count || 0,
    genre: m.genre_ids ? [] : [],
    runtimeMinutes: m.runtime || 0,
    imageUrl: m.backdrop_path ? IMAGE_BASE + m.backdrop_path : '',
    posterUrl: m.poster_path ? IMAGE_BASE + m.poster_path : '',
    embedUrl: buildVideoApiUrl('movie', m.id),
  }));
}

export async function searchMovies(query, page = 1) {
  const data = await tmdbFetch('/search/movie', { query, page });
  return data.results.map((m) => ({
    id: m.id,
    tmdbId: m.id,
    title: m.title,
    type: 'movie',
    year: m.release_date ? m.release_date.slice(0, 4) : '',
    releaseDate: m.release_date || '',
    plot: m.overview || '',
    voteAverage: m.vote_average || 0,
    voteCount: m.vote_count || 0,
    genre: [],
    runtimeMinutes: m.runtime || 0,
    imageUrl: m.backdrop_path ? IMAGE_BASE + m.backdrop_path : '',
    posterUrl: m.poster_path ? IMAGE_BASE + m.poster_path : '',
    embedUrl: buildVideoApiUrl('movie', m.id),
  }));
}

export async function getMovieDetails(tmdbId) {
  const [movie, credits] = await Promise.all([
    tmdbFetch(`/movie/${tmdbId}`),
    tmdbFetch(`/movie/${tmdbId}/credits`),
  ]);
  return {
    id: movie.id,
    tmdbId: movie.id,
    title: movie.title,
    type: 'movie',
    year: movie.release_date ? movie.release_date.slice(0, 4) : '',
    releaseDate: movie.release_date || '',
    plot: movie.overview || '',
    voteAverage: movie.vote_average || 0,
    voteCount: movie.vote_count || 0,
    genre: movie.genres ? movie.genres.map((g) => g.name) : [],
    directorNames: credits.crew.filter((c) => c.job === 'Director').map((c) => c.name),
    actorNames: credits.cast.slice(0, 8).map((c) => c.name),
    runtimeMinutes: movie.runtime || 0,
    imageUrl: movie.backdrop_path ? IMAGE_BASE + movie.backdrop_path : '',
    posterUrl: movie.poster_path ? IMAGE_BASE + movie.poster_path : '',
    embedUrl: buildVideoApiUrl('movie', movie.id),
  };
}

/* -----------------------
   SERIES / TV
   ----------------------- */
export async function getPopularTV(page = 1) {
  const data = await tmdbFetch('/tv/popular', { page });
  return data.results.map((m) => ({
    id: m.id,
    tmdbId: m.id,
    title: m.name,
    type: 'tv',
    year: m.first_air_date ? m.first_air_date.slice(0, 4) : '',
    releaseDate: m.first_air_date || '',
    plot: m.overview || '',
    voteAverage: m.vote_average || 0,
    voteCount: m.vote_count || 0,
    genre: [],
    runtimeMinutes: m.episode_run_time ? m.episode_run_time[0] : 0,
    imageUrl: m.backdrop_path ? IMAGE_BASE + m.backdrop_path : '',
    posterUrl: m.poster_path ? IMAGE_BASE + m.poster_path : '',
    embedUrl: buildVideoApiUrl('tv', m.id, 1, 1),
  }));
}

export async function searchTV(query, page = 1) {
  const data = await tmdbFetch('/search/tv', { query, page });
  return data.results.map((m) => ({
    id: m.id,
    tmdbId: m.id,
    title: m.name,
    type: 'tv',
    year: m.first_air_date ? m.first_air_date.slice(0, 4) : '',
    releaseDate: m.first_air_date || '',
    plot: m.overview || '',
    voteAverage: m.vote_average || 0,
    voteCount: m.vote_count || 0,
    genre: [],
    runtimeMinutes: m.episode_run_time ? m.episode_run_time[0] : 0,
    imageUrl: m.backdrop_path ? IMAGE_BASE + m.backdrop_path : '',
    posterUrl: m.poster_path ? IMAGE_BASE + m.poster_path : '',
    embedUrl: buildVideoApiUrl('tv', m.id, 1, 1),
  }));
}

export async function getTVDetails(tmdbId) {
  const [show, credits] = await Promise.all([
    tmdbFetch(`/tv/${tmdbId}`),
    tmdbFetch(`/tv/${tmdbId}/credits`),
  ]);
  const seasons = (show.seasons || [])
    .filter((s) => s.season_number >= 1 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);
  return {
    id: show.id,
    tmdbId: show.id,
    title: show.name,
    type: 'tv',
    year: show.first_air_date ? show.first_air_date.slice(0, 4) : '',
    releaseDate: show.first_air_date || '',
    plot: show.overview || '',
    voteAverage: show.vote_average || 0,
    voteCount: show.vote_count || 0,
    genre: show.genres ? show.genres.map((g) => g.name) : [],
    directorNames: credits.crew.filter((c) => c.job === 'Director').map((c) => c.name),
    actorNames: credits.cast.slice(0, 8).map((c) => c.name),
    runtimeMinutes: show.episode_run_time ? show.episode_run_time[0] : 0,
    imageUrl: show.backdrop_path ? IMAGE_BASE + show.backdrop_path : '',
    posterUrl: show.poster_path ? IMAGE_BASE + show.poster_path : '',
    seasons,
    embedUrl: buildVideoApiUrl('tv', show.id, seasons[0]?.season_number || 1, 1),
  };
}

/* -----------------------
   BÚSQUEDA COMBINADA
   ----------------------- */
export async function searchAll(query) {
  const [movies, tv] = await Promise.all([
    searchMovies(query).catch(() => []),
    searchTV(query).catch(() => []),
  ]);
  return [...movies, ...tv];
=======
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Sesion hibrida: cookie httpOnly (principal) + token en memoria (respaldo).
// El token vive solo en memoria JS (se pierde al recargar, nunca toca storage):
// si el navegador bloquea cookies de terceros, igual viaja por header Bearer.
let memoryToken = null;

export function setMemoryToken(token) {
  memoryToken = token || null;
}

export function clearMemoryToken() {
  memoryToken = null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(memoryToken ? { Authorization: `Bearer ${memoryToken}` } : {}),
  };
}

// Sesión híbrida: cookie httpOnly (principal) + Bearer en memoria (respaldo).
// Todos los fetch usan credentials:include; si hay token en memoria (login
// de esta pestaña) también mandan Authorization. Ver setMemoryToken.

async function request(path, opts = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: authHeaders(),
    ...opts,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    throw new Error(typeof body === 'string' ? body : body.message || 'Error en la petición');
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

async function postJson(path, payload) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new Error('No se pudo completar la operación.');
    }
    return null;
  }

  const body = await response.json();

  if (!response.ok) {
    const error = new Error(body.message || 'No se pudo completar la operación.');
    error.totpRequired = Boolean(body.totpRequired);
    throw error;
  }

  return body;
}

/** El login acepta email o nombre de usuario indistintamente. totpCode solo hace falta si la cuenta tiene 2FA activado. */
export async function login(identifier, password, totpCode) {
  return postJson('/api/auth/login', { identifier, password, totpCode: totpCode || undefined });
}

export async function register(email, username, password) {
  return postJson('/api/auth/register', { email, username, password });
}

export async function verifyEmail(email, code) {
  return postJson('/api/auth/verify-email', { email, code });
}

export async function resendVerificationCode(email) {
  return postJson('/api/auth/resend-code', { email });
}

export async function findContentByExternalId(externalId) {
  const response = await fetch(
    `${API_URL}/api/content/lookup?sourceApp=tapeflix&sourceType=movie&externalId=${encodeURIComponent(externalId)}`,
    { credentials: 'include', headers: authHeaders() }
  );
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error('No se pudo buscar la película.');
  }
  return response.json();
}

/** Las películas del descubrimiento llegan de TMDb en vivo; hay que registrarlas para poder reseñarlas. */
export async function registerContent(_token, movie) {
  const response = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({
      sourceApp: 'tapeflix',
      sourceType: 'movie',
      externalId: String(movie.externalId ?? movie.id),
      title: movie.title,
      description: movie.description || '',
      imageUrl: movie.imageUrl || '',
      releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(movie.releaseDate || '') ? movie.releaseDate : null,
      genre: movie.genre || 'General',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo registrar la película.');
  }
  return body;
}

export async function getReviews(contentId, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (contentId) {
    params.set('contentId', contentId);
  } else {
    params.set('sourceApp', 'tapeflix');
  }

  const response = await fetch(`${API_URL}/api/reviews?${params}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Error al cargar las reseñas');
  }
  const body = await response.json();
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function createReview(contentId, _token, reviewData) {
  const response = await fetch(`${API_URL}/api/reviews/content/${contentId}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(reviewData),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'No se pudo publicar la reseña.');
  }

  return body;
}

export async function toggleReviewLike(reviewId) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'No se pudo registrar el me gusta.');
  }

  return body;
}

export async function deleteReview(reviewId) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo eliminar la reseña.');
  }
}

export async function updateReview(reviewId, _token, reviewData) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(reviewData),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || 'No se pudo actualizar la reseña.');
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function getComments(reviewId, { page = 0, size = 20 } = {}) {
  const body = await request(`/api/comments?reviewId=${reviewId}&page=${page}&size=${size}`);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function createComment(reviewId, _token, commentData) {
  const response = await fetch(`${API_URL}/api/comments/review/${reviewId}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(commentData),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || 'No se pudo publicar el comentario.');
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function deleteComment(commentId) {
  const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo eliminar el comentario.');
  }
}

async function authedRequest(path, method, _token, payload) {
  const init = {
    method,
    credentials: 'include',
    headers: authHeaders(),
  };
  if (payload !== undefined) {
    init.body = JSON.stringify(payload);
  }
  const response = await fetch(`${API_URL}${path}`, init);

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || 'No se pudo completar la operación.');
    error.totpRequired = Boolean(body.totpRequired);
    throw error;
  }

  return body;
}

export async function getMyReviewStats() {
  return authedRequest('/api/reviews/me/stats', 'GET');
}

/** Invalida la sesión en el backend (bump de tokenVersion + limpia cookie). 204 = sin contenido. */
export async function logout() {
  return authedRequest('/api/auth/logout', 'POST');
}

export async function getMe() {
  return authedRequest('/api/auth/me', 'GET');
}

/**
 * Valida la sesión contra el backend (cookie). Solo un 2xx significa sesión
 * válida (sin cookie el backend responde 403, no 401). Con error de red se
 * asume válida para no cerrar sesiones por estar offline.
 */
export async function checkSession() {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include', headers: authHeaders() });
  } catch {
    return true;
  }
  return response.ok;
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
}
