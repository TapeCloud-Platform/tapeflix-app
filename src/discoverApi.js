const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function getFilters(sourceApp) {
  const response = await fetch(`${API_URL}/api/discover/${sourceApp}/filters`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar los filtros.');
  }
  return response.json();
}

export async function discover(sourceApp, { type = 'top', value = '', limit = 30 } = {}) {
  const params = new URLSearchParams({ type, limit: String(limit) });
  if (value) {
    params.set('value', value);
  }

  const response = await fetch(`${API_URL}/api/discover/${sourceApp}?${params}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo cargar el contenido.');
  }
  return response.json();
}
