import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { getMovieDetails, getTVDetails, buildVideoApiUrl } from '../discoverApi';
import StarRating from './StarRating';
import { SkeletonMovieDetail } from './Skeleton';
import { formatFullDate, formatYear } from '../utils/format';
import { CalendarIcon } from './icons';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        // Intentar como película primero
        let data;
        let type = 'movie';
        try {
          data = await getMovieDetails(movieId);
        } catch {
          type = 'tv';
          data = await getTVDetails(movieId);
        }
        if (cancelled) return;
        setMovie(data);
        if (type === 'tv' && data.seasons) {
          setSeasons(data.seasons);
          setSelectedSeason(data.seasons[0]?.season_number || 1);
          setSelectedEpisode(1);
        }
        setEmbedUrl(buildVideoApiUrl(type, data.tmdbId, selectedSeason, selectedEpisode));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [movieId]);

  useEffect(() => {
    if (movie && movie.type === 'tv') {
      setEmbedUrl(buildVideoApiUrl('tv', movie.tmdbId, selectedSeason, selectedEpisode));
    }
  }, [movie, selectedSeason, selectedEpisode]);

  const openPlayer = () => {
    if (embedUrl) setIsPlayerOpen(true);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
  };

  if (loading) return <SkeletonMovieDetail />;
  if (!movie) {
    return (
      <main className="app-main">
        <div className="detail-page">
          <h1>No encontrado</h1>
          <Button onClick={() => navigate('/catalog')}>Volver al catálogo</Button>
        </div>
      </main>
    );
  }

  const releaseDate = movie.releaseDate;
  const genres = movie.genre || [];
  const averageRating = movie.voteAverage || 0;

  return (
    <main className="app-main">
      <header className="topbar detail-topbar">
        <Button variant="ghost" onClick={() => navigate('/catalog')}>← Catálogo</Button>
        <div>
          <h1>{movie.title}</h1>
        </div>
        <Button onClick={openPlayer} className="play-button">
          ▶ Reproducir
        </Button>
      </header>

      <section className="detail-page">
        <div className="movie-backdrop" style={movie.imageUrl ? { backgroundImage: `url(${movie.imageUrl})` } : undefined}>
          <div className="movie-backdrop__scrim" />
          <div className="movie-backdrop__content">
            {movie.posterUrl && <img className="detail-poster movie-poster" src={movie.posterUrl} alt={movie.title} />}
            <div className="detail-info">
              {genres.length > 0 && (
                <div className="movie-genre-chips">
                  {genres.map((g) => (
                    <span key={g} className="movie-genre-chip">{g}</span>
                  ))}
                </div>
              )}
              <div className="detail-stats">
                <span className="stat-pill rating">
                  <StarRating value={averageRating} size="sm" /> {averageRating.toFixed(1)}/5
                </span>
                {releaseDate && <span className="stat-pill">{formatFullDate(releaseDate) || formatYear(releaseDate)}</span>}
              </div>
              {movie.plot && (
                <div className="detail-biography"><p>{movie.plot}</p></div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <h2 className="subsection-title">Información</h2>
        <div className="detail-stats" style={{ flexDirection: 'column', gap: '8px' }}>
          <span><strong>Tipo:</strong> {movie.type === 'movie' ? 'Película' : 'Serie'}</span>
          <span><strong>Duración:</strong> {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m</span>
          {movie.directorNames?.length && <span><strong>Director:</strong> {movie.directorNames.join(', ')}</span>}
          {movie.actorNames?.length && <span><strong>Reparto:</strong> {movie.actorNames.join(', ')}</span>}
        </div>
      </section>

      {/* Modal reproductor VideoAPI */}
      <div
        className={`player-modal ${isPlayerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Reproductor de video"
      >
        <div className="player-modal__backdrop" onClick={closePlayer} />
        <div className="player-modal__content">
          <button className="player-modal__close" onClick={closePlayer} aria-label="Cerrar reproductor">
            ×
          </button>
          <div className="player-modal__header">
            <span className="player-modal__title">{movie.type === 'movie' ? 'Película' : 'Serie'}</span>
            <span className="player-modal__id">ID: {movie.tmdbId}</span>
          </div>
          <div className="player-modal__iframe">
            {isPlayerOpen && (
              <iframe
                src={embedUrl}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="origin"
                title={movie.title}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            )}
          </div>
          {movie.type === 'tv' && seasons.length > 0 && (
            <div className="player-modal__controls">
              <div className="ctrl-group">
                <label>Temporada</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    const s = parseInt(e.target.value);
                    setSelectedSeason(s);
                    setSelectedEpisode(1);
                  }}
                >
                  {seasons.map((s) => (
                    <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>
                  ))}
                </select>
              </div>
              <div className="ctrl-group">
                <label>Episodio</label>
                <select
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                >
                  {[...Array(seasons.find((s) => s.season_number === selectedSeason)?.episode_count || 1)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Episodio {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
