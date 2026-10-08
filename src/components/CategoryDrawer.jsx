import { useEffect, useRef, useState } from 'react';
import { Drawer, Button, Chip } from '@heroui/react';
import { discover } from '../discoverApi';

const SUGGESTION_LIMIT = 6;
const SUGGESTION_DEBOUNCE_MS = 300;

// Qué tipo pide cada campo al backend para sugerir ETIQUETAS (nunca contenido
// mezclado): el género sugiere géneros, artista sugiere artistas, etc.
const SUGGEST_BACKEND_TYPE = {
  artist: 'artist',
  people: 'people',
  album: 'album',
  search: 'search',
};

const SECTION_HINTS = {
  genre: 'Buscá y sumá géneros (vale más de uno).',
  country: 'Buscá y sumá países.',
  artist: 'Buscá artistas y sumalos como etiqueta.',
  people: 'Buscá actores o directores y sumalos.',
  album: 'Buscá un álbum y sumalo.',
  search: 'Búsqueda libre por título.',
};

/** Drawer de exploración: arma etiquetas combinables (género + país + artista...). */
export default function CategoryDrawer({ open, filters, active, onApply, onClose, sourceApp }) {
  const [queries, setQueries] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [tags, setTags] = useState([]);
  const timers = useRef({});

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  function applyFilter(filter) {
    onApply(filter);
    onClose();
  }

  function addTag(tag) {
    setTags((current) => {
      if (current.some((t) => t.type === tag.type && t.value === tag.value)) {
        return current;
      }
      return [...current, tag];
    });
  }

  function removeTag(index) {
    setTags((current) => current.filter((_, i) => i !== index));
  }

  function applyCombined() {
    if (tags.length === 0) {
      return;
    }
    const label = tags.map((t) => t.label).join(' + ');
    onApply({ type: 'combined', value: tags, label });
    onClose();
  }

  function suggestionTag(filter, item) {
    // Las personas se combinan como artista (sus películas).
    if (filter.type === 'people') {
      return { type: 'artist', value: item.title, label: item.title };
    }
    // En música, el campo artista solo acepta artistas (no canciones).
    if (filter.type === 'artist') {
      return { type: 'artist', value: item.title, label: item.title };
    }
    return { type: filter.type, value: item.title, label: item.title };
  }

  // Solo estos campos piden sugerencias al backend; género/país son
  // etiquetas locales y nunca muestran contenido.
  function suggestTypeFor(filter) {
    if (sourceApp === 'tapeflix' && filter.type === 'artist') {
      return 'people';
    }
    return SUGGEST_BACKEND_TYPE[filter.type] ?? null;
  }

  function requestSuggestions(filter, text) {
    clearTimeout(timers.current[filter.type]);
    const query = (text || '').trim();
    const suggestType = suggestTypeFor(filter);
    if (query.length < 2 || suggestType === null) {
      setSuggestions((current) => ({ ...current, [filter.type]: null }));
      return;
    }
    setSuggestions((current) => ({ ...current, [filter.type]: { loading: true, items: [] } }));
    timers.current[filter.type] = setTimeout(() => {
      discover(sourceApp, { type: suggestType, value: query, limit: SUGGESTION_LIMIT })
        .then((data) => {
          setSuggestions((current) => ({
            ...current,
            [filter.type]: { loading: false, items: filterItems(filter, data || []).slice(0, SUGGESTION_LIMIT) },
          }));
        })
        .catch(() => {
          setSuggestions((current) => ({
            ...current,
            [filter.type]: { loading: false, items: [] },
          }));
        });
    }, SUGGESTION_DEBOUNCE_MS);
  }

  // Filtra el contenido mezclado: cada campo solo muestra su tipo de etiqueta.
  function filterItems(filter, items) {
    if (sourceApp === 'tapebeat' && filter.type === 'artist') {
      return items.filter((item) => item.kind === 'artist');
    }
    if (sourceApp === 'tapebeat' && filter.type === 'album') {
      return items.filter((item) => item.kind === 'album' || item.kind === 'single');
    }
    if (filter.type === 'people') {
      return items.filter((item) => item.kind === 'person');
    }
    return items;
  }

  /** Etiquetas locales (género/país): "sci" sugiere "Sci-Fi", "grunge" ya viene del backend. */
  function localMatches(filter) {
    const query = normalizeText(queries[filter.type] || '');
    if (!query || !filter.options || filter.options.length === 0) {
      return [];
    }
    return filter.options
      .filter((option) => normalizeText(option.label).includes(query)
        || normalizeText(option.value).includes(query))
      .slice(0, SUGGESTION_LIMIT);
  }

  function normalizeText(text) {
    return (text || '').trim().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Texto libre de la sección que aún no es etiqueta: se puede sumar igual. */
  function customQuery(filter, matches, suggestion) {
    const raw = (queries[filter.type] || '').trim();
    if (raw.length < 2) {
      return null;
    }
    const norm = normalizeText(raw);
    const alreadyListed = matches.some((option) => normalizeText(option.label) === norm
      || normalizeText(option.value) === norm);
    if (alreadyListed) {
      return null;
    }
    const alreadySuggested = (suggestion?.items || []).some((item) => normalizeText(item.title) === norm);
    if (alreadySuggested) {
      return null;
    }
    return raw;
  }

  function addCustomTag(filter, raw) {
    const value = (raw || '').trim();
    if (!value) {
      return;
    }
    addTag({ type: filter.type === 'people' ? 'artist' : filter.type, value, label: value });
    setQueries((current) => ({ ...current, [filter.type]: '' }));
    setSuggestions((current) => ({ ...current, [filter.type]: null }));
  }

  return (
    <Drawer.Root isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Backdrop className="drawer-backdrop">
        <Drawer.Content placement="right">
          <Drawer.Dialog className="drawer" aria-label="Explorar por etiquetas">
            <div className="drawer__head drawer__head--tags">
              <div className="drawer__head-top">
                <h2>Explorar</h2>
                <div className="drawer__head-actions">
                  {tags.length > 0 && (
                    <Button variant="ghost" className="drawer__clear" onClick={() => setTags([])}>
                      Limpiar
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="submit-review-btn"
                    size="sm"
                    disabled={tags.length === 0}
                    onClick={applyCombined}
                  >
                    Buscar
                  </Button>
                  <Button isIconOnly variant="ghost" className="icon-button" onClick={onClose} aria-label="Cerrar">
                    ✕
                  </Button>
                </div>
              </div>
              {tags.length > 0 ? (
                <div className="drawer__tags">
                  {tags.map((tag, index) => (
                    <Chip
                      key={`${tag.type}:${tag.value}`}
                      color="accent"
                      variant="primary"
                      className="drawer__tag"
                      role="button"
                      tabIndex={0}
                      aria-label={`Quitar ${tag.label}`}
                      onClick={() => removeTag(index)}
                      onKeyDown={(event) => event.key === 'Enter' && removeTag(index)}
                    >
                      {tag.label}
                      <span aria-hidden="true">✕</span>
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="drawer__hint">Sumá etiquetas y dale a Buscar.</p>
              )}
            </div>

            <div className="drawer__body">
              <section className="drawer__section">
                <button
                  type="button"
                  className={`drawer__item ${active.type === 'top' ? 'is-active' : ''}`}
                  onClick={() => applyFilter({ type: 'top', value: '' })}
                >
                  Ver inicio
                </button>
              </section>

              {filters
                .filter((filter) => filter.type !== 'top')
                .map((filter) => {
                  const suggestion = suggestions[filter.type];
                  const matches = localMatches(filter);
                  const custom = customQuery(filter, matches, suggestion);
                  return (
                    <section key={filter.type} className="drawer__section">
                      <div className="drawer__section-head">
                        <h3>{filter.label}</h3>
                      </div>
                      {SECTION_HINTS[filter.type] && (
                        <p className="drawer__hint">{SECTION_HINTS[filter.type]}</p>
                      )}

                      <form
                        className="drawer__form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          addCustomTag(filter, queries[filter.type]);
                        }}
                      >
                        <input
                          type="search"
                          name={`buscar-${filter.type}`}
                          autoComplete="off"
                          placeholder={`Buscar ${filter.label.toLowerCase()}...`}
                          value={queries[filter.type] || ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            setQueries((current) => ({ ...current, [filter.type]: value }));
                            if (suggestTypeFor(filter) !== null) {
                              requestSuggestions(filter, value);
                            }
                          }}
                          aria-label={`Buscar en ${filter.label}`}
                        />
                        <Button type="submit" className="submit-review-btn" size="sm">
                          Sumar
                        </Button>
                      </form>

                      {suggestion?.loading && (
                        <p className="drawer__hint">Buscando coincidencias...</p>
                      )}

                      {matches.length > 0 && (
                        <ul className="drawer__suggestions">
                          {matches.map((option) => (
                            <li key={option.value}>
                              <button
                                type="button"
                                onClick={() => addTag({ type: filter.type, value: option.value, label: option.label })}
                              >
                                <span>
                                  <strong>{option.label}</strong>
                                </span>
                                <span className="header-search__kind">Etiqueta</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {suggestion && !suggestion.loading && suggestion.items.length > 0 && (
                        <ul className="drawer__suggestions">
                          {suggestion.items.map((item) => (
                            <li key={item.externalId}>
                              <button type="button" onClick={() => addTag(suggestionTag(filter, item))}>
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
                                <span className="header-search__kind">Etiqueta</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {custom && (
                        <ul className="drawer__suggestions">
                          <li>
                            <button type="button" onClick={() => addCustomTag(filter, custom)}>
                              <span>
                                <strong>Usar &ldquo;{custom}&rdquo; como etiqueta</strong>
                                <small>Vale cualquier género, país, artista o título</small>
                              </span>
                              <span className="header-search__kind">Sumar</span>
                            </button>
                          </li>
                        </ul>
                      )}

                      {suggestion && !suggestion.loading && suggestion.items.length === 0
                        && matches.length === 0
                        && !custom
                        && (queries[filter.type] || '').trim().length >= 2 && (
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
