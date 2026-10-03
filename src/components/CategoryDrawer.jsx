import { useEffect, useRef, useState } from 'react';
import { Drawer, Button, Chip } from '@heroui/react';
import { discover } from '../discoverApi';

const SUGGESTION_LIMIT = 6;
const SUGGESTION_DEBOUNCE_MS = 300;

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
    return { type: filter.type, value: item.title, label: item.title };
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

  /** Etiquetas locales (género/país): "sci" sugiere "Sci-Fi", etc. */
  function localMatches(filter) {
    const query = (queries[filter.type] || '').trim().toLowerCase();
    if (!query || filter.options.length === 0) {
      return [];
    }
    return filter.options
      .filter((option) => option.label.toLowerCase().includes(query))
      .slice(0, SUGGESTION_LIMIT);
  }

  return (
    <Drawer.Root isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Backdrop className="drawer-backdrop">
        <Drawer.Content placement="right">
          <Drawer.Dialog className="drawer" aria-label="Explorar por etiquetas">
            <div className="drawer__head">
              <div>
                <h2>Explorar</h2>
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
                  Buscar{tags.length > 0 ? ` (${tags.length})` : ''}
                </Button>
                <Button isIconOnly variant="ghost" className="icon-button" onClick={onClose} aria-label="Cerrar">
                  ✕
                </Button>
              </div>
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
                          if (filter.freeText) {
                            const raw = (queries[filter.type] || '').trim();
                            if (raw) {
                              addTag({ type: filter.type === 'people' ? 'artist' : filter.type, value: raw, label: raw });
                            }
                          }
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
                            if (filter.freeText) {
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

                      {suggestion && !suggestion.loading && suggestion.items.length === 0
                        && matches.length === 0
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
