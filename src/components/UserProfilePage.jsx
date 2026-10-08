import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../discoverApi';
import { SkeletonUserProfile } from './Skeleton';

const TAPEBEAT_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5175';

/** Perfil público con la misma estructura que la ficha de persona: hero, tabs y sidebar. */
export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getUserProfile(username);
        if (!cancelled) {
          if (!data) {
            setError('Usuario no encontrado.');
            setProfile(null);
          } else {
            setProfile(data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el perfil.');
          setProfile(null);
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
  }, [username]);

  function copyLink() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <main className="app-main">
        <SkeletonUserProfile />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="app-main">
        <header className="topbar detail-topbar">
          <button type="button" className="back-button" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </header>
        <p className="error">{error || 'Usuario no encontrado.'}</p>
      </main>
    );
  }

  const displayName = profile.displayName || profile.username || '?';
  const initial = displayName[0]?.toUpperCase();
  const tapebeatCount = profile.tapebeatReviews ?? 0;
  const tapeflixCount = profile.tapeflixReviews ?? 0;
  const totalCount = tapebeatCount + tapeflixCount;
  const maxAppCount = Math.max(1, tapebeatCount, tapeflixCount);

  const shareText = `Mirá el perfil de ${displayName} en TapeCloud`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;

  // Reseña destacada: a dónde lleva y de qué app es.
  const featuredApp = profile.mostLikedContentSourceApp || null;
  const featuredAppKey = featuredApp === 'tapebeat' ? 'tapebeat' : 'tapeflix';
  const featuredAppLabel = featuredApp === 'tapebeat' ? 'TapeBeat' : 'TapeFlix';

  function featuredReviewPath() {
    if (!profile.mostLikedReviewId) {
      return null;
    }
    const id = encodeURIComponent(profile.mostLikedContentExternalId || '');
    if (featuredApp === 'tapebeat') {
      if (profile.mostLikedContentSourceType === 'artist') {
        return `${TAPEBEAT_URL}/artist/${id}`;
      }
      if (profile.mostLikedContentSourceType === 'album') {
        // La ficha de álbum necesita el artista, dato que el perfil no trae.
        return null;
      }
      return `${TAPEBEAT_URL}/track/${id}`;
    }
    // Mismo criterio que la ficha de persona: persona a su ficha, lo demás a película.
    if (profile.mostLikedContentSourceType === 'person') {
      return `/person/${id}`;
    }
    return `/movie/${id}`;
  }

  const featuredPath = featuredReviewPath();
  const featuredIsExternal = Boolean(featuredPath && featuredPath.startsWith('http'));

  function openFeaturedReview() {
    if (!featuredPath) {
      return;
    }
    if (featuredIsExternal) {
      window.open(featuredPath, '_blank', 'noopener');
    } else {
      navigate(featuredPath);
    }
  }

  return (
    <main className="app-main">
      <header className="topbar detail-topbar">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </header>

      <section className="entity-hero">
        <div className="entity-hero__left">
          <div className="artist-profile-avatar">
            {profile.avatarDataUri ? (
              <img src={profile.avatarDataUri} alt={displayName} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="user-profile__hero-text">
            <p className="eyebrow">Perfil de TapeCloud</p>
            <h1 className="entity-hero__name">{displayName}</h1>
            <p className="user-menu__email">@{profile.username}</p>
          </div>
        </div>

        <div className="entity-hero__right">
          <div className="entity-hero__stats">
            <div className="entity-hero__stat">
              <strong>{tapeflixCount}</strong>
              <span>TapeFlix</span>
            </div>
            <div className="entity-hero__stat">
              <strong>{tapebeatCount}</strong>
              <span>TapeBeat</span>
            </div>
            <div className="entity-hero__stat">
              <strong>{totalCount}</strong>
              <span>Reseñas</span>
            </div>
          </div>
        </div>
      </section>

      <nav className="entity-tabs">
        <button type="button" className="entity-tabs__item is-active">
          Resumen
        </button>
      </nav>

      <div className="entity-layout">
        <div className="entity-main">
          <section className="section-block">
            <h2 className="subsection-title">Actividad</h2>
            <div className="information-panel">
              <div className="information-grid">
                <div className="information-cell">
                  <h4>Reseñas en TapeFlix</h4>
                  <p>{tapeflixCount}</p>
                </div>
                <div className="information-cell">
                  <h4>Reseñas en TapeBeat</h4>
                  <p>{tapebeatCount}</p>
                </div>
                <div className="information-cell">
                  <h4>Total de reseñas</h4>
                  <p>{totalCount}</p>
                </div>
                <div className="information-cell">
                  <h4>Reseña destacada</h4>
                  <p className={profile.mostLikedReviewTitle ? '' : 'information-cell__empty'}>
                    {profile.mostLikedReviewTitle || 'Todavía sin reseñas'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {profile.mostLikedReviewTitle && (
            <section className="section-block">
              <h2 className="subsection-title">Reseña con más me gusta</h2>
              {featuredPath ? (
                <button
                  type="button"
                  className="featured-review featured-review--clickable"
                  onClick={openFeaturedReview}
                  title={featuredIsExternal ? `Abrir reseña en ${featuredAppLabel}` : 'Abrir reseña'}
                >
                  <span className="featured-review__top">
                    <strong>“{profile.mostLikedReviewTitle}”</strong>
                    <span className={`app-badge app-badge--${featuredAppKey}`}>
                      {featuredAppLabel}
                      {featuredIsExternal ? ' ↗' : ''}
                    </span>
                  </span>
                  <span className="featured-review__meta">
                    {profile.mostLikedReviewRating != null && (
                      <>★ {Number(profile.mostLikedReviewRating).toFixed(1)}/5 · </>
                    )}
                    {profile.mostLikedContentTitle || 'Ver reseña'}
                  </span>
                  <span className="review-body">La reseña más votada por la comunidad de este usuario.</span>
                </button>
              ) : (
                <div className="featured-review">
                  <p className="review-body">“{profile.mostLikedReviewTitle}”</p>
                  <p className="review-body">La reseña más votada por la comunidad de este usuario.</p>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="entity-sidebar">
          <div className="entity-sidebar__actions">
            <div className="entity-sidebar__share">
              <button type="button" onClick={copyLink}>
                {linkCopied ? 'Copiado ✓' : 'Copiar enlace'}
              </button>
              <a href={twitterShareUrl} target="_blank" rel="noreferrer">
                Compartir en X
              </a>
            </div>
          </div>

          <div className="entity-sidebar__panel">
            <h3>Reseñas por app</h3>
            <div className="rating-distribution">
              {[
                { label: 'TapeFlix', count: tapeflixCount },
                { label: 'TapeBeat', count: tapebeatCount },
              ].map((row) => (
                <div key={row.label} className="rating-distribution__bar-row">
                  <span className="rating-distribution__label">{row.label}</span>
                  <span className="rating-distribution__track">
                    <span
                      className="rating-distribution__fill"
                      style={{ width: `${(row.count / maxAppCount) * 100}%` }}
                    />
                  </span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
