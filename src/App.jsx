import { useEffect, useState } from 'react';
import { getMovies, getReviews, getComments, getProfileMetrics } from './api';

function consumeSsoParams() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('sso_token');
  const email = params.get('sso_email');

  if (token && email) {
    localStorage.setItem('tapecloud_token', token);
    localStorage.setItem('tapecloud_email', email);
    localStorage.setItem('tapecloud_display_name', params.get('sso_display_name') || '');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function getSessionUser() {
  const email = localStorage.getItem('tapecloud_email');
  if (!email) {
    return null;
  }
  return {
    email,
    displayName: localStorage.getItem('tapecloud_display_name') || email.split('@')[0],
  };
}

function App() {
  const [movies, setMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commentsByReview, setCommentsByReview] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    consumeSsoParams();
    setSessionUser(getSessionUser());

    async function loadData() {
      try {
        setLoading(true);
        const movieData = await getMovies();
        setMovies(movieData || []);

        // Reseñas, comentarios y métricas todavía no existen en el backend central.
        const [reviewData, profileData] = await Promise.all([
          getReviews().catch(() => []),
          getProfileMetrics(1).catch(() => null),
        ]);
        setReviews(reviewData || []);
        setMetrics(profileData);

        const commentMap = {};
        for (const review of reviewData || []) {
          commentMap[review.id] = await getComments(review.id).catch(() => []);
        }
        setCommentsByReview(commentMap);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la información de TapeFlix.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="app-shell"><h1>Loading TapeFlix...</h1></div>;
  }

  if (error) {
    return <div className="app-shell"><h1>TapeFlix</h1><p className="error">{error}</p></div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">TapeFlix</p>
          <h1>Catálogo y reseñas</h1>
        </div>
        <a className="back-to-portal" href="http://localhost:5173">
          Volver al portal
        </a>
        {sessionUser && <span className="session-badge">Sesión: {sessionUser.displayName}</span>}
        <div className="metrics-box">
          <strong>{metrics?.total_reviews ?? 0}</strong>
          <span>reviews totales</span>
        </div>
      </header>

      <section className="section-block">
        <h2>Películas</h2>
        <div className="cards-grid">
          {movies.map((movie) => (
            <article key={movie.id} className="movie-card">
              {movie.imageUrl ? (
                <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
              ) : (
                <div className="poster">{movie.title?.[0] || 'F'}</div>
              )}
              <h3>{movie.title}</h3>
              <p>{movie.description}</p>
              <small>{movie.releaseDate}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Reseñas</h2>
        <div className="reviews-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-header">
                <h3>{review.title}</h3>
                <span className="rating">⭐ {review.rating}</span>
              </div>
              <p>{review.body}</p>

              <div className="comment-box">
                <strong>Comentarios ({(commentsByReview[review.id] || []).length})</strong>
                {(commentsByReview[review.id] || []).length === 0 ? (
                  <p className="comment-empty">Sin comentarios aún.</p>
                ) : (
                  <ul>
                    {(commentsByReview[review.id] || []).map((comment) => (
                      <li key={comment.id}>{comment.body}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {metrics && (
        <section className="section-block mini-grid">
          <div className="metric-card">
            <span>tf_reviews</span>
            <strong>{metrics.tf_reviews ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>tb_reviews</span>
            <strong>{metrics.tb_reviews ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>tf_comment_count</span>
            <strong>{metrics.tf_comment_count ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span>tb_comment_count</span>
            <strong>{metrics.tb_comment_count ?? 0}</strong>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
