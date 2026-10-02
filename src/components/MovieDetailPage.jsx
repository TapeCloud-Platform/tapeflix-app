import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, TextField, TextArea, Input, Label } from '@heroui/react';
import {
  findContentByExternalId,
  registerContent,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewLike,
  getComments,
  createComment,
  deleteComment,
} from '../api';
import StarRating from './StarRating';
import AlreadyReviewedDialog from './AlreadyReviewedDialog';
import ConfirmDialog from './ConfirmDialog';
import { PencilIcon, TrashIcon } from './icons';
import { formatFullDate, formatYear } from '../utils/format';
import { findProfanity } from '../utils/profanity';
import {
  REVIEW_TITLE_MAX,
  REVIEW_BODY_MAX,
  REVIEW_EDIT_COOLDOWN_SECONDS,
  editCooldownRemaining,
  parseCooldownFromMessage,
} from '../utils/reviewLimits';

const PROFANITY_WARNING = 'Tu texto contiene lenguaje no permitido. Revisá tu texto y probá de nuevo.';

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
  const [commentError, setCommentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', rating: 5, isSpoiler: false });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showAlreadyReviewed, setShowAlreadyReviewed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', rating: 5, isSpoiler: false });
  const [editError, setEditError] = useState('');
  const [editCooldown, setEditCooldown] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const token = localStorage.getItem('tapecloud_token');
  const hasOwnReview = Boolean(sessionUser && reviews.some((review) => review.ownedByCurrentUser));

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

  // Cuenta regresiva del cooldown de edición (30s entre ediciones).
  useEffect(() => {
    if (!editingId) {
      setEditCooldown(0);
      return undefined;
    }
    const review = reviews.find((item) => item.id === editingId);
    setEditCooldown(editCooldownRemaining(review?.lastEditedAt));
    const timer = setInterval(() => {
      const current = reviews.find((item) => item.id === editingId);
      setEditCooldown(editCooldownRemaining(current?.lastEditedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [editingId, reviews]);

  async function handleSubmitReview(event) {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (findProfanity(form.title) || findProfanity(form.body)) {
      setFormError(PROFANITY_WARNING);
      return;
    }

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
        isSpoiler: form.isSpoiler,
      });
      setForm({ title: '', body: '', rating: 5, isSpoiler: false });
      setFormOpen(false);
      setFormSuccess('Reseña publicada.');
      await loadReviews(targetId);
    } catch (err) {
      setFormError(err.message || 'No se pudo publicar la reseña.');
    }
  }

  function handleStartEdit(review) {
    setEditError('');
    setEditingId(review.id);
    setEditForm({
      title: review.title || '',
      body: review.body || '',
      rating: review.rating ?? 5,
      isSpoiler: Boolean(review.isSpoiler),
    });
  }

  async function handleSubmitEdit(event) {
    event.preventDefault();
    setEditError('');

    if (findProfanity(editForm.title) || findProfanity(editForm.body)) {
      setEditError(PROFANITY_WARNING);
      return;
    }

    try {
      await updateReview(editingId, token, {
        title: editForm.title,
        body: editForm.body,
        rating: editForm.rating,
        isSpoiler: editForm.isSpoiler,
      });
      setEditingId(null);
      setFormSuccess('Reseña actualizada.');
      await loadReviews(contentId);
    } catch (err) {
      if (err.status === 429) {
        const wait = parseCooldownFromMessage(err.message);
        if (wait !== null) {
          // Tope de seguridad: el conteo nunca supera el cooldown local.
          setEditCooldown(Math.min(wait, REVIEW_EDIT_COOLDOWN_SECONDS));
        }
      }
      setEditError(err.message || 'No se pudo actualizar la reseña.');
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

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    try {
      if (pendingDelete.kind === 'review') {
        await deleteReview(pendingDelete.id, token);
        if (editingId === pendingDelete.id) {
          setEditingId(null);
        }
        await loadReviews(contentId);
      } else {
        await deleteComment(pendingDelete.id, token);
        setCommentsByReview((current) => ({
          ...current,
          [pendingDelete.reviewId]: (current[pendingDelete.reviewId] || []).filter((c) => c.id !== pendingDelete.id),
        }));
        await loadReviews(contentId);
      }
    } catch (err) {
      setFormError(err.message || 'No se pudo eliminar.');
    } finally {
      setPendingDelete(null);
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
    setCommentError('');
    if (findProfanity(commentDraft)) {
      setCommentError(PROFANITY_WARNING);
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
    } catch (err) {
      setCommentError(err.message || 'No se pudo publicar el comentario.');
    }
  }

  function toggleSpoilerReveal(reviewId) {
    setRevealedSpoilers((current) => ({ ...current, [reviewId]: !current[reviewId] }));
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
              {formSuccess && !formOpen && !editingId && <p className="success-text">{formSuccess}</p>}
              {reviews.length === 0 ? (
                <p className="no-reviews">No hay reseñas para esta película aún.</p>
              ) : (
                <div className="modal-reviews-list">
                  {reviews.map((review) => {
                    const isSpoilerHidden = Boolean(review.isSpoiler) && !revealedSpoilers[review.id];
                    return (
                <article key={review.id} className="review-card">
                  <div className="review-header">
                    <strong>{review.title}</strong>
                    <div className="modal-review-actions">
                      <StarRating value={review.rating} size="sm" />
                      {review.ownedByCurrentUser && editingId !== review.id && (
                        <>
                          <button
                            type="button"
                            className="edit-review-btn"
                            onClick={() => handleStartEdit(review)}
                            title="Editar reseña"
                          >
                            <PencilIcon size={15} />
                          </button>
                          <button
                            type="button"
                            className="delete-review-btn"
                            onClick={() => setPendingDelete({ kind: 'review', id: review.id })}
                            title="Eliminar reseña"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {review.isSpoiler && (
                    <p className="spoiler-badge">⚠️ Contiene spoiler</p>
                  )}

                  {editingId === review.id ? (
                    <form className="review-form review-form--edit" onSubmit={handleSubmitEdit}>
                      {editError && <p className="error-text">{editError}</p>}
                      {editCooldown > 0 && (
                        <p className="error-text">
                          Podés volver a editar en {editCooldown} segundo{editCooldown === 1 ? '' : 's'}.
                        </p>
                      )}

                      <TextField
                        className="review-field"
                        value={editForm.title}
                        onChange={(title) => setEditForm({ ...editForm, title })}
                        isRequired
                      >
                        <Label>Título</Label>
                        <Input placeholder="Un resumen breve" maxLength={REVIEW_TITLE_MAX} />
                      </TextField>
                      <small className="char-count">
                        {editForm.title.length}/{REVIEW_TITLE_MAX}
                      </small>

                      <div className="review-field">
                        <span>Puntuación</span>
                        <StarRating
                          value={editForm.rating}
                          onChange={(rating) => setEditForm({ ...editForm, rating })}
                          size="lg"
                        />
                      </div>

                      <TextField
                        className="review-field"
                        value={editForm.body}
                        onChange={(body) => setEditForm({ ...editForm, body })}
                        isRequired
                      >
                        <Label>Tu opinión</Label>
                        <TextArea rows={5} maxLength={REVIEW_BODY_MAX} placeholder="¿Qué te pareció?" />
                      </TextField>
                      <small className="char-count">
                        {editForm.body.length}/{REVIEW_BODY_MAX}
                      </small>

                      <label className="spoiler-checkbox">
                        <input
                          type="checkbox"
                          checked={editForm.isSpoiler}
                          onChange={(event) => setEditForm({ ...editForm, isSpoiler: event.target.checked })}
                        />
                        Contiene spoiler
                      </label>

                      <div className="review-form-actions">
                        <Button type="submit" variant="primary" isDisabled={editCooldown > 0}>
                          Guardar cambios
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditError('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : isSpoilerHidden ? (
                    <div className="spoiler-hidden">
                      <p className="review-body" style={{ filter: 'blur(5px)', userSelect: 'none' }} aria-hidden="true">
                        {review.body}
                      </p>
                      <button
                        type="button"
                        className="spoiler-reveal-btn"
                        onClick={() => toggleSpoilerReveal(review.id)}
                      >
                        Mostrar spoiler
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="review-body">{review.body}</p>
                      {review.isSpoiler && revealedSpoilers[review.id] && (
                        <button
                          type="button"
                          className="spoiler-reveal-btn"
                          onClick={() => toggleSpoilerReveal(review.id)}
                        >
                          Ocultar spoiler
                        </button>
                      )}
                    </>
                  )}
                  <small className="review-author">
                    Por: {review.authorDisplayName || 'Anónimo'}
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
                                {comment.authorDisplayName || 'Anónimo'}
                              </strong>
                              {comment.ownedByCurrentUser && (
                                <button
                                  type="button"
                                  className="delete-comment-btn"
                                  onClick={() => setPendingDelete({ kind: 'comment', reviewId: review.id, id: comment.id })}
                                  title="Eliminar comentario"
                                >
                                  <TrashIcon size={15} />
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
                          {commentError && <p className="error-text">{commentError}</p>}
                        </form>
                      ) : (
                        <p className="login-notice-small">Iniciá sesión para comentar.</p>
                      )}
                    </div>
                  )}
                </article>
                    );
                  })}
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
                        <Input placeholder="Un resumen breve" maxLength={REVIEW_TITLE_MAX} />
                      </TextField>
                      <small className="char-count">
                        {form.title.length}/{REVIEW_TITLE_MAX}
                      </small>

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
                        <TextArea rows={5} maxLength={REVIEW_BODY_MAX} placeholder="¿Qué te pareció?" />
                      </TextField>
                      <small className="char-count">
                        {form.body.length}/{REVIEW_BODY_MAX}
                      </small>

                      <label className="spoiler-checkbox">
                        <input
                          type="checkbox"
                          checked={form.isSpoiler}
                          onChange={(event) => setForm({ ...form, isSpoiler: event.target.checked })}
                        />
                        Contiene spoiler
                      </label>

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

      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.kind === 'review' ? 'Eliminar reseña' : 'Eliminar comentario'}
          message="¿Seguro que querés hacer esto? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}

