import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import AppHeader from './components/AppHeader';
import CategoryDrawer from './components/CategoryDrawer';
import CatalogPage from './components/CatalogPage';
import MovieDetailPage from './components/MovieDetailPage';
import { getReviews } from './api';
import { discover, getFilters } from './discoverApi';

const SOURCE_APP = 'tapeflix';
const PORTAL_URL = 'http://localhost:5173';
const RESULT_LIMIT = 30;

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

/** El header y el drawer viven fuera de las rutas para no desaparecer en el detalle. */
function AppShell({ sessionUser, onLogout }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [active, setActive] = useState({ type: 'top', value: '' });
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getFilters(SOURCE_APP).then(setFilters).catch(() => setFilters([]));
    getReviews().then(setReviews).catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await discover(SOURCE_APP, { ...active, limit: RESULT_LIMIT });
        if (!cancelled) {
          setItems(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el contenido.');
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Filtrar desde el detalle debe devolver al catálogo para ver los resultados.
  function applyFilter(filter) {
    setActive(filter);
    navigate('/catalog');
  }

  const activeFilter = filters.find((filter) => filter.type === active.type);

  return (
    <div className="app-shell">
      <AppHeader
        appName="TapeFlix"
        tagline="Películas y reseñas"
        portalUrl={PORTAL_URL}
        sessionUser={sessionUser}
        onLogout={onLogout}
        onSearch={(query) => applyFilter({ type: 'search', value: query })}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => applyFilter({ type: 'top', value: '' })}
      />

      <CategoryDrawer
        open={menuOpen}
        filters={filters}
        active={active}
        onApply={applyFilter}
        onClose={() => setMenuOpen(false)}
      />

      <Routes>
        <Route
          path="/catalog"
          element={
            <CatalogPage
              items={items}
              reviews={reviews}
              loading={loading}
              error={error}
              activeFilter={activeFilter}
              active={active}
              onClearFilters={() => applyFilter({ type: 'top', value: '' })}
            />
          }
        />
        <Route path="/movie/:movieId" element={<MovieDetailPage sessionUser={sessionUser} />} />
        <Route path="/" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    consumeSsoParams();
    setSessionUser(getSessionUser());
  }, []);

  function handleLogout() {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    setSessionUser(null);
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell sessionUser={sessionUser} onLogout={handleLogout} />
    </Router>
  );
}
