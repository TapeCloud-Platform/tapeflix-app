import { useEffect, useState } from 'react';
import { discover } from '../discoverApi';
import MovieCard from './MovieCard';

const SOURCE_APP = 'tapeflix';
const ROW_LIMIT = 14;

/** Fila estilo Netflix con las películas de un género, cargada de forma independiente. */
export default function GenreRow({ genre }) {
  const [movies, setMovies] = useState(null);

  useEffect(() => {
    let cancelled = false;
    discover(SOURCE_APP, { type: 'genre', value: genre.value, limit: ROW_LIMIT })
      .then((data) => {
        if (!cancelled) {
          setMovies((data || []).map((item) => ({ ...item, id: item.externalId, releaseDate: item.subtitle })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMovies([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [genre.value]);

  if (movies?.length === 0) {
    return null;
  }

  return (
    <div className="genre-row">
      <h3 className="subsection-title">{genre.label}</h3>
      <div className="genre-row__track">
        {movies === null
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="genre-row__skeleton" />
            ))
          : movies.map((movie) => (
              <div key={movie.id} className="genre-row__item">
                <MovieCard movie={movie} variant="row" />
              </div>
            ))}
      </div>
    </div>
  );
}
