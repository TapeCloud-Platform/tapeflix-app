import { useEffect, useState } from 'react';
import { Button, SearchField } from '@heroui/react';
import SettingsMenu from './SettingsMenu';
import AppSwitcher from './AppSwitcher';
import LoadingIcon from './LoadingIcon';
import tapeflixIcon from '../assets/tapeflix-icon.png';

export default function AppHeader({
  appName,
  tagline,
  portalUrl,
  sessionUser,
  onLogout,
  onAvatarChange,
  onLoginClick,
  onSearch,
  onSearchPreview,
  suggestions,
  onOpenMenu,
  onHome,
  theme,
  onThemeChange,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      onSearchPreview?.('');
    }
  }, [searchOpen]);

  useEffect(() => {
    onSearchPreview?.(query.trim());
  }, [query]);

  function submitSearch(event) {
    event.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setSearchOpen(false);
    }
  }

  function selectSuggestion(item) {
    onSearch(item.title);
    setSearchOpen(false);
  }

  const showSuggestions = searchOpen && query.trim().length >= 2;

  return (
    <header className="app-header">
      <div className="app-header__bar">
        <button type="button" className="app-header__brand" onClick={onHome} aria-label="Volver al inicio">
          <div>
            <h1 className="app-header__title">{appName}</h1>
            <p className="app-header__tagline">{tagline}</p>
          </div>
        </button>

        <div className="app-header__actions">
          {searchOpen && (
            <form className="header-search" onSubmit={submitSearch}>
              <SearchField aria-label="Buscar" value={query} onChange={setQuery}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input
                    autoFocus
                    placeholder="Buscar películas..."
                    onBlur={() => {
                      if (!query) setSearchOpen(false);
                    }}
                  />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              {showSuggestions && (
                <ul className="header-search__suggestions">
                  {suggestions === null ? (
                    <li className="header-search__loading">
                      <LoadingIcon size={14} /> Buscando...
                    </li>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <li key={item.externalId}>
                        <button type="button" onMouseDown={() => selectSuggestion(item)}>
                          {item.imageUrl && <img src={item.imageUrl} alt="" aria-hidden="true" />}
                          <span>
                            <strong>{item.title}</strong>
                            {item.subtitle && <small>{item.subtitle}</small>}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="header-search__empty">Sin resultados similares.</li>
                  )}
                </ul>
              )}
            </form>
          )}

          <Button
            isIconOnly
            variant="ghost"
            className="icon-button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="Buscar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
            </svg>
          </Button>

          <SettingsMenu
            sessionUser={sessionUser}
            onLogout={onLogout}
            onAvatarChange={onAvatarChange}
            onLoginClick={onLoginClick}
            theme={theme}
            onThemeChange={onThemeChange}
            portalUrl={portalUrl}
          />

          <Button
            isIconOnly
            variant="ghost"
            className="icon-button"
            onClick={onOpenMenu}
            aria-label="Abrir filtros"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </Button>

          <AppSwitcher current="tapeflix" theme={theme} logoSrc={tapeflixIcon} appName="TapeFlix" />
        </div>
      </div>
    </header>
  );
}
