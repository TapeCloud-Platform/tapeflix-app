import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMovies, getReviews, getComments } from '../api';
import MovieModal from './MovieModal';

export default function MovieDetailPage({ sessionUser }) {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [review, setReview] = useState(location.state?.review || null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(!movie);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Si no tenemos la película en state, buscarla
        if (!movie) {
          const movies = await getMovies();
          const foundMovie = movies.find((m) => m.id.toString() === movieId);
          if (foundMovie) {
            setMovie(foundMovie);
          }
        }

        // Cargar reseñas y comentarios
        const allReviews = await getReviews().catch(() => []);
        const movieReview = allReviews.find((r) => r.movieId.toString() === movieId);
        
        if (movieReview) {
          setReview(movieReview);
          const movieComments = await getComments(movieReview.id).catch(() => []);
          setComments(movieComments || []);
        }
      } catch (err) {
        console.error('Error cargando detalles:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId, movie]);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="detail-page">
          <h1>Cargando...</h1>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="app-shell">
        <div className="detail-page">
          <h1>Película no encontrada</h1>
          <button onClick={() => navigate('/catalog')}>Volver al catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar detail-topbar">
        <button className="back-button" onClick={() => navigate('/catalog')} title="Volver al catálogo">
          ← Catálogo
        </button>
        <div>
          <p className="eyebrow">Detalles de película</p>
          <h1>{movie.title}</h1>
        </div>
      </header>

      <section className="detail-page">
        <div className="detail-hero">
          {movie.imageUrl && (
            <img className="detail-poster" src={movie.imageUrl} alt={movie.title} />
          )}
          
          <div className="detail-info">
            <div className="detail-meta">
              {movie.releaseDate && (
                <div className="meta-item">
                  <strong>Fecha de estreno:</strong>
                  <span>{movie.releaseDate}</span>
                </div>
              )}
              {movie.voteAverage || movie.vote_average ? (
                <div className="meta-item">
                  <strong>Calificación:</strong>
                  <span className="rating">⭐ {(movie.voteAverage || movie.vote_average).toFixed(1)}/10</span>
                </div>
              ) : null}
              {movie.genre && (
                <div className="meta-item">
                  <strong>Géneros:</strong>
                  <span>{movie.genre}</span>
                </div>
              )}
            </div>

            <div className="detail-biography">
              <h2>Biografía</h2>
              <p>{movie.description || 'Sin descripción disponible.'}</p>
            </div>
          </div>
        </div>

        {/* Sección de Reseñas y Comentarios */}
        <div className="detail-reviews-section">
          <h2>Reseñas y comentarios</h2>
          
          {sessionUser && (
            <button
              className="add-review-button"
              onClick={() => setShowReviewModal(true)}
              title="Agregar una nueva reseña"
            >
              + Agregar reseña
            </button>
          )}

          {!review ? (
            <p className="no-reviews">No hay reseñas para esta película aún.</p>
          ) : (
            <div className="review-card">
              <div className="review-header">
                <strong>{review.title}</strong>
                <span className="review-rating">⭐ {review.rating}/5</span>
              </div>
              <p className="review-body">{review.body}</p>
              <small className="review-author">Por: {review.author || 'Anónimo'}</small>

              {/* Comentarios de la reseña */}
              {comments.length > 0 && (
                <div className="comments-list">
                  <h4>Comentarios ({comments.length})</h4>
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <strong>{comment.author || 'Anónimo'}</strong>
                        <small>{comment.createdAt}</small>
                      </div>
                      <p className="comment-body">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal para agregar reseña */}
      {showReviewModal && (
        <MovieModal
          movie={movie}
          sessionUser={sessionUser}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}
