import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chip } from '@heroui/react';
import { formatYear } from '../utils/format';

export default function MovieCard({ movie, variant }) {
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/movie/${encodeURIComponent(movie.id)}`, { state: { movie } });
  }

  const year = formatYear(movie.releaseDate);
  const mainGenre = movie.genre?.split(',')[0]?.trim();

  return (
    <Card
      variant="transparent"
      className={`movie-card${variant ? ` movie-card--${variant}` : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && handleClick()}
    >
      <div className="poster-container cover-container">
        {movie.imageUrl ? (
          <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
        ) : (
          <div className="poster">{movie.title?.[0] || '🎬'}</div>
        )}

        {mainGenre && <Chip size="sm" variant="soft" className="movie-card__genre-chip">{mainGenre}</Chip>}

        {showPreview && (
          <div className="preview-overlay">
            <dl className="preview-facts">
              <div className="preview-fact">
                <dt>Estreno</dt>
                <dd>{year || 'Desconocido'}</dd>
              </div>
              {movie.genre && (
                <div className="preview-fact">
                  <dt>Género</dt>
                  <dd>{movie.genre}</dd>
                </div>
              )}
            </dl>
            <span className="click-hint">Ver más</span>
          </div>
        )}
      </div>

      <h3>{movie.title}</h3>
      <div className="movie-footer">
        <small>{year || 'Fecha desconocida'}</small>
      </div>
    </Card>
  );
}
