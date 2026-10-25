import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import AppHeader from './components/AppHeader';
import CatalogPage from './components/CatalogPage';
import MovieDetailPage from './components/MovieDetailPage';
import { discover, getFilters } from './discoverApi';
import { useTheme } from './utils/theme';

const SOURCE_APP = 'tapeflix';
const RESULT_LIMIT = 40;

function shuffled(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function AppShell({ sessionUser, onLogout, onLoginClick, theme, onThemeChange }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [active, setActive] = useState({ type: 'top', value: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({ groups: [], flat: [] });
  const previewTimer = useRef(null);

  useEffect(() => {
    getFilters(SOURCE_APP).then(setFilters).catch(() => setFilters([]));
  }, []);

  function handleSearchPreview(query) {
    clearTimeout(previewTimer.current);
    if (query.length < 2) {
      setSuggestions({ groups: [], flat: [] });
      return;
    }
    setSuggestions(null);
    previewTimer.current = setTimeout(() => {
      discover(SOURCE_APP, { type: 'search', value: query, limit: 4 })
        .then(setSuggestions)
        .catch(() => setSuggestions({ groups: [], flat: [] }));
    }, 250);
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

  function applyFilter(filter) {
    setActive(filter);
    navigate('/catalog');
  }

  const activeFilter = filters.find((filter) => filter.type === active.type);
  const navGenres = useMemo(() => {
    const options = filters.find((filter) => filter.type === 'genre')?.options ?? [];
    return shuffled(options).slice(0, 8);
  }, [filters]);

  return (
    <div className="app-shell">
      <AppHeader
        appName="TapeFlix"
        tagline="Películas y series con VideoAPI"
        sessionUser={null}
        onLogout={() => {}}
        onLoginClick={() => {}}
        onSearch={(query) => applyFilter({ type: 'search', value: query })}
        onSearchPreview={handleSearchPreview}
        suggestions={suggestions}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => applyFilter({ type: 'top', value: '' })}
        theme="dark"
        onThemeChange={() => {}}
        filters={filters}
        navGenres={navGenres}
        active={active}
        onApplyFilter={applyFilter}
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
              navGenres={navGenres}
              onClearFilters={() => applyFilter({ type: 'top', value: '' })}
            />
          }
        />
        <Route path="/movie/:movieId" element={<MovieDetailPage />} />
        <Route path="/" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState({ type: 'top', value: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState([]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell
        active={active}
        setActive={setActive}
        items={items}
        setItems={setItems}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        filters={filters}
        setFilters={setFilters}
      />
    </Router>
  );
}
