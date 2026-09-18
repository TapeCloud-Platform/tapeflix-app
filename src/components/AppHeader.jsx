import { useEffect, useState } from 'react';

export default function AppHeader({
  appName,
  tagline,
  portalUrl,
  sessionUser,
  onLogout,
  onSearch,
  onOpenMenu,
  onHome,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
    }
  }, [searchOpen]);

  function submitSearch(event) {
    event.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setSearchOpen(false);
    }
  }

  return (
    <header className="app-header">
      <div className="app-header__bar">
        <button type="button" className="app-header__brand" onClick={onHome} aria-label="Volver al inicio">
          <span className="app-header__logo" aria-hidden="true">
            {appName.charAt(0)}
          </span>
          <div>
            <h1 className="app-header__title">{appName}</h1>
            <p className="app-header__tagline">{tagline}</p>
          </div>
        </button>

        <div className="app-header__actions">
          {searchOpen && (
            <form className="header-search" onSubmit={submitSearch}>
              <input
                type="search"
                autoFocus
                placeholder="Buscar..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
              />
            </form>
          )}

          <button
            type="button"
            className="icon-button"
            onClick={() => (searchOpen ? setSearchOpen(false) : setSearchOpen(true))}
            aria-label="Buscar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
            </svg>
          </button>

          <button type="button" className="icon-button" onClick={onOpenMenu} aria-label="Abrir categorías">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </button>

          <a className="back-to-portal" href={portalUrl}>
            Portal
          </a>

          {sessionUser ? (
            <div className="session-container">
              <span className="session-badge">{sessionUser.displayName}</span>
              <button type="button" className="logout-button-small" onClick={onLogout}>
                Salir
              </button>
            </div>
          ) : (
            <a className="inline-login-btn" href={portalUrl}>
              Entrar
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
