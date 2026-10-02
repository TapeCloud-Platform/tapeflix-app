import { useEffect, useRef, useState } from 'react';
import { discover } from '../discoverApi';
import MovieCard from './MovieCard';

const SOURCE_APP = 'tapeflix';
const ROW_LIMIT = 14;
const SCROLL_STEP = 380;

/** Fila estilo Netflix con las películas de un género, cargada de forma independiente. */
export default function GenreRow({ genre }) {
  const [movies, setMovies] = useState(null);
  const trackRef = useRef(null);

  function scrollBy(amount) {
    trackRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

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
      <button
        type="button"
        className="top-slider__arrow top-slider__arrow--prev"
        onClick={() => scrollBy(-SCROLL_STEP)}
        aria-label="Anterior"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="top-slider__arrow top-slider__arrow--next"
        onClick={() => scrollBy(SCROLL_STEP)}
        aria-label="Siguiente"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="genre-row__track" ref={trackRef}>
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
