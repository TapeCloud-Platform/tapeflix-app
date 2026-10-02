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
import PersonDetailPage from './components/PersonDetailPage';
import UserProfilePage from './components/UserProfilePage';
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { discover, getFilters, searchAll } from './discoverApi';
import { checkSession, getMe, logout, setMemoryToken, clearMemoryToken } from './api';
import { useTheme } from './utils/theme';
import { broadcastLogout, syncSessionToPortal } from './sso';

const SOURCE_APP = 'tapeflix';
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';
const TAPEFLIX_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5174';
const RESULT_LIMIT = 40;
const SUGGESTION_PER_GROUP = 4;
const SUGGESTION_DEBOUNCE_MS = 250;

function consumeSsoParams() {
  const params = new URLSearchParams(window.location.search);

  const theme = params.get('sso_theme');
  if (theme === 'dark' || theme === 'light') {
    localStorage.setItem('tapecloud_theme', theme);
  }

  if (params.get('sso_logout') === 'true') {
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    localStorage.removeItem('tapecloud_avatar');
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  // La auth viaja por cookie httpOnly: el token ya no pasa por URL.
  // Se restaura solo perfil UI (email/display/avatar); la sesión se valida
  // contra /api/auth/me con credentials:include.
  const email = params.get('sso_email');
  if (email) {
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
function AppShell({ sessionUser, onLogout, onLoginClick, theme, onThemeChange }) {
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

  // Búsqueda "en vivo" agrupada: películas + personas + usuarios en paralelo.
  function handleSearchPreview(query) {
    clearTimeout(previewTimer.current);
    if (query.length < 2) {
      setSuggestions({ groups: [], flat: [] });
      return;
    }
    setSuggestions(null);
    previewTimer.current = setTimeout(() => {
      searchAll(SOURCE_APP, query, SUGGESTION_PER_GROUP)
        .then(setSuggestions)
        .catch(() => setSuggestions({ groups: [], flat: [] }));
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

  function selectPerson(item) {
    navigate(`/person/${encodeURIComponent(item.title)}`);
  }

  function selectUser(item) {
    const username = item.genre || item.title.replace(/^@/, '');
    navigate(`/user/${encodeURIComponent(username)}`);
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
        onLoginClick={onLoginClick}
        onSearch={(query) => applyFilter({ type: 'search', value: query })}
        onSearchPreview={handleSearchPreview}
        suggestions={suggestions}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => applyFilter({ type: 'top', value: '' })}
        onSelectPerson={selectPerson}
        onSelectUser={selectUser}
        theme={theme}
        onThemeChange={onThemeChange}
        filters={filters}
        active={active}
        onApplyFilter={applyFilter}
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
        <Route path="/person/:personName" element={<PersonDetailPage sessionUser={sessionUser} onLoginClick={onLoginClick} />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
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
    // La cookie httpOnly se revalida contra el backend; un 401 limpia el
    // perfil UI local. Si hay cookie válida pero sin perfil local (login en
    // otra app), se restaura vía /api/auth/me.
    let cancelled = false;
    async function validateSession() {
      const valid = await checkSession();
      if (cancelled) return;
      if (!valid) {
        localStorage.removeItem('tapecloud_email');
        localStorage.removeItem('tapecloud_display_name');
        localStorage.removeItem('tapecloud_avatar');
        setSessionUser(null);
        return;
      }
      if (!localStorage.getItem('tapecloud_email')) {
        try {
          const me = await getMe();
          if (cancelled) return;
          localStorage.setItem('tapecloud_email', me.email);
          localStorage.setItem('tapecloud_display_name', me.displayName || me.email.split('@')[0]);
          if (me.avatarDataUri) localStorage.setItem('tapecloud_avatar', me.avatarDataUri);
          setSessionUser({
            email: me.email,
            displayName: me.displayName || me.email.split('@')[0],
            avatarDataUri: me.avatarDataUri || null,
          });
        } catch {
          // /me falló pero la cookie parece válida: no se cierra sesión.
        }
      }
    }
    validateSession();
    window.addEventListener('focus', validateSession);
    window.addEventListener('pageshow', validateSession);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', validateSession);
      window.removeEventListener('pageshow', validateSession);
    };
  }, []);

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

  async function handleLogout() {
    // 1. Invalida la sesión en el backend (limpia cookie; aunque falle, se sigue local).
    try {
      await logout();
    } catch {
      // Sin conexión o sesión ya inválida: igual se cierra localmente.
    }
    // 2. Avisa al portal y a TapeBeat para que cierren su propio perfil UI (SSO).
    broadcastLogout(theme, TAPEFLIX_URL);
    clearMemoryToken();
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    localStorage.removeItem('tapecloud_avatar');
    setSessionUser(null);
  }

  function handleLoginSuccess(response) {
    // Híbrido: cookie httpOnly (la setea el backend) + token en memoria
    // como respaldo si el navegador bloquea cookies de terceros.
    setMemoryToken(response.token);
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
