import { useEffect, useRef, useState } from 'react';
import { Drawer, Button, Chip } from '@heroui/react';
import { discover } from '../discoverApi';

const SUGGESTION_LIMIT = 6;
const SUGGESTION_DEBOUNCE_MS = 300;

const SECTION_HINTS = {
  top: 'Lo más popular ahora.',
  genre: 'Elegí uno o varios y dale a Buscar.',
  country: 'Filtrá por país de origen.',
  artist: 'Escribí y elegí de las sugerencias.',
  people: 'Buscá actores y directores por nombre.',
  album: 'Buscá un álbum por título y elegilo.',
  search: 'Búsqueda libre por título.',
};

/** Drawer de exploración: sugerencias en vivo + multiselección de géneros. */
export default function CategoryDrawer({ open, filters, active, onApply, onClose, sourceApp }) {
  const [queries, setQueries] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const timers = useRef({});

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  function apply(type, value) {
    onApply({ type, value });
    onClose();
  }

  function toggleGenre(value) {
    setSelectedGenres((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  }

  function applyGenres() {
    if (selectedGenres.length === 0) {
      return;
    }
    apply('genre', selectedGenres.join(','));
  }

  function suggestionTarget(filter, item) {
    // Las personas se resuelven a sus películas.
    if (filter.type === 'people') {
      return { type: 'artist', value: item.title };
    }
    return { type: filter.type, value: item.title };
  }

  function requestSuggestions(filter, text) {
    clearTimeout(timers.current[filter.type]);
    const query = (text || '').trim();
    if (query.length < 2) {
      setSuggestions((current) => ({ ...current, [filter.type]: null }));
      return;
    }
    setSuggestions((current) => ({ ...current, [filter.type]: { loading: true, items: [] } }));
    timers.current[filter.type] = setTimeout(() => {
      discover(sourceApp, { type: filter.type, value: query, limit: SUGGESTION_LIMIT })
        .then((data) => setSuggestions((current) => ({
          ...current,
          [filter.type]: { loading: false, items: (data || []).slice(0, SUGGESTION_LIMIT) },
        })))
        .catch(() => setSuggestions((current) => ({
          ...current,
          [filter.type]: { loading: false, items: [] },
        })));
    }, SUGGESTION_DEBOUNCE_MS);
  }

  function submitQuery(event, filter) {
    event.preventDefault();
    const raw = (queries[filter.type] || '').trim();
    if (filter.type === 'genre' && selectedGenres.length > 0 && !raw) {
      applyGenres();
      return;
    }
    if (!raw) {
      return;
    }

    const match = filter.options.find(
      (option) => option.label.toLowerCase() === raw.toLowerCase()
    );

    if (match) {
      apply(filter.type, match.value);
    } else if (filter.freeText) {
      apply(filter.type, raw);
    }
  }

  function visibleOptions(filter) {
    const query = (queries[filter.type] || '').trim().toLowerCase();
    // Género: los chips se filtran en vivo por lo escrito ("sci" -> "Sci-Fi").
    if (filter.type === 'genre') {
      if (!query) {
        return filter.options;
      }
      return filter.options.filter((option) => option.label.toLowerCase().includes(query));
    }
    // Texto libre: las coincidencias vienen del backend, no de chips.
    if (filter.freeText) {
      return [];
    }
    if (!query) {
      return filter.options;
    }
    return filter.options.filter((option) => option.label.toLowerCase().includes(query));
  }

  const activeFilter = filters.find((filter) => filter.type === active.type);
  const activeOption = activeFilter?.options.find((option) => option.value === active.value);
  const activeSummary =
    active.type === 'top'
      ? 'Inicio'
      : `${activeFilter?.label ?? active.type}${activeOption ? `: ${activeOption.label}` : active.value ? `: ${active.value}` : ''}`;

  // "Inicio" primero, después el resto en el orden del backend.
  const ordered = [...filters].sort((a, b) => (a.type === 'top' ? -1 : b.type === 'top' ? 1 : 0));

  return (
    <Drawer.Root isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Backdrop className="drawer-backdrop">
        <Drawer.Content placement="right">
          <Drawer.Dialog className="drawer" aria-label="Explorar categorías">
            <div className="drawer__head">
              <div>
                <h2>Explorar</h2>
                <p className="drawer__active">Viendo: <strong>{activeSummary}</strong></p>
              </div>
              <div className="drawer__head-actions">
                {active.type !== 'top' && (
                  <Button variant="ghost" className="drawer__clear" onClick={() => apply('top', '')}>
                    Limpiar filtros
                  </Button>
                )}
                <Button isIconOnly variant="ghost" className="icon-button" onClick={onClose} aria-label="Cerrar">
                  ✕
                </Button>
              </div>
            </div>

            <div className="drawer__body">
              {ordered.map((filter) => {
                const options = visibleOptions(filter);
                const suggestion = suggestions[filter.type];
                const showChips = filter.type === 'genre' || (!filter.freeText && filter.options.length > 0);

                return (
                  <section key={filter.type} className="drawer__section">
                    <div className="drawer__section-head">
                      <h3>{filter.label}</h3>
                      {filter.options.length > 0 && (
                        <span className="drawer__count">{filter.options.length}</span>
                      )}
                      {filter.type === 'genre' && selectedGenres.length > 0 && (
                        <span className="drawer__count is-selected">{selectedGenres.length} elegidos</span>
                      )}
                    </div>
                    {SECTION_HINTS[filter.type] && (
                      <p className="drawer__hint">{SECTION_HINTS[filter.type]}</p>
                    )}

                    {filter.type === 'top' && (
                      <button
                        type="button"
                        className={`drawer__item ${active.type === 'top' ? 'is-active' : ''}`}
                        onClick={() => apply('top', '')}
                      >
                        Ver inicio
                      </button>
                    )}

                    {filter.type !== 'top' && (
                      <form className="drawer__form" onSubmit={(event) => submitQuery(event, filter)}>
                        <input
                          type="search"
                          name={`buscar-${filter.type}`}
                          autoComplete="off"
                          placeholder={`Buscar ${filter.label.toLowerCase()}...`}
                          value={queries[filter.type] || ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            setQueries((current) => ({ ...current, [filter.type]: value }));
                            if (filter.freeText) {
                              requestSuggestions(filter, value);
                            }
                          }}
                          aria-label={`Buscar en ${filter.label}`}
                        />
                        <Button type="submit" className="submit-review-btn" size="sm">
                          {filter.type === 'genre' && selectedGenres.length > 0 ? `Buscar (${selectedGenres.length})` : 'Ir'}
                        </Button>
                      </form>
                    )}

                    {suggestion?.loading && (
                      <p className="drawer__hint">Buscando coincidencias...</p>
                    )}

                    {suggestion && !suggestion.loading && suggestion.items.length > 0 && (
                      <ul className="drawer__suggestions">
                        {suggestion.items.map((item) => (
                          <li key={item.externalId}>
                            <button
                              type="button"
                              onClick={() => {
                                const target = suggestionTarget(filter, item);
                                apply(target.type, target.value);
                              }}
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
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {showChips && options.length > 0 && (
                      <div className="drawer__chips">
                        {options.map((option) => {
                          if (filter.type === 'genre') {
                            const isSelected = selectedGenres.includes(option.value);
                            return (
                              <Chip
                                key={option.value}
                                color={isSelected ? 'accent' : 'default'}
                                variant={isSelected ? 'primary' : 'soft'}
                                className={`category-pill ${isSelected ? 'is-active' : ''}`}
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onClick={() => toggleGenre(option.value)}
                                onKeyDown={(event) => event.key === 'Enter' && toggleGenre(option.value)}
                              >
                                {option.label}
                              </Chip>
                            );
                          }
                          const isActive = active.type === filter.type && active.value === option.value;
                          return (
                            <Chip
                              key={option.value}
                              color={isActive ? 'accent' : 'default'}
                              variant={isActive ? 'primary' : 'soft'}
                              className={`category-pill ${isActive ? 'is-active' : ''}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => apply(filter.type, option.value)}
                              onKeyDown={(event) => event.key === 'Enter' && apply(filter.type, option.value)}
                            >
                              {option.label}
                            </Chip>
                          );
                        })}
                      </div>
                    )}

                    {filter.type === 'genre' && options.length === 0 && (
                      <p className="drawer__empty">Sin coincidencias.</p>
                    )}
                  </section>
                );
              })}
            </div>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
