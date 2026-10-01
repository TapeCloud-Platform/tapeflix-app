import { useState } from 'react';
import { Drawer, Button, Chip } from '@heroui/react';

const SECTION_HINTS = {
  top: 'Lo más popular ahora.',
  genre: 'Filtrá por género musical o cinematográfico.',
  country: 'Filtrá por país de origen.',
  artist: 'Buscá un actor, director o artista. Acepta texto libre.',
  people: 'Buscá actores y directores por nombre.',
  album: 'Buscá un álbum por título. Acepta texto libre.',
  search: 'Búsqueda libre por título.',
};

/** Drawer lateral izquierdo con las categorías declaradas por el backend para cada app. */
export default function CategoryDrawer({ open, filters, active, onApply, onClose }) {
  const [queries, setQueries] = useState({});

  function apply(type, value) {
    onApply({ type, value });
    onClose();
  }

  function submitQuery(event, filter) {
    event.preventDefault();
    const raw = (queries[filter.type] || '').trim();
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
        <Drawer.Content placement="left">
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
                const searchable = filter.options.length > 0 || filter.freeText;

                return (
                  <section key={filter.type} className="drawer__section">
                    <div className="drawer__section-head">
                      <h3>{filter.label}</h3>
                      {filter.options.length > 0 && (
                        <span className="drawer__count">{filter.options.length}</span>
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

                    {searchable && filter.type !== 'top' && (
                      <form className="drawer__form" onSubmit={(event) => submitQuery(event, filter)}>
                        <input
                          type="search"
                          placeholder={
                            filter.freeText
                              ? `Buscar ${filter.label.toLowerCase()}...`
                              : `Filtrar ${filter.label.toLowerCase()}...`
                          }
                          value={queries[filter.type] || ''}
                          onChange={(event) =>
                            setQueries((current) => ({ ...current, [filter.type]: event.target.value }))
                          }
                          aria-label={`Buscar en ${filter.label}`}
                        />
                        <Button type="submit" className="submit-review-btn" size="sm">
                          Ir
                        </Button>
                      </form>
                    )}

                    {options.length > 0 && (
                      <div className="drawer__chips">
                        {options.map((option) => {
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

                    {filter.options.length > 0 && options.length === 0 && (
                      <p className="drawer__empty">
                        {filter.freeText
                          ? 'Sin coincidencias. Presioná "Ir" para buscarlo igual.'
                          : 'Sin coincidencias.'}
                      </p>
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
