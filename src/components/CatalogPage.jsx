import { Chip } from '@heroui/react';
import MovieCard from './MovieCard';
import StackedShelf from './StackedShelf';
import TopSlider from './TopSlider';
import GenreRow from './GenreRow';
import { SkeletonCatalogGrid, SkeletonCatalogHome } from './Skeleton';

const HOME_GENRE_ROWS = 6;

export default function CatalogPage({
  items,
  loading,
  error,
  activeFilter,
  active,
  filters,
  activeLabel,
  onClearFilters,
}) {
  const isFiltered = active.type !== 'top';
  const activeLabelText = activeLabel
    ?? activeFilter?.options?.find((option) => option.value === active.value)?.label
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
          <h2>{active.type === 'combined' ? 'Resultados' : (activeFilter?.label ?? 'Contenido')}</h2>
          {isFiltered && !loading && <span className="count-badge">{movies.length} resultados</span>}

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
              {activeLabelText}
              <span aria-hidden="true">✕</span>
            </Chip>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        {loading ? (
          isFiltered ? (
            <SkeletonCatalogGrid count={10} />
          ) : (
            <SkeletonCatalogHome />
          )
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
