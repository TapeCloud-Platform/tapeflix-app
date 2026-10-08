import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discover, getProfile } from '../discoverApi';
import { findContentByExternalId, getReviews, registerContent } from '../api';
import { SkeletonPersonDetail } from './Skeleton';
import ReviewPanel from './ReviewPanel';
import { LockIcon } from './icons';

const RELEASE_TABS = [
  { value: 'movie', label: 'Películas' },
  { value: 'TV', label: 'Series' },
  { value: 'other', label: 'Otro' },
];

const TOP_MOVIES_LIMIT = 8;
const SIMILAR_PERSONS_LIMIT = 5;
const INITIAL_LOAD_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function getKnownForDepartment(department) {
  const map = {
    Acting: 'Actor/Actriz',
    Crew: 'Director/Escritor/Producer',
    Documentary: 'Documental',
    News: 'Noticias',
    Reality: 'Reality Show',
    Video: 'Video'
  };
  return map[department] || department;
}

export default function PersonDetailPage({ sessionUser, onLoginClick }) {
  const { personName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(personName);

  const [profile, setProfile] = useState(null);
  const [movies, setMovies] = useState([]);
  const [similarPersons, setSimilarPersons] = useState([]);
  const [tab, setTab] = useState('home');
  const [movieTab, setMovieTab] = useState('movie');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [personContentId, setPersonContentId] = useState(null);
  const [personStats, setPersonStats] = useState({ count: 0, average: null, yourRating: null });
  const [loadedCount, setLoadedCount] = useState(0);

  const token = localStorage.getItem('tapecloud_token');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        setTab('home');

        const [profileData, movieData, personItems] = await Promise.all([
          getProfile('tapeflix', decodedName),
          discover('tapeflix', { type: 'top', value: decodedName, limit: INITIAL_LOAD_LIMIT }),
          discover('tapeflix', { type: 'artist', value: decodedName, limit: 24 }),
        ]);
        if (cancelled) {
          return;
        }

        setProfile(profileData);
        setMovies(movieData || []);

        const content = await findContentByExternalId(decodedName, 'person').catch(() => null);
        if (!cancelled) {
          setPersonContentId(content?.id ?? null);
        }

        // Filtrar items de tipo persona/artist para obtener películas/series
        const personMovies = (personItems || [])
          .filter((item) => item.kind === 'movie' || item.kind === 'TV')
          .slice(0, TOP_MOVIES_LIMIT);

        // Cargar reseñas para cada película
        const withReviews = await Promise.all(
          personMovies.map(async (movie) => {
            try {
              const contentItem = await findContentByExternalId(movie.externalId, 'movie').catch(() => null);
              if (!contentItem) {
                return { ...movie, contentId: null, reviews: [] };
              }
              const reviews = await getReviews(contentItem.id).catch(() => []);
              return { ...movie, contentId: contentItem.id, reviews: reviews || [] };
            } catch {
              return { ...movie, contentId: null, reviews: [] };
            }
          })
        );
        if (!cancelled) {
          setMovies(withReviews);
          setLoadedCount(LOAD_MORE_LIMIT);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar la persona.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [decodedName]);

  // Cargar similares después de tener profile
  useEffect(() => {
    const names = profile?.similar?.slice(0, SIMILAR_PERSONS_LIMIT) || [];
    if (names.length === 0) {
      setSimilarPersons([]);
      return;
    }

    let cancelled = false;
    Promise.all(
      names.map((name) =>
        getProfile('tapeflix', name)
          .then((data) => ({ name, imageUrl: data?.imageUrl || null }))
          .catch(() => ({ name, imageUrl: null }))
      )
    ).then((list) => {
      if (!cancelled) {
        setSimilarPersons(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const allReviews = useMemo(
    () => movies.flatMap((movie) => movie.reviews.map((review) => ({ ...review, movie }))),
    [movies]
  );

  const distribution = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map(
      (star) => allReviews.filter((review) => Math.round(review.rating) === star).length
    );
    return counts;
  }, [allReviews]);
  const maxDistribution = Math.max(1, ...distribution);

  const topReviews = useMemo(
    () => [...allReviews].sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0)).slice(0, 3),
    [allReviews]
  );

  function openMovie(movie) {
    navigate(`/movie/${encodeURIComponent(movie.externalId)}`, { state: { movie } });
  }

  async function handleRegisterPerson() {
    const registered = await registerContent(
      token,
      {
        externalId: decodedName,
        title: profile?.name || decodedName,
        description: profile?.bio || '',
        imageUrl: profile?.imageUrl || '',
        genre: profile?.tags?.[0] || 'Persona',
      },
      'person'
    );
    setPersonContentId(registered.id);
    return registered.id;
  }

  function handleRatePersonClick() {
    if (!sessionUser) {
      onLoginClick?.();
      return;
    }
    setTab('reviews');
  }

  function copyLink() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => {});
  }

  const shareText = `Mirá a ${profile?.name || decodedName} en TapeFlix`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;

  /** Cargar más películas de la filmografía */
  const isLoadingMore = loadedCount > 0 && movies.length > loadedCount;
  const handleLoadMore = () => {
    setLoadedCount((prev) => Math.min(prev + LOAD_MORE_LIMIT, movies.length));
  };

  function renderMovieCard(movie) {
    return (
      <article
        key={movie.externalId}
        className="movie-card movie-card--clickable"
        onClick={() => openMovie(movie)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMovie(movie);
          }
        }}
        role="button"
        tabIndex={0}
        title={movie.title}
      >
        <div className="poster-container">
          {movie.imageUrl ? (
            <img
              className="poster-image"
              src={movie.imageUrl}
              alt={movie.title}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="poster">{movie.title?.[0] || '🎬'}</div>
          )}
        </div>
        <h3>{movie.title}</h3>
        <div className="movie-footer">
          <small>{formatDate(movie.releaseDate)} | {getKnownForDepartment(movie.genre)}</small>
        </div>
      </article>
    );
  }

  return (
    <main className="app-main">
      <header className="detail-topbar">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <SkeletonPersonDetail />
      ) : (
        <>
          <section className="entity-hero">
            <div className="entity-hero__left">
              <div className="artist-profile-avatar">
                {profile?.imageUrl ? (
                  <img src={profile.imageUrl} alt={profile.name} />
                ) : (
                  <span>{decodedName[0] || '🎬'}</span>
                )}
              </div>
              <h1 className="entity-hero__name">{profile?.name || decodedName}</h1>
              <div className="entity-hero__subname">
                {profile?.knownForDepartment ? getKnownForDepartment(profile.knownForDepartment) : 'Personalidad'}
              </div>
            </div>

            <div className="entity-hero__right">
              <div className="entity-hero__stats">
                <div className="entity-hero__stat">
                  <strong>{personStats.count}</strong>
                  <span>Créditos</span>
                </div>
                <div className="entity-hero__stat">
                  <strong>★ {personStats.average ? personStats.average.toFixed(1) : '—'}/5</strong>
                  <span>Promedio de calificación</span>
                </div>
                {sessionUser && (
                  <div className="entity-hero__stat">
                    <strong>☆ {personStats.yourRating ?? 0}/5</strong>
                    <span>Tu calificación</span>
                  </div>
                )}
              </div>

              {!(sessionUser && personStats.yourRating != null) && (
                <button type="button" className="entity-hero__cta" onClick={handleRatePersonClick}>
                  {sessionUser ? (
                    '★ Calificar películas de este/a artista'
                  ) : (
                    <>
                      <LockIcon size={15} /> Iniciá sesión para calificar
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          <nav className="entity-tabs">
            {[
              { value: 'home', label: 'Inicio' },
              { value: 'movies', label: 'Películas' },
              { value: 'reviews', label: 'Reseñas' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`entity-tabs__item ${tab === option.value ? 'is-active' : ''}`}
                onClick={() => setTab(option.value)}
              >
                {option.label}
              </button>
            ))}
          </nav>

          <div className="entity-layout">
            <div className="entity-main">
              {tab === 'home' && (
                <>
                  {movies.length > 0 && (
                    <section className="section-block">
                      <h2 className="subsection-title">Créditos destacados</h2>
                      <div className="cards-grid">{movies.slice(0, 8).map(renderMovieCard)}</div>
                    </section>
                  )}

                  {topReviews.length > 0 && (
                    <section className="section-block">
                      <h2 className="subsection-title">Reseñas destacadas</h2>
                      <div className="review-list">{topReviews.map((review) => (
                        <div key={review.id} className="review-card">
                          <strong>{review.title}</strong>
                          <p className="review-body">{review.body}</p>
                          <span className="review-rating">⭐ {review.rating}/5</span>
                          <small className="review-author">Por: {review.authorDisplayName || 'Anónimo'}</small>
                        </div>
                      ))}</div>
                    </section>
                  )}

                  {/* Load More button */}
                  {movies.length > loadedCount && !isLoadingMore && (
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={handleLoadMore}
                    >
                      Cargar más películas
                    </button>
                  )}

                  {(profile?.bio || profile?.tags?.length > 0) && (
                    <section className="section-block">
                      <h2 className="subsection-title">Acerca de</h2>
                      {profile?.tags?.length > 0 && (
                        <div className="artist-tags">
                          {profile.tags.map((tag) => (
                            <span key={tag} className="artist-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {profile?.bio && <p className="artist-bio">{profile.bio}</p>}
                    </section>
                  )}
                </>
              )}

              {tab === 'movies' && (
                <section className="section-block">
                  <h2>Filmografía</h2>
                  <div className="cards-grid">{movies.map(renderMovieCard)}</div>
                </section>
              )}

              {tab === 'reviews' && (
                <>
                  <section className="section-block">
                    <h2 className="subsection-title">Reseñas de sus películas</h2>
                    {personContentId ? (
                      <ReviewPanel
                        contentId={personContentId}
                        onRegister={handleRegisterPerson}
                        sessionUser={sessionUser}
                        onLoginClick={onLoginClick}
                        emptyMessage="Todavía nadie calificó a esta persona. ¡Sé el primero!"
                        onStatsChange={setPersonStats}
                      />
                    ) : (
                      <p className="no-reviews">No hay reseñas aún.</p>
                    )}
                  </section>

                  <section className="section-block">
                    <h2 className="subsection-title">Reseñas de sus películas destacadas</h2>
                    {allReviews.length === 0 ? (
                      <p className="no-reviews">Todavía no hay reseñas para las películas de esta persona.</p>
                    ) : (
                      <div className="review-list">{allReviews.map((review) => (
                        <div key={review.id} className="review-card">
                          <strong>{review.title}</strong>
                          <p className="review-body">{review.body}</p>
                          <span className="review-rating">⭐ {review.rating}/5</span>
                          <small className="review-author">Por: {review.authorDisplayName || 'Anónimo'}</small>
                        </div>
                      ))}</div>
                    )}
                  </section>
                </>
              )}
            </div>

            <aside className="entity-sidebar">
              <div className="entity-sidebar__actions">
                <button type="button" onClick={() => setTab('reviews')}>
                  Escribir reseña
                </button>
                {profile?.url && (
                  <a href={profile.url} target="_blank" rel="noreferrer">
                    Ver en TMDB
                  </a>
                )}
                <div className="entity-sidebar__share">
                  <button type="button" onClick={copyLink}>
                    {linkCopied ? 'Copiado ✓' : 'Copiar enlace'}
                  </button>
                  <a href={twitterShareUrl} target="_blank" rel="noreferrer">
                    Compartir en X
                  </a>
                </div>
              </div>

              {similarPersons.length > 0 && (
                <div className="entity-sidebar__panel">
                  <h3>También te puede gustar</h3>
                  <div className="similar-person-list">
                    {similarPersons.map((person) => (
                      <button
                        key={person.name}
                        type="button"
                        className="similar-person-item"
                        onClick={() => navigate(`/person/${encodeURIComponent(person.name)}`)}
                      >
                        <span className="similar-person-item__avatar">
                          {person.imageUrl ? <img src={person.imageUrl} alt="" /> : person.name[0]}
                        </span>
                        <span>{person.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}