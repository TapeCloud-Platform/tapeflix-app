import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getMovies, getReviews, getComments, getProfileMetrics } from './api';
import CatalogPage from './components/CatalogPage';
import MovieDetailPage from './components/MovieDetailPage';

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

        const [reviewData, profileData] = await Promise.all([
          getReviews().catch(() => []),
          getProfileMetrics(1).catch(() => null),
        ]);
        setReviews(reviewData || []);
        setMetrics(profileData);
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
    <Router>
      <Routes>
        <Route
          path="/catalog"
          element={
            <CatalogPage
              movies={movies}
              reviews={reviews}
              metrics={metrics}
              sessionUser={sessionUser}
              onLogout={() => {
                localStorage.removeItem('tapecloud_token');
                localStorage.removeItem('tapecloud_email');
                localStorage.removeItem('tapecloud_display_name');
                setSessionUser(null);
              }}
            />
          }
        />
        <Route path="/movie/:movieId" element={<MovieDetailPage sessionUser={sessionUser} />} />
        <Route path="/" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
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
