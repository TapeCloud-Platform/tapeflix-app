import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie, reviews }) {
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  // Obtener la primera reseña (preview) de la película
  const movieReview = reviews.find((r) => r.movieId === movie.id);
  const previewText = movieReview?.body?.substring(0, 120) || 'Sin reseñas disponibles';

  function handleClick() {
    navigate(`/movie/${movie.id}`, { state: { movie, review: movieReview } });
  }

  return (
    <article
      className="movie-card"
      onClick={handleClick}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="poster-container">
        {movie.imageUrl ? (
          <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
        ) : (
          <div className="poster">{movie.title?.[0] || 'F'}</div>
        )}
        {movie.genre && <span className="genre-badge">{movie.genre.split(',')[0]}</span>}

        {/* Preview al hover */}
        {showPreview && (
          <div className="preview-overlay">
            <p className="preview-text">{previewText}...</p>
            <span className="click-hint">Ver más</span>
          </div>
        )}
      </div>

      <h3>{movie.title}</h3>
      <div className="movie-footer">
        <small>{movie.releaseDate || 'Sin fecha'}</small>
        {movie.voteAverage || movie.vote_average ? (
          <span className="rating-badge">
            ⭐ {(movie.voteAverage || movie.vote_average).toFixed(1)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
