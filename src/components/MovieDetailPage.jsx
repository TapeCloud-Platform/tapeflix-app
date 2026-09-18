import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, TextField, TextArea, Input, Label } from '@heroui/react';
import {
  findContentByExternalId,
  registerContent,
  getReviews,
  createReview,
  deleteReview,
  toggleReviewLike,
  getComments,
  createComment,
  deleteComment,
} from '../api';
import StarRating from './StarRating';
import AlreadyReviewedDialog from './AlreadyReviewedDialog';
import { formatFullDate, formatYear } from '../utils/format';

export default function MovieDetailPage({ sessionUser, onLoginClick }) {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(location.state?.movie || null);
  const [contentId, setContentId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [commentsByReview, setCommentsByReview] = useState({});
  const [openCommentsFor, setOpenCommentsFor] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', rating: 5 });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showAlreadyReviewed, setShowAlreadyReviewed] = useState(false);

  const token = localStorage.getItem('tapecloud_token');
  const hasOwnReview = Boolean(
    sessionUser && reviews.some((review) => review.authorEmail === sessionUser.email)
  );

  function handleAddReviewClick() {
    if (hasOwnReview) {
      setShowAlreadyReviewed(true);
      return;
    }
    setFormOpen(true);
  }

  const loadReviews = useCallback(async (id) => {
    const data = await getReviews(id).catch(() => []);
    setReviews(data || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const item = await findContentByExternalId(movieId).catch(() => null);
        if (cancelled) {
          return;
        }

        if (item) {
          setContentId(item.id);
          if (!movie) {
            setMovie(item);
          }
          await loadReviews(item.id);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [movieId, movie, loadReviews]);

  async function handleSubmitReview(event) {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      // Las películas que vienen del descubrimiento todavía no existen como ContentItem.
      let targetId = contentId;
      if (!targetId) {
        const registered = await registerContent(token, { ...movie, externalId: movieId });
        targetId = registered.id;
        setContentId(targetId);
      }

      await createReview(targetId, token, {
        title: form.title,
        body: form.body,
        rating: form.rating,
      });
      setForm({ title: '', body: '', rating: 5 });
      setFormOpen(false);
      setFormSuccess('Reseña publicada.');
      await loadReviews(targetId);
    } catch (err) {
      setFormError(err.message || 'No se pudo publicar la reseña.');
    }
  }

  async function handleToggleLike(reviewId) {
    try {
      await toggleReviewLike(reviewId, token);
      await loadReviews(contentId);
    } catch {
      // El like es opcional; si falla no se interrumpe la vista.
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await deleteReview(reviewId, token);
      await loadReviews(contentId);
    } catch (err) {
      setFormError(err.message || 'No se pudo eliminar la reseña.');
    }
  }

  async function toggleComments(reviewId) {
    if (openCommentsFor === reviewId) {
      setOpenCommentsFor(null);
      return;
    }

    setOpenCommentsFor(reviewId);
    if (!commentsByReview[reviewId]) {
      const data = await getComments(reviewId).catch(() => []);
      setCommentsByReview((current) => ({ ...current, [reviewId]: data || [] }));
    }
  }

  async function handleSubmitComment(event, reviewId) {
    event.preventDefault();
    if (!commentDraft.trim()) {
      return;
    }

    try {
      const created = await createComment(reviewId, token, { body: commentDraft });
      setCommentsByReview((current) => ({
        ...current,
        [reviewId]: [...(current[reviewId] || []), created],
      }));
      setCommentDraft('');
      await loadReviews(contentId);
    } catch {
      // Se ignora para no bloquear la lectura de la reseña.
    }
  }

  async function handleDeleteComment(reviewId, commentId) {
    try {
      await deleteComment(commentId, token);
      setCommentsByReview((current) => ({
        ...current,
        [reviewId]: (current[reviewId] || []).filter((c) => c.id !== commentId),
      }));
      await loadReviews(contentId);
    } catch {
      // Se ignora.
    }
  }

  if (loading) {
    return (
      <main className="app-main">
        <div className="detail-page">
          <h1>Cargando...</h1>
        </div>
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="app-main">
        <div className="detail-page">
          <h1>Película no encontrada</h1>
          <button type="button" onClick={() => navigate('/catalog')}>
            Volver al catálogo
          </button>
        </div>
      </main>
    );
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const releaseDate = movie.releaseDate || movie.subtitle;
  const genres = (movie.genre || '').split(',').map((g) => g.trim()).filter(Boolean);

  return (
    <main className="app-main">
      <header className="topbar detail-topbar">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/catalog')}
          title="Volver al catálogo"
        >
          ← Catálogo
        </button>
        <div>
          <p className="eyebrow">Detalles de película</p>
          <h1>{movie.title}</h1>
        </div>
      </header>

      <section className="detail-page">
        <div
          className="movie-backdrop"
          style={movie.imageUrl ? { backgroundImage: `url(${movie.imageUrl})` } : undefined}
        >
          <div className="movie-backdrop__scrim" />

          <div className="detail-hero movie-backdrop__content">
            {movie.imageUrl && (
              <img className="detail-poster movie-poster" src={movie.imageUrl} alt={movie.title} />
            )}

            <div className="detail-info">
              {genres.length > 0 && (
                <div className="movie-genre-chips">
                  {genres.map((genre) => (
                    <span key={genre} className="movie-genre-chip">{genre}</span>
                  ))}
                </div>
              )}

              <div className="detail-stats">
                {reviews.length > 0 && (
                  <span className="stat-pill rating movie-rating-pill">
                    <StarRating value={averageRating} size="sm" />
                    {averageRating.toFixed(1)}/5 · {reviews.length} reseñas
                  </span>
                )}
                {formatFullDate(releaseDate) && (
                  <span className="stat-pill">📅 {formatFullDate(releaseDate)}</span>
                )}
                {!formatFullDate(releaseDate) && formatYear(releaseDate) && (
                  <span className="stat-pill">{formatYear(releaseDate)}</span>
                )}
              </div>

              {movie.description && (
                <div className="detail-biography">
                  <p>{movie.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-reviews-section">
          <h2>Reseñas y comentarios</h2>

          <div className="review-panel">
            <div className="review-panel__list">
              {formError && !formOpen && <p className="error-text">{formError}</p>}
              {reviews.length === 0 ? (
                <p className="no-reviews">No hay reseñas para esta película aún.</p>
              ) : (
                <div className="modal-reviews-list">
                  {reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-header">
                    <strong>{review.title}</strong>
                    <div className="modal-review-actions">
                      <StarRating value={review.rating} size="sm" />
                      {sessionUser?.email === review.authorEmail && (
                        <button
                          type="button"
                          className="delete-review-btn"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Eliminar reseña"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="review-body">{review.body}</p>
                  <small className="review-author">
                    Por: {review.authorDisplayName || review.authorEmail || 'Anónimo'}
                  </small>

                  <div className="review-interaction-bar">
                    <button
                      type="button"
                      className={`like-btn ${review.likedByCurrentUser ? 'is-liked' : ''}`}
                      onClick={() => handleToggleLike(review.id)}
                      disabled={!sessionUser}
                    >
                      ♥ {review.likesCount ?? 0}
                    </button>
                    <button
                      type="button"
                      className="comments-toggle-btn"
                      onClick={() => toggleComments(review.id)}
                    >
                      💬 {review.commentsCount ?? 0} comentarios
                    </button>
                  </div>

                  {openCommentsFor === review.id && (
                    <div className="comments-thread">
                      <div className="comments-list">
                        {(commentsByReview[review.id] || []).map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-item-header">
                              <strong>
                                {comment.authorDisplayName || comment.authorEmail || 'Anónimo'}
                              </strong>
                              {sessionUser?.email === comment.authorEmail && (
                                <button
                                  type="button"
                                  className="delete-comment-btn"
                                  onClick={() => handleDeleteComment(review.id, comment.id)}
                                  title="Eliminar comentario"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                            <p className="comment-item-body">{comment.body}</p>
                          </div>
                        ))}
                      </div>

                      {sessionUser ? (
                        <form
                          className="comment-form"
                          onSubmit={(event) => handleSubmitComment(event, review.id)}
                        >
                          <input
                            type="text"
                            placeholder="Escribí un comentario..."
                            value={commentDraft}
                            onChange={(event) => setCommentDraft(event.target.value)}
                          />
                          <button type="submit" className="submit-comment-btn">
                            Enviar
                          </button>
                        </form>
                      ) : (
                        <p className="login-notice-small">Iniciá sesión para comentar.</p>
                      )}
                    </div>
                  )}
                </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="review-panel__form">
              {!sessionUser ? (
                <div className="login-notice">
                  <span>Iniciá sesión para dejar tu reseña.</span>
                  <button type="button" className="inline-login-btn" onClick={onLoginClick}>
                    Iniciar sesión
                  </button>
                </div>
              ) : (
                <div className="review-form-card">
                  <h3>Dejá tu reseña</h3>

                  {formSuccess && <p className="success-text">{formSuccess}</p>}

                  {!formOpen ? (
                    <Button variant="primary" fullWidth onClick={handleAddReviewClick}>
                      + Agregar reseña
                    </Button>
                  ) : (
                    <form className="review-form" onSubmit={handleSubmitReview}>
                      {formError && <p className="error-text">{formError}</p>}

                      <TextField
                        className="review-field"
                        value={form.title}
                        onChange={(title) => setForm({ ...form, title })}
                        isRequired
                      >
                        <Label>Título</Label>
                        <Input placeholder="Un resumen breve" maxLength={200} />
                      </TextField>

                      <div className="review-field">
                        <span>Puntuación</span>
                        <StarRating
                          value={form.rating}
                          onChange={(rating) => setForm({ ...form, rating })}
                          size="lg"
                        />
                      </div>

                      <TextField
                        className="review-field"
                        value={form.body}
                        onChange={(body) => setForm({ ...form, body })}
                        isRequired
                      >
                        <Label>Tu opinión</Label>
                        <TextArea rows={5} maxLength={4000} placeholder="¿Qué te pareció?" />
                      </TextField>

                      <div className="review-form-actions">
                        <Button type="submit" variant="primary">
                          Publicar reseña
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setFormOpen(false);
                            setFormError('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <AlreadyReviewedDialog isOpen={showAlreadyReviewed} onClose={() => setShowAlreadyReviewed(false)} />
    </main>
  );
}
