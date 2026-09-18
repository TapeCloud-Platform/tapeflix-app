import { useEffect, useRef, useState } from 'react';
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
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { discover, getFilters } from './discoverApi';
import { useTheme } from './utils/theme';
import { syncSessionToPortal } from './sso';

const SOURCE_APP = 'tapeflix';
const PORTAL_URL = 'http://localhost:5173';
const RESULT_LIMIT = 40;
const SUGGESTION_LIMIT = 6;
const SUGGESTION_DEBOUNCE_MS = 250;

function consumeSsoParams() {
  const params = new URLSearchParams(window.location.search);

  const theme = params.get('sso_theme');
  if (theme === 'dark' || theme === 'light') {
    localStorage.setItem('tapecloud_theme', theme);
  }

  if (params.get('sso_logout') === 'true') {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    localStorage.removeItem('tapecloud_avatar');
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  const token = params.get('sso_token');
  const email = params.get('sso_email');

  if (token && email) {
    localStorage.setItem('tapecloud_token', token);
    localStorage.setItem('tapecloud_email', email);
    localStorage.setItem('tapecloud_display_name', params.get('sso_display_name') || '');
    const avatar = params.get('sso_avatar');
    if (avatar) {
      localStorage.setItem('tapecloud_avatar', avatar);
    } else {
      localStorage.removeItem('tapecloud_avatar');
    }
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
    avatarDataUri: localStorage.getItem('tapecloud_avatar') || null,
  };
}

/** El header y el drawer viven fuera de las rutas para no desaparecer en el detalle. */
function AppShell({ sessionUser, onLogout, onAvatarChange, onLoginClick, theme, onThemeChange }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [active, setActive] = useState({ type: 'top', value: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const previewTimer = useRef(null);

  useEffect(() => {
    getFilters(SOURCE_APP).then(setFilters).catch(() => setFilters([]));
  }, []);

  // Búsqueda "en vivo": mientras se escribe, se muestran resultados similares
  // aunque la consulta esté incompleta (el backend ya hace matching parcial).
  function handleSearchPreview(query) {
    clearTimeout(previewTimer.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestions(null);
    previewTimer.current = setTimeout(() => {
      discover(SOURCE_APP, { type: 'search', value: query, limit: SUGGESTION_LIMIT })
        .then((data) => setSuggestions((data || []).slice(0, SUGGESTION_LIMIT)))
        .catch(() => setSuggestions([]));
    }, SUGGESTION_DEBOUNCE_MS);
  }

  useEffect(() => () => clearTimeout(previewTimer.current), []);

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
  const portalUrl = `${PORTAL_URL}?sso_theme=${theme}`;

  return (
    <div className="app-shell">
      <AppHeader
        appName="TapeFlix"
        tagline="Películas y reseñas"
        portalUrl={portalUrl}
        sessionUser={sessionUser}
        onLogout={onLogout}
        onAvatarChange={onAvatarChange}
        onLoginClick={onLoginClick}
        onSearch={(query) => applyFilter({ type: 'search', value: query })}
        onSearchPreview={handleSearchPreview}
        suggestions={suggestions}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => applyFilter({ type: 'top', value: '' })}
        theme={theme}
        onThemeChange={onThemeChange}
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
              loading={loading}
              error={error}
              activeFilter={activeFilter}
              active={active}
              filters={filters}
              onClearFilters={() => applyFilter({ type: 'top', value: '' })}
            />
          }
        />
        <Route path="/movie/:movieId" element={<MovieDetailPage sessionUser={sessionUser} onLoginClick={onLoginClick} />} />
        <Route path="/" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  // Se consume de forma síncrona (no en un efecto) porque la ruta "/" redirige
  // a "/catalog" con <Navigate>, cuyo efecto corre ANTES que el de este
  // componente (los efectos de los hijos disparan primero) y ya habría
  // limpiado el query string con los parámetros de SSO.
  const [sessionUser, setSessionUser] = useState(() => {
    consumeSsoParams();
    return getSessionUser();
  });
  const [theme, setTheme] = useTheme();
  const [authView, setAuthView] = useState(null);

  useEffect(() => {
    // Si el navegador restaura esta página desde el bfcache (botón "atrás" al
    // volver de otra app del ecosistema) en vez de recargarla de verdad, el CSS
    // puede quedar a medio aplicar. Forzar un reload evita ese estado raro.
    function handlePageShow(event) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  function handleLogout() {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    localStorage.removeItem('tapecloud_avatar');
    setSessionUser(null);
  }

  function handleAvatarChange(avatarDataUri) {
    if (avatarDataUri) {
      localStorage.setItem('tapecloud_avatar', avatarDataUri);
    } else {
      localStorage.removeItem('tapecloud_avatar');
    }
    setSessionUser((current) => (current ? { ...current, avatarDataUri: avatarDataUri || null } : current));
  }

  function handleLoginSuccess(response) {
    localStorage.setItem('tapecloud_token', response.token);
    localStorage.setItem('tapecloud_email', response.email);
    localStorage.setItem('tapecloud_display_name', response.displayName || response.email.split('@')[0]);
    if (response.avatarDataUri) {
      localStorage.setItem('tapecloud_avatar', response.avatarDataUri);
    } else {
      localStorage.removeItem('tapecloud_avatar');
    }
    setSessionUser({
      email: response.email,
      displayName: response.displayName || response.email.split('@')[0],
      avatarDataUri: response.avatarDataUri || null,
    });
    setAuthView(null);
    syncSessionToPortal(response, theme);
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell
        sessionUser={sessionUser}
        onLogout={handleLogout}
        onAvatarChange={handleAvatarChange}
        onLoginClick={() => setAuthView('login')}
        theme={theme}
        onThemeChange={setTheme}
      />

      {authView && (
        <AuthModal onClose={() => setAuthView(null)} theme={theme}>
          {authView === 'login' ? (
            <LoginPage onSuccess={handleLoginSuccess} onGoToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterPage onSuccess={handleLoginSuccess} onGoToLogin={() => setAuthView('login')} />
          )}
        </AuthModal>
      )}
    </Router>
  );
}
