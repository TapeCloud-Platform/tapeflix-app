import { useEffect, useState } from 'react';
import { getMovies, getReviews, getComments, getProfileMetrics } from './api';
import MovieModal from './components/MovieModal';
import CategoryModal from './components/CategoryModal';

function consumeSsoParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('sso_logout') === 'true') {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

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
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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

  // Extrae todas las categorías únicas de la lista de películas
  const categories = ['Todas', ...Array.from(
    new Set(
      movies
        .flatMap((m) => (m.genre ? m.genre.split(',').map((g) => g.trim()) : []))
        .filter(Boolean)
    )
  ).sort()];

  const filteredMovies = selectedCategory === 'Todas'
    ? movies
      .sort((a, b) => (b.voteAverage || b.vote_average || 0) - (a.voteAverage || a.vote_average || 0))
      .slice(0, 15)
    : movies.filter((m) => m.genre && m.genre.toLowerCase().includes(selectedCategory.toLowerCase()));

  function handleLogout() {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    setSessionUser(null);
  }

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
        {sessionUser && (
          <div className="session-container">
            <span className="session-badge">Sesión: {sessionUser.displayName}</span>
            <button type="button" className="logout-button-small" onClick={handleLogout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        )}
        <div className="metrics-box">
          <strong>{metrics?.total_reviews ?? 0}</strong>
          <span>reviews totales</span>
        </div>
      </header>

      <section className="section-block">
        <div className="section-header">
          <h2>Películas</h2>
          <span className="count-badge">{filteredMovies.length} títulos</span>
        </div>

        {/* Barra de categorías/géneros */}
        <div className="categories-bar" aria-label="Categorías de películas">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Botón "Ver más" de la categoría actual - Solo para categorías específicas */}
        {filteredMovies.length > 0 && selectedCategory !== 'Todas' && (
          <div className="see-more-container">
            <button
              type="button"
              className="see-more-button"
              onClick={() => setCategoryModalOpen(true)}
            >
              Ver más en {selectedCategory}
            </button>
          </div>
        )}

        <div className="cards-grid">
          {filteredMovies.map((movie) => (
            <article key={movie.id} className="movie-card" onClick={() => setSelectedMovie(movie)}>
              <div className="poster-container">
                {movie.imageUrl ? (
                  <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
                ) : (
                  <div className="poster">{movie.title?.[0] || 'F'}</div>
                )}
                {movie.genre && (
                  <span className="genre-badge">{movie.genre.split(',')[0]}</span>
                )}
              </div>
              <h3>{movie.title}</h3>
              <p className="movie-description">{movie.description}</p>
              <div className="movie-footer">
                <small>{movie.releaseDate || 'Sin fecha'}</small>
                {movie.genre && <span className="genre-subtag">{movie.genre}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          sessionUser={sessionUser}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {categoryModalOpen && (
        <CategoryModal
          genre={selectedCategory}
          onClose={() => setCategoryModalOpen(false)}
          onMovieSelect={setSelectedMovie}
        />
      )}

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
