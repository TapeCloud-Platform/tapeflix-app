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

export async function getReviews() {
  return request('/api/reviews?source_app=tapeflix');
}

export async function getComments(reviewId) {
  return request(`/api/comments?review_id=${reviewId}`);
}

export async function getProfileMetrics(userId) {
  return request(`/api/profile/${userId}/metrics`);
}
