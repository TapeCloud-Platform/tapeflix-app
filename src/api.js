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
}
