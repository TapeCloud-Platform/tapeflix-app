import { useCallback, useEffect, useState } from 'react';
import AppHeader from './components/AppHeader';
import CategoryDrawer from './components/CategoryDrawer';
import MovieModal from './components/MovieModal';
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

export default function App() {
  const [filters, setFilters] = useState([]);
  const [active, setActive] = useState({ type: 'top', value: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    consumeSsoParams();
    setSessionUser(getSessionUser());
    getFilters(SOURCE_APP).then(setFilters).catch(() => setFilters([]));
  }, []);

  const loadItems = useCallback(async (filter) => {
    try {
      setLoading(true);
      setError('');
      const data = await discover(SOURCE_APP, { ...filter, limit: RESULT_LIMIT });
      setItems(data || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el contenido.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(active);
  }, [active, loadItems]);

  function handleSearch(query) {
    setActive({ type: 'search', value: query });
  }

  function handleLogout() {
    localStorage.removeItem('tapecloud_token');
    localStorage.removeItem('tapecloud_email');
    localStorage.removeItem('tapecloud_display_name');
    setSessionUser(null);
  }

  const activeFilter = filters.find((filter) => filter.type === active.type);
  const isFiltered = active.type !== 'top';
  const activeLabel = activeFilter?.options?.find((option) => option.value === active.value)?.label
    ?? active.value;

  function clearFilters() {
    setActive({ type: 'top', value: '' });
  }

  return (
    <div className="app-shell">
      <AppHeader
        appName="TapeFlix"
        tagline="Películas y reseñas"
        portalUrl={PORTAL_URL}
        sessionUser={sessionUser}
        onLogout={handleLogout}
        onSearch={handleSearch}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={clearFilters}
      />

      <CategoryDrawer
        open={menuOpen}
        filters={filters}
        active={active}
        onApply={setActive}
        onClose={() => setMenuOpen(false)}
      />

      <main className="app-main">
        <section className="section-block">
          <div className="section-header">
            <h2>{activeFilter?.label ?? 'Contenido'}</h2>
            {!loading && <span className="count-badge">{items.length} resultados</span>}

            {isFiltered && (
              <button type="button" className="active-filter-chip" onClick={clearFilters}>
                {activeLabel}
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          {loading ? (
            <p className="loading-text">Cargando...</p>
          ) : (
            <div className="cards-grid">
              {items.map((item) => (
                <article
                  key={item.externalId}
                  className="movie-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="poster-container">
                    {item.imageUrl ? (
                      <img className="poster-image" src={item.imageUrl} alt={item.title} />
                    ) : (
                      <div className="poster">{item.title?.[0] || '?'}</div>
                    )}
                    {item.genre && <span className="genre-badge">{item.genre.split(',')[0]}</span>}
                  </div>
                  <h3>{item.title}</h3>
                  <p className="movie-description">{item.description}</p>
                  <div className="movie-footer">
                    <small>{item.subtitle}</small>
                    {item.genre && <span className="genre-subtag">{item.genre}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedItem && (
        <MovieModal
          movie={{
            ...selectedItem,
            id: selectedItem.externalId,
            releaseDate: selectedItem.subtitle,
          }}
          sessionUser={sessionUser}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
