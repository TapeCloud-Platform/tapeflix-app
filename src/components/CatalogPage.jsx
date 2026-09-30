import { Chip } from '@heroui/react';
import MovieCard from './MovieCard';
import StackedShelf from './StackedShelf';
import TopSlider from './TopSlider';
import GenreRow from './GenreRow';
import { SkeletonCatalogGrid } from './Skeleton';
import LoadingIcon from './LoadingIcon';

const HOME_GENRE_ROWS = 6;

export default function CatalogPage({
  items,
  loading,
  error,
  activeFilter,
  active,
  filters,
  onClearFilters,
}) {
  const isFiltered = active.type !== 'top';
  const activeLabel = activeFilter?.options?.find((option) => option.value === active.value)?.label
    ?? active.value;

  const movies = items.map((item) => ({
    ...item,
    id: item.externalId,
    releaseDate: item.subtitle,
  }));

  const hero = movies.slice(0, 10);
  const shelf = movies.slice(10, 26);

  const genreFilter = filters.find((filter) => filter.type === 'genre');
  const homeGenres = genreFilter?.options?.slice(0, HOME_GENRE_ROWS) ?? [];

  return (
    <main className="app-main">
      <section className="section-block">
        <div className="section-header">
          <h2>{activeFilter?.label ?? 'Contenido'}</h2>
          {!loading && <span className="count-badge">{movies.length} resultados</span>}

          {isFiltered && (
            <Chip
              color="accent"
              variant="soft"
              className="active-filter-chip"
              role="button"
              tabIndex={0}
              onClick={onClearFilters}
              onKeyDown={(event) => event.key === 'Enter' && onClearFilters()}
            >
              {activeLabel}
              <span aria-hidden="true">✕</span>
            </Chip>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <div className="catalog-loading">
            <SkeletonCatalogGrid count={10} />
            <div className="catalog-loading-icon-row">
              <LoadingIcon size={22} />
            </div>
          </div>
        ) : isFiltered ? (
          <div className="cards-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <>
            <TopSlider title="Populares ahora" movies={hero} />

            {shelf.length > 0 && (
              <div className="filmstrip-block">
                <h3 className="subsection-title">Descubrí más</h3>
                <p className="stack-shelf__hint">Pasá el mouse para desplegar el mazo</p>
                <StackedShelf movies={shelf} />
              </div>
            )}

            {homeGenres.map((genre) => (
              <GenreRow key={genre.value} genre={genre} />
            ))}
          </>
        )}
      </section>
    </main>
  );
}
