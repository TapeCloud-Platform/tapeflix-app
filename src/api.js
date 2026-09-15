const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function getMovies() {
  return request('/api/content?sourceApp=tapeflix');
}

export async function findContentByExternalId(externalId) {
  const response = await fetch(
    `${API_URL}/api/content/lookup?sourceApp=tapeflix&sourceType=movie&externalId=${encodeURIComponent(externalId)}`
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
export async function registerContent(token, movie) {
  const response = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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

export async function getReviews(contentId) {
  const token = localStorage.getItem('tapecloud_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const path = contentId
    ? `/api/reviews?contentId=${contentId}`
    : '/api/reviews?sourceApp=tapeflix';

  const response = await fetch(`${API_URL}${path}`, { headers });
  if (!response.ok) {
    throw new Error('Error al cargar las reseñas');
  }
  return response.json();
}

export async function createReview(contentId, token, reviewData) {
  const response = await fetch(`${API_URL}/api/reviews/content/${contentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'No se pudo publicar la reseña.');
  }

  return body;
}

export async function toggleReviewLike(reviewId, token) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'No se pudo registrar el me gusta.');
  }

  return body;
}

export async function deleteReview(reviewId, token) {
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo eliminar la reseña.');
  }
}

export async function getComments(reviewId) {
  return request(`/api/comments?reviewId=${reviewId}`);
}

export async function createComment(reviewId, token, commentData) {
  const response = await fetch(`${API_URL}/api/comments/review/${reviewId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'No se pudo publicar el comentario.');
  }

  return body;
}

export async function deleteComment(commentId, token) {
  const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo eliminar el comentario.');
  }
}

export async function getProfileMetrics(userId) {
  return request(`/api/profile/${userId}/metrics`);
}

export async function getMoviesPaginated(genre = null, page = 0, limit = 20) {
  let url = `/api/content/paginated?sourceApp=tapeflix&page=${page}&limit=${limit}`;
  if (genre && genre !== 'Todas') {
    url += `&genre=${encodeURIComponent(genre)}`;
  }
  return request(url);
}

