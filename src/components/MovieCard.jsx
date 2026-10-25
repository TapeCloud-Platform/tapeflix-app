import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chip } from '@heroui/react';
import { formatYear } from '../utils/format';

<<<<<<< HEAD
export default function MovieCard({ movie, onClick }) {
=======
export default function MovieCard({ movie, variant }) {
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  function handleClick() {
<<<<<<< HEAD
    if (onClick) onClick();
    else navigate(`/movie/${encodeURIComponent(movie.tmdbId || movie.id)}`);
  }

  const year = formatYear(movie.releaseDate);
  const mainGenre = movie.genre?.[0] || '';
=======
    navigate(`/movie/${encodeURIComponent(movie.id)}`, { state: { movie } });
  }

  const year = formatYear(movie.releaseDate);
  const mainGenre = movie.genre?.split(',')[0]?.trim();
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252

  return (
    <Card
      variant="transparent"
<<<<<<< HEAD
      className="movie-card"
=======
      className={`movie-card${variant ? ` movie-card--${variant}` : ''}`}
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
      onClick={handleClick}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && handleClick()}
    >
      <div className="poster-container cover-container">
<<<<<<< HEAD
        {movie.posterUrl ? (
          <img className="poster-image" src={movie.posterUrl} alt={movie.title} />
        ) : (
          <div className="poster">{movie.title?.[0] || '🎬'}</div>
        )}
        {mainGenre && <Chip size="sm" variant="soft" className="movie-card__genre-chip">{mainGenre}</Chip>}
=======
        {movie.imageUrl ? (
          <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
        ) : (
          <div className="poster">{movie.title?.[0] || '🎬'}</div>
        )}

        {mainGenre && <Chip size="sm" variant="soft" className="movie-card__genre-chip">{mainGenre}</Chip>}

>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
        {showPreview && (
          <div className="preview-overlay">
            <dl className="preview-facts">
              <div className="preview-fact">
                <dt>Estreno</dt>
                <dd>{year || 'Desconocido'}</dd>
              </div>
<<<<<<< HEAD
              {movie.genre && movie.genre.length > 0 && (
                <div className="preview-fact">
                  <dt>Género</dt>
                  <dd>{movie.genre.join(', ')}</dd>
=======
              {movie.genre && (
                <div className="preview-fact">
                  <dt>Género</dt>
                  <dd>{movie.genre}</dd>
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
                </div>
              )}
            </dl>
            <span className="click-hint">Ver más</span>
          </div>
        )}
      </div>
<<<<<<< HEAD
=======

>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
      <h3>{movie.title}</h3>
      <div className="movie-footer">
        <small>{year || 'Fecha desconocida'}</small>
      </div>
    </Card>
  );
}
