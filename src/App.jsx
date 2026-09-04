import { useEffect, useState } from 'react';
import { getMovies, getReviews, getComments, getProfileMetrics } from './api';

function App() {
  const [movies, setMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commentsByReview, setCommentsByReview] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [movieData, reviewData, profileData] = await Promise.all([
          getMovies(),
          getReviews(),
          getProfileMetrics(1),
        ]);

        setMovies(movieData || []);
        setReviews(reviewData || []);
        setMetrics(profileData);

        const commentMap = {};
        for (const review of reviewData || []) {
          const data = await getComments(review.id);
          commentMap[review.id] = data || [];
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
              <div className="poster">{movie.title?.[0] || 'F'}</div>
              <h3>{movie.title}</h3>
              <p>{movie.genre}</p>
              <small>{movie.release_year}</small>
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
