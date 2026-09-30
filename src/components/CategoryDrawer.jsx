import { useState } from 'react';
import { Drawer, Button, Chip } from '@heroui/react';

/** Drawer lateral con las categorías declaradas por el backend para cada app. */
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

  return (
    <Drawer.Root isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Backdrop className="drawer-backdrop">
        <Drawer.Content placement="right">
          <Drawer.Dialog className="drawer" aria-label="Categorías">
            <div className="drawer__head">
              <h2>Explorar</h2>
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
              {filters.map((filter) => {
                const options = visibleOptions(filter);
                const searchable = filter.options.length > 0 || filter.freeText;

                return (
                  <section key={filter.type} className="drawer__section">
                    <h3>{filter.label}</h3>

                    {filter.type === 'top' && (
                      <button
                        type="button"
                        className={`drawer__item ${active.type === 'top' ? 'is-active' : ''}`}
                        onClick={() => apply('top', '')}
                      >
                        Ver populares
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
