import { useState } from 'react';

/** Drawer lateral con las categorías declaradas por el backend para cada app. */
export default function CategoryDrawer({ open, filters, active, onApply, onClose }) {
  const [queries, setQueries] = useState({});

  if (!open) {
    return null;
  }

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

    // Si coincide con una opción conocida se usa su value (TMDb usa ids numéricos).
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
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Categorías">
        <div className="drawer__head">
          <h2>Explorar</h2>
          <div className="drawer__head-actions">
            {active.type !== 'top' && (
              <button type="button" className="drawer__clear" onClick={() => apply('top', '')}>
                Limpiar filtros
              </button>
            )}
            <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
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
                    Ver ranking global
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
                    <button type="submit" className="submit-review-btn">
                      Ir
                    </button>
                  </form>
                )}

                {options.length > 0 && (
                  <div className="drawer__chips">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`category-pill ${
                          active.type === filter.type && active.value === option.value ? 'is-active' : ''
                        }`}
                        onClick={() => apply(filter.type, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
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
      </aside>
    </>
  );
}
