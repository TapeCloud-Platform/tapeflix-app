import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, SearchField } from '@heroui/react';
import SettingsMenu from './SettingsMenu';
import AppSwitcher from './AppSwitcher';
import LoadingIcon from './LoadingIcon';
import tapeflixLogoLight from '../assets/tapeflix-logo-light.png';
import tapeflixLogoDark from '../assets/tapeflix-logo-dark.png';

const NAV_GENRE_COUNT = 8;

function normalizeSuggestions(suggestions) {
  if (!suggestions) {
    return { groups: [], flat: [], loading: false };
  }
  if (Array.isArray(suggestions)) {
    return { groups: suggestions.length > 0 ? [{ key: 'all', label: null, items: suggestions }] : [], flat: suggestions, loading: false };
  }
  if (suggestions.groups) {
    return { groups: suggestions.groups, flat: suggestions.flat ?? suggestions.groups.flatMap((g) => g.items), loading: false };
  }
  return { groups: [], flat: [], loading: false };
}

export default function AppHeader({
  appName,
  tagline,
  portalUrl,
  sessionUser,
  onLogout,
  onLoginClick,
  onSearch,
  onSearchPreview,
  suggestions,
  onOpenMenu,
  onHome,
  onSelectPerson,
  onSelectUser,
  theme,
  onThemeChange,
  filters = [],
  active,
  onApplyFilter,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef(null);

  const logoSrc = theme === 'light' ? tapeflixLogoLight : tapeflixLogoDark;

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      setHighlight(-1);
      onSearchPreview?.('');
    }
  }, [searchOpen]);

  useEffect(() => {
    onSearchPreview?.(query.trim());
    setHighlight(-1);
  }, [query]);

  const { groups, flat } = useMemo(() => normalizeSuggestions(suggestions), [suggestions]);
  const showSuggestions = (searchOpen || query.trim().length >= 2) && query.trim().length >= 2;
  const isLoading = suggestions === null;

  const genreFilter = filters?.find((filter) => filter.type === 'genre');
  const navGenres = genreFilter?.options.slice(0, NAV_GENRE_COUNT) ?? [];

  function submitSearch(event) {
    event?.preventDefault();
    if (highlight >= 0 && flat[highlight]) {
      selectItem(flat[highlight]);
      return;
    }
    if (query.trim()) {
      onSearch(query.trim());
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  }

  function selectItem(item) {
    setSearchOpen(false);
    setQuery('');
    if (item.kind === 'person' && onSelectPerson) {
      onSelectPerson(item);
      return;
    }
    if (item.kind === 'user' && onSelectUser) {
      onSelectUser(item);
      return;
    }
    onSearch(item.title);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && flat.length > 0) {
      event.preventDefault();
      setHighlight((h) => (h + 1) % flat.length);
    } else if (event.key === 'ArrowUp' && flat.length > 0) {
      event.preventDefault();
      setHighlight((h) => (h <= 0 ? flat.length - 1 : h - 1));
    } else if (event.key === 'Escape') {
      if (query) {
        setQuery('');
      } else {
        setSearchOpen(false);
      }
    }
  }

  function kindLabel(kind) {
    if (kind === 'person') return 'Persona';
    if (kind === 'user') return 'Usuario';
    return null;
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
      <div className="app-header__topbar">
        <div className="app-header__left">
          <SettingsMenu
            sessionUser={sessionUser}
            onLogout={onLogout}
            onLoginClick={onLoginClick}
            theme={theme}
            onThemeChange={onThemeChange}
            portalUrl={portalUrl}
          />
        </div>

        <div className="app-header__brand-wrap">
          <button type="button" className="app-header__brand" onClick={onHome} aria-label="Volver al inicio">
            <img className="app-header__logo" src={logoSrc} alt="" aria-hidden="true" />
            <span className="app-header__brand-text">
              <span className="app-header__wordmark">{appName}</span>
              <span className="app-header__tagline">{tagline}</span>
            </span>
          </button>
          <AppSwitcher current="tapeflix" theme={theme} />
        </div>

        <div className="app-header__actions">
          <form className={`header-search ${searchOpen ? 'is-open' : ''}`} onSubmit={submitSearch} role="search">
            <SearchField aria-label="Buscar" value={query} onChange={setQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  ref={inputRef}
                  name="q"
                  placeholder="Buscar películas, personas, usuarios..."
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => {
                    if (!query) setSearchOpen(false);
                  }}
                  onKeyDown={handleKeyDown}
                  role="combobox"
                  aria-expanded={showSuggestions}
                  aria-controls="header-search-listbox"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            {showSuggestions && (
              <div className="header-search__panel" id="header-search-listbox" role="listbox">
                {isLoading ? (
                  <p className="header-search__loading">
                    <LoadingIcon size={14} /> Buscando...
                  </p>
                ) : flat.length > 0 ? (
                  <>
                    {groups.map((group) => (
                      <section key={group.key} className="header-search__group">
                        {group.label && <h4 className="header-search__group-title">{group.label}</h4>}
                        <ul className="header-search__group-list">
                          {group.items.map((item) => {
                            const flatIndex = flat.indexOf(item);
                            return (
                              <li key={`${group.key}-${item.externalId}`}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={flatIndex === highlight}
                                  className={flatIndex === highlight ? 'is-highlight' : ''}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectItem(item);
                                  }}
                                  onMouseEnter={() => setHighlight(flatIndex)}
                                >
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt="" aria-hidden="true" />
                                  ) : (
                                    <span className="header-search__fallback" aria-hidden="true">
                                      {(item.title || '?')[0]?.toUpperCase()}
                                    </span>
                                  )}
                                  <span>
                                    <strong>{item.title}</strong>
                                    {item.subtitle && <small>{item.subtitle}</small>}
                                  </span>
                                  {kindLabel(item.kind) && (
                                    <span className="header-search__kind">{kindLabel(item.kind)}</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                    <button
                      type="button"
                      className="header-search__see-all"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submitSearch();
                      }}
                    >
                      Ver todos los resultados para “{query.trim()}”
                    </button>
                  </>
                ) : (
                  <p className="header-search__empty">Sin resultados. Probá con otro nombre.</p>
                )}
              </div>
            )}
          </form>

          <Button
            isIconOnly
            variant="ghost"
            className="icon-button header-search__toggle"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="Buscar"
            aria-expanded={searchOpen}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
            </svg>
          </Button>
        </div>
      </div>

      {navGenres.length > 0 && (
        <nav className="app-header__navbar" aria-label="Géneros">
          <button
            type="button"
            className={`app-header__nav-link ${active?.type === 'top' ? 'is-active' : ''}`}
            onClick={onHome}
          >
            Inicio
          </button>
          {navGenres.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`app-header__nav-link ${
                active?.type === 'genre' && active?.value === option.value ? 'is-active' : ''
              }`}
              onClick={() => onApplyFilter?.({ type: 'genre', value: option.value })}
            >
              {option.label}
            </button>
          ))}
          <button type="button" className="app-header__nav-link app-header__nav-more" onClick={onOpenMenu}>
            Más
          </button>
        </nav>
      )}
      </div>
    </header>
  );
}
