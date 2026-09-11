import { useEffect, useState, useRef } from 'react';
import { getMoviesPaginated } from '../api';

export default function CategoryModal({ genre, onClose, onMovieSelect }) {
  const [allMovies, setAllMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const scrollContainerRef = useRef(null);

  // Cargar primera página al abrir
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      setError('');
      setAllMovies([]);
      setCurrentPage(0);
      setHasReachedEnd(false);
      
      try {
        const data = await getMoviesPaginated(genre, 0, 20);
        setAllMovies(data.content || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError(err.message || 'Error al cargar películas');
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [genre]);

  // Detectar scroll al final
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setHasReachedEnd(isAtBottom && currentPage + 1 >= totalPages);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage, totalPages]);

  // Cargar 2 páginas más al clickear botón
  async function handleLoadMore() {
    if (loadingMore || currentPage + 1 >= totalPages) return;

    setLoadingMore(true);
    try {
      // Cargar página siguiente + página siguiente+1
      const nextPage = currentPage + 1;
      const [page1, page2] = await Promise.all([
        getMoviesPaginated(genre, nextPage, 20),
        nextPage + 1 < totalPages ? getMoviesPaginated(genre, nextPage + 1, 20) : Promise.resolve({ content: [] })
      ]);

      const newMovies = [...allMovies, ...(page1.content || []), ...(page2.content || [])];
      setAllMovies(newMovies);
      setCurrentPage(nextPage + 1);
      setHasReachedEnd(false);
    } catch (err) {
      setError(err.message || 'Error al cargar más películas');
    } finally {
      setLoadingMore(false);
    }
  }

  const displayGenre = genre === 'Todas' ? 'Todas las películas' : genre;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{displayGenre}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="category-movies-grid" ref={scrollContainerRef}>
          {loading ? (
            <p>Cargando películas...</p>
          ) : allMovies.length > 0 ? (
            allMovies.map((movie) => (
              <article
                key={movie.id}
                className="movie-card"
                onClick={() => {
                  onMovieSelect(movie);
                  onClose();
                }}
              >
                <div className="poster-container">
                  {movie.imageUrl ? (
                    <img className="poster-image" src={movie.imageUrl} alt={movie.title} />
                  ) : (
                    <div className="poster">{movie.title?.[0] || 'F'}</div>
                  )}
                  {movie.genre && (
                    <span className="genre-badge">{movie.genre.split(',')[0]}</span>
                  )}
                </div>
                <h3>{movie.title}</h3>
                <p className="movie-description">{movie.description}</p>
                <div className="movie-footer">
                  <small>{movie.releaseDate || 'Sin fecha'}</small>
                  {movie.genre && <span className="genre-subtag">{movie.genre}</span>}
                </div>
              </article>
            ))
          ) : (
            <p>No hay películas en esta categoría</p>
          )}

          {/* Botón "Cargar más" al final */}
          {hasReachedEnd && currentPage + 1 < totalPages && (
            <div className="load-more-container">
              <button
                type="button"
                className="load-more-button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando...' : 'Cargar más películas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
