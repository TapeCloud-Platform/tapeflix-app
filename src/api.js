const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'TU_TMDB_API_KEY';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const VIDEOAPI_BASE = 'https://videoapi.la';

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

export async function validateEmbed(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${VIDEOAPI_BASE}/api/v1/public/validate-embed?${qs}`);
  if (!res.ok) return { valid: false };
  return await res.json();
}

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
    genre: [],
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

export async function searchAll(query) {
  const [movies, tv] = await Promise.all([
    searchMovies(query).catch(() => []),
    searchTV(query).catch(() => []),
  ]);
  return [...movies, ...tv];
}
