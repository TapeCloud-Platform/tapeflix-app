import { useNavigate } from 'react-router-dom';
import { Card } from '@heroui/react';
import MovieCard from './MovieCard';

export default function CatalogPage({ items, loading, error, activeFilter, active, filters, navGenres, onClearFilters }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="app-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading">Cargando catálogo…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <div className="section-header">
        <h2>{activeFilter?.label || active?.label || 'Catálogo'}</h2>
        <span className="count-badge">{items.length} títulos</span>
      </div>

      <div className="cards-grid">
        {items.map((movie) => (
          <MovieCard key={movie.tmdbId || movie.id} movie={movie} onClick={() => navigate(`/movie/${movie.tmdbId || movie.id}`)} />
        ))}
      </div>
    </div>
  );
}
