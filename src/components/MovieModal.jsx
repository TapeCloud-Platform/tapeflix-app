import { useState, useEffect } from 'react';
import {
  getReviews,
  createReview,
  deleteReview,
  toggleReviewLike,
  getComments,
  createComment,
  deleteComment,
} from '../api';

export default function MovieModal({ movie, onClose, sessionUser }) {
  const [activeTab, setActiveTab] = useState('details');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState('');

  // Expanded comments by reviewId
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState({});
  const [commentInputs, setCommentsInputs] = useState({});
  const [commentSubmittingMap, setCommentSubmittingMap] = useState({});

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setLoadingSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const token = localStorage.getItem('tapecloud_token');

  async function fetchMovieReviews() {
    try {
      setLoadingReviews(true);
      const data = await getReviews(movie.id);
      setReviews(data || []);
    } catch (err) {
      setReviewError(err.message || 'Error cargando las reseñas');
    } finally {
      setLoadingReviews(false);
    }
  }

  useEffect(() => {
    if (movie) {
      fetchMovieReviews();
    }
  }, [movie]);

  async function handleSubmitReview(event) {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!token) {
      setFormError('Debes iniciar sesión para publicar una reseña.');
      return;
    }

    setLoadingSubmitting(true);
    try {
      await createReview(movie.id, token, { title, body, rating: Number(rating) });
      setFormSuccess('¡Reseña publicada con éxito!');
      setTitle('');
      setBody('');
      setRating(5);
      await fetchMovieReviews();
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar la reseña.');
    } finally {
      setLoadingSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!token) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta reseña?')) return;

    try {
      await deleteReview(reviewId, token);
      await fetchMovieReviews();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  }

  async function handleToggleLike(reviewId) {
    if (!token) {
      alert('Debes iniciar sesión para darle me gusta a una reseña.');
      return;
    }

    try {
      const updatedReview = await toggleReviewLike(reviewId, token);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...updatedReview } : r))
      );
    } catch (err) {
      alert(err.message || 'Error al dar me gusta');
    }
  }

  async function fetchCommentsForReview(reviewId) {
    try {
      setLoadingCommentsMap((prev) => ({ ...prev, [reviewId]: true }));
      const data = await getComments(reviewId);
      setCommentsMap((prev) => ({ ...prev, [reviewId]: data || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommentsMap((prev) => ({ ...prev, [reviewId]: false }));
    }
  }

  function toggleCommentsExpand(reviewId) {
    const isExpanded = !!expandedComments[reviewId];
    setExpandedComments((prev) => ({ ...prev, [reviewId]: !isExpanded }));
    if (!isExpanded && !commentsMap[reviewId]) {
      fetchCommentsForReview(reviewId);
    }
  }

  async function handleAddComment(event, reviewId) {
    event.preventDefault();
    const text = commentInputs[reviewId]?.trim();
    if (!text) return;

    if (!token) {
      alert('Debes iniciar sesión para publicar un comentario.');
      return;
    }

    setCommentSubmittingMap((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await createComment(reviewId, token, { body: text });
      setCommentsInputs((prev) => ({ ...prev, [reviewId]: '' }));
      await fetchCommentsForReview(reviewId);
      // Increment comment count locally on review
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r))
      );
    } catch (err) {
      alert(err.message || 'Error al comentar');
    } finally {
      setCommentSubmittingMap((prev) => ({ ...prev, [reviewId]: false }));
    }
  }

  async function handleDeleteComment(commentId, reviewId) {
    if (!token) return;
    if (!window.confirm('¿Eliminar este comentario?')) return;

    try {
      await deleteComment(commentId, token);
      await fetchCommentsForReview(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, commentsCount: Math.max(0, (r.commentsCount || 1) - 1) } : r
        )
      );
    } catch (err) {
      alert(err.message || 'Error al eliminar comentario');
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-button" onClick={onClose}>
          ✕
        </button>

        <div className="modal-movie-header">
          {movie.imageUrl ? (
            <img className="modal-movie-poster" src={movie.imageUrl} alt={movie.title} />
          ) : (
            <div className="modal-movie-poster-fallback">{movie.title?.[0] || 'F'}</div>
          )}

          <div className="modal-movie-info">
            <span className="modal-genre">{movie.genre || 'Película'}</span>
            <h2>{movie.title}</h2>
            <p className="modal-release">Estreno: {movie.releaseDate || 'Sin fecha'}</p>
            {averageRating ? (
              <div className="modal-rating-summary">
                <span className="summary-stars">⭐ {averageRating} / 5</span>
                <span className="summary-count">({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})</span>
              </div>
            ) : (
              <p className="modal-no-rating">Sin puntuaciones aún</p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'details' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Detalles y Sinopsis
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'reviews' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            💬 Reseñas y Opiniones ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="tab-content tab-details">
            <h3>Sinopsis</h3>
            <p className="modal-description-full">{movie.description || 'Sin información o sinopsis disponible para este título.'}</p>

            <div className="details-metadata">
              <div className="meta-item">
                <span>Género(s)</span>
                <strong>{movie.genre || 'No especificado'}</strong>
              </div>
              <div className="meta-item">
                <span>Fecha de estreno</span>
                <strong>{movie.releaseDate || 'Desconocida'}</strong>
              </div>
              <div className="meta-item">
                <span>Origen</span>
                <strong>TMDB (TapeFlix Catalog)</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div className="tab-content tab-reviews">
            <div className="reviews-section-header">
              <h3>Escribir una reseña</h3>
            </div>

            {sessionUser ? (
              <form className="review-form" onSubmit={handleSubmitReview}>
                <div className="review-form-row">
                  <label className="review-field flex-1">
                    Título de tu reseña
                    <input
                      type="text"
                      placeholder="Ej: ¡Increíble película!"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </label>

                  <label className="review-field width-auto">
                    Puntuación
                    <select value={rating} onChange={(e) => setRating(e.target.value)}>
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </label>
                </div>

                <label className="review-field">
                  Tu opinión / Reseña
                  <textarea
                    rows={3}
                    placeholder="Escribe lo que opinas sobre esta película..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </label>

                {formError && <p className="error-text">{formError}</p>}
                {formSuccess && <p className="success-text">{formSuccess}</p>}

                <button type="submit" className="submit-review-btn" disabled={submitting}>
                  {submitting ? 'Publicando...' : 'Publicar Reseña'}
                </button>
              </form>
            ) : (
              <div className="login-notice flex-between">
                <span>🔒 Inicia sesión para publicar tu reseña o interactuar con la comunidad.</span>
                <a className="inline-login-btn" href="http://localhost:5173?view=login">
                  Iniciar sesión
                </a>
              </div>
            )}

            <h3 className="reviews-title-list">Reseñas de la comunidad ({reviews.length})</h3>

            {loadingReviews ? (
              <p className="loading-text">Cargando reseñas...</p>
            ) : reviewError ? (
              <p className="error-text">{reviewError}</p>
            ) : reviews.length === 0 ? (
              <p className="empty-reviews-text">Aún no hay reseñas para esta película. ¡Sé el primero en dejar una!</p>
            ) : (
              <div className="modal-reviews-list">
                {reviews.map((rev) => (
                  <article key={rev.id} className="modal-review-card">
                    <div className="modal-review-header">
                      <div>
                        <strong>{rev.authorDisplayName}</strong>
                        <span className="modal-review-date">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="modal-review-actions">
                        <span className="modal-review-rating">{'⭐'.repeat(rev.rating)}</span>
                        {sessionUser && (sessionUser.email === rev.authorEmail) && (
                          <button
                            type="button"
                            className="delete-review-btn"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Eliminar mi reseña"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <h4>{rev.title}</h4>
                    <p>{rev.body}</p>

                    {/* Likes & Comments Bar */}
                    <div className="review-interaction-bar">
                      <button
                        type="button"
                        className={`like-btn ${rev.likedByCurrentUser ? 'is-liked' : ''}`}
                        onClick={() => handleToggleLike(rev.id)}
                        title={rev.likedByCurrentUser ? 'Quitar me gusta' : 'Dar me gusta'}
                      >
                        {rev.likedByCurrentUser ? '❤️' : '🤍'} {rev.likesCount || 0}
                      </button>

                      <button
                        type="button"
                        className="comments-toggle-btn"
                        onClick={() => toggleCommentsExpand(rev.id)}
                      >
                        💬 Comentarios ({rev.commentsCount || 0})
                      </button>
                    </div>

                    {/* Expanded Comments Thread */}
                    {expandedComments[rev.id] && (
                      <div className="comments-thread">
                        {loadingCommentsMap[rev.id] ? (
                          <p className="loading-text">Cargando comentarios...</p>
                        ) : (
                          <>
                            <div className="comments-list">
                              {(commentsMap[rev.id] || []).length === 0 ? (
                                <p className="empty-reviews-text">Aún no hay comentarios. ¡Comenta primero!</p>
                              ) : (
                                (commentsMap[rev.id] || []).map((cmt) => (
                                  <div key={cmt.id} className="comment-item">
                                    <div className="comment-item-header">
                                      <strong>{cmt.authorDisplayName}</strong>
                                      <span>{new Date(cmt.createdAt).toLocaleDateString()}</span>
                                      {sessionUser && sessionUser.email === cmt.authorEmail && (
                                        <button
                                          type="button"
                                          className="delete-comment-btn"
                                          onClick={() => handleDeleteComment(cmt.id, rev.id)}
                                          title="Eliminar comentario"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                    <p className="comment-item-body">{cmt.body}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Comment Form (NO rating, text body only) */}
                            {sessionUser ? (
                              <form
                                className="comment-form"
                                onSubmit={(e) => handleAddComment(e, rev.id)}
                              >
                                <input
                                  type="text"
                                  placeholder="Escribe un comentario..."
                                  value={commentInputs[rev.id] || ''}
                                  onChange={(e) =>
                                    setCommentsInputs((prev) => ({
                                      ...prev,
                                      [rev.id]: e.target.value,
                                    }))
                                  }
                                  required
                                />
                                <button
                                  type="submit"
                                  className="submit-comment-btn"
                                  disabled={commentSubmittingMap[rev.id]}
                                >
                                  {commentSubmittingMap[rev.id] ? '...' : 'Enviar'}
                                </button>
                              </form>
                            ) : (
                              <div className="login-notice-small flex-between">
                                <span>Inicia sesión para responder a esta reseña.</span>
                                <a className="inline-login-btn-small" href="http://localhost:5173?view=login">
                                  Iniciar sesión
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


