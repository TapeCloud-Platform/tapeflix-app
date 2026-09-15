import MovieCard from './MovieCard';

export default function CatalogPage({
  items,
  reviews,
  loading,
  error,
  activeFilter,
  active,
  onClearFilters,
}) {
  const isFiltered = active.type !== 'top';
  const activeLabel = activeFilter?.options?.find((option) => option.value === active.value)?.label
    ?? active.value;

  // MovieCard y la ruta de detalle esperan la forma del catálogo, no la del discovery.
  const movies = items.map((item) => ({
    ...item,
    id: item.externalId,
    releaseDate: item.subtitle,
  }));

  return (
    <main className="app-main">
      <section className="section-block">
        <div className="section-header">
          <h2>{activeFilter?.label ?? 'Contenido'}</h2>
          {!loading && <span className="count-badge">{movies.length} resultados</span>}

          {isFiltered && (
            <button type="button" className="active-filter-chip" onClick={onClearFilters}>
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
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} reviews={reviews} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
