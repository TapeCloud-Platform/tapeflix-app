import { useEffect, useState } from 'react';
import { Button, TextField, TextArea, Input, Label } from '@heroui/react';
import {
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

/**
 * Reseñas + comentarios de un ContentItem. Si `contentId` es null (el contenido
 * todavía no fue registrado, ej. algo recién descubierto), la primera reseña
 * dispara `onRegister()` para crearlo antes de publicar.
 */
export default function ReviewPanel({ contentId, onRegister, sessionUser, onLoginClick, emptyMessage, onStatsChange }) {
  const [reviews, setReviews] = useState([]);
  const [commentsByReview, setCommentsByReview] = useState({});
  const [openCommentsFor, setOpenCommentsFor] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', rating: 5, isSpoiler: false });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showAlreadyReviewed, setShowAlreadyReviewed] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const token = localStorage.getItem('tapecloud_token');
  const hasOwnReview = Boolean(sessionUser && reviews.some((review) => review.ownedByCurrentUser));

  useEffect(() => {
    let cancelled = false;

    if (!contentId) {
      setReviews([]);
      return undefined;
    }

    getReviews(contentId)
      .then((data) => {
        if (!cancelled) {
          setReviews(data || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  async function reload(id) {
    const data = await getReviews(id).catch(() => []);
    setReviews(data || []);
  }

  useEffect(() => {
    onStatsChange?.({
      count: reviews.length,
      average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null,
      yourRating: reviews.find((review) => review.ownedByCurrentUser)?.rating ?? null,
      distribution: [1, 2, 3, 4, 5].map(
        (star) => reviews.filter((review) => Math.round(review.rating) === star).length
      ),
    });
    // Solo debe reportar cuando cambian las reseñas, no cuando cambia la identidad de onStatsChange.
  }, [reviews]);

  function handleAddReviewClick() {
    if (!sessionUser) {
      onLoginClick?.();
      return;
    }
    if (hasOwnReview) {
      setShowAlreadyReviewed(true);
      return;
    }
    setFormOpen(true);
  }

  async function handleSubmitReview(event) {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const targetId = contentId || (await onRegister());

      await createReview(targetId, token, {
        title: form.title,
        body: form.body,
        rating: form.rating,
        isSpoiler: form.isSpoiler,
      });
      setForm({ title: '', body: '', rating: 5, isSpoiler: false });
      setFormOpen(false);
      setFormSuccess('Reseña publicada.');
      await reload(targetId);
    } catch (err) {
      setFormError(err.message || 'No se pudo publicar la reseña.');
    }
  }

  async function handleToggleLike(reviewId) {
    try {
      await toggleReviewLike(reviewId, token);
      await reload(contentId);
    } catch {
      // El like es opcional; si falla no se interrumpe la vista.
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await deleteReview(reviewId, token);
      await reload(contentId);
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
      await reload(contentId);
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
      await reload(contentId);
    } catch {
      // Se ignora.
    }
  }

  return (
    <div className="review-panel">
      <div className="review-panel__list">
        {formError && !formOpen && <p className="error-text">{formError}</p>}
        {reviews.length === 0 ? (
          <p className="no-reviews">{emptyMessage}</p>
        ) : (
          <div className="modal-reviews-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-header">
                  <strong>
                    {review.title}
                    {review.isSpoiler && <span className="spoiler-badge">Spoiler</span>}
                  </strong>
                  <div className="modal-review-actions">
                    <span className="review-rating">⭐ {Number(review.rating).toFixed(1)}/5</span>
                    {review.ownedByCurrentUser && (
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

                <p className={review.isSpoiler && !revealedSpoilers[review.id] ? 'review-body review-body--spoiler is-blurred' : 'review-body'}>{review.body}</p>
                {review.isSpoiler && (
                  <button
                    type="button"
                    className="spoiler-reveal-btn"
                    onClick={() => setRevealedSpoilers((current) => ({ ...current, [review.id]: !current[review.id] }))}
                  >
                    {revealedSpoilers[review.id] ? 'Ocultar spoiler' : 'Mostrar spoiler'}
                  </button>
                )}
                <small className="review-author">Por: {review.authorDisplayName || 'Anónimo'}</small>

                <div className="review-interaction-bar">
                  <button
                    type="button"
                    className={`like-btn ${review.likedByCurrentUser ? 'is-liked' : ''}`}
                    onClick={() => handleToggleLike(review.id)}
                    disabled={!sessionUser}
                  >
                    ♥ {review.likesCount ?? 0}
                  </button>
                  <button type="button" className="comments-toggle-btn" onClick={() => toggleComments(review.id)}>
                    💬 {review.commentsCount ?? 0} comentarios
                  </button>
                </div>

                {openCommentsFor === review.id && (
                  <div className="comments-thread">
                    <div className="comments-list">
                      {(commentsByReview[review.id] || []).map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-item-header">
                            <strong>{comment.authorDisplayName || 'Anónimo'}</strong>
                            {comment.ownedByCurrentUser && (
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
                      <form className="comment-form" onSubmit={(event) => handleSubmitComment(event, review.id)}>
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
                  <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} size="lg" />
                </div>

                <div className="review-field">
                  <label className="review-spoiler-check">
                    <input
                      type="checkbox"
                      checked={form.isSpoiler}
                      onChange={(event) => setForm({ ...form, isSpoiler: event.target.checked })}
                    />
                    <span>Contiene spoilers</span>
                  </label>
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

      <AlreadyReviewedDialog isOpen={showAlreadyReviewed} onClose={() => setShowAlreadyReviewed(false)} />
    </div>
  );
}
