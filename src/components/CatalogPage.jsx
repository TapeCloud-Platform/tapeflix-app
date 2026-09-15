import { useState } from 'react';
import MovieCard from './MovieCard';
import CategoryModal from './CategoryModal';

export default function CatalogPage({ movies, reviews, metrics, sessionUser, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Extrae todas las categorías únicas
  const categories = ['Todas', ...Array.from(
    new Set(
      movies
        .flatMap((m) => (m.genre ? m.genre.split(',').map((g) => g.trim()) : []))
        .filter(Boolean)
    )
  ).sort()];

  // Filtra películas por categoría
  const filteredMovies = selectedCategory === 'Todas'
    ? movies
      .sort((a, b) => (b.voteAverage || b.vote_average || 0) - (a.voteAverage || a.vote_average || 0))
      .slice(0, 15)
    : movies.filter((m) => m.genre && m.genre.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">TapeFlix</p>
          <h1>Catálogo y reseñas</h1>
        </div>
        <a className="back-to-portal" href="http://localhost:5173">
          Volver al portal
        </a>
        {sessionUser && (
          <div className="session-container">
            <span className="session-badge">Sesión: {sessionUser.displayName}</span>
            <button
              type="button"
              className="logout-button-small"
              onClick={onLogout}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        )}
        <div className="metrics-box">
          <strong>{metrics?.total_reviews ?? 0}</strong>
          <span>reviews totales</span>
        </div>
      </header>

      <section className="section-block">
        <div className="section-header">
          <h2>Películas</h2>
          <span className="count-badge">{filteredMovies.length} títulos</span>
        </div>

        {/* Barra de categorías/géneros */}
        <div className="categories-bar" aria-label="Categorías de películas">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Botón "Ver más" - Solo para categorías específicas */}
        {filteredMovies.length > 0 && selectedCategory !== 'Todas' && (
          <div className="see-more-container">
            <button
              type="button"
              className="see-more-button"
              onClick={() => setCategoryModalOpen(true)}
            >
              Ver más en {selectedCategory}
            </button>
          </div>
        )}

        {/* Grid de películas */}
        <div className="cards-grid">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} reviews={reviews} />
          ))}
        </div>
      </section>

      {/* Modal de categoría */}
      {categoryModalOpen && (
        <CategoryModal
          genre={selectedCategory}
          onClose={() => setCategoryModalOpen(false)}
          onMovieSelect={() => {
            setCategoryModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
