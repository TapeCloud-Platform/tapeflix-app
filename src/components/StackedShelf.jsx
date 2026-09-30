import { useNavigate } from 'react-router-dom';

/** Mazo de pósters apilados que se abanican hacia la derecha al pasar el mouse. */
export default function StackedShelf({ movies }) {
  const navigate = useNavigate();

  if (movies.length === 0) {
    return null;
  }

  function open(movie) {
    navigate(`/movie/${encodeURIComponent(movie.id)}`, { state: { movie } });
  }

  return (
    <div className="stack-shelf">
      <div className="stack-shelf__track">
        {movies.map((movie) => (
          <button
            key={movie.id}
            type="button"
            className="stack-shelf__item"
            onClick={() => open(movie)}
            title={movie.title}
          >
            {movie.imageUrl ? (
              <img src={movie.imageUrl} alt="" />
            ) : (
              <span className="stack-shelf__fallback">{movie.title?.[0] || '🎬'}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
