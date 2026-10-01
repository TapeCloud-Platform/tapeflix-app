import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile } from '../discoverApi';

/** Perfil público de un usuario de TapeCloud: avatar, nombre y stats de reseñas. */
export default function UserProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <main className="app-main">
        <p className="settings-menu__hint">Cargando perfil...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="app-main">
        <p className="error">{error || 'Usuario no encontrado.'}</p>
      </main>
    );
  }

  const initial = (profile.displayName || profile.username || '?')[0]?.toUpperCase();

  return (
    <main className="app-main">
      <div className="user-menu__profile user-profile__head">
        {profile.avatarDataUri ? (
          <img
            className="user-menu__avatar user-menu__avatar--large"
            src={profile.avatarDataUri}
            alt=""
          />
        ) : (
          <span className="user-menu__avatar user-menu__avatar--large">{initial}</span>
        )}
        <div>
          <h2 className="user-menu__name">{profile.displayName}</h2>
          <p className="user-menu__email">@{profile.username}</p>
        </div>
      </div>

      <ul className="user-menu__list user-profile__stats">
        <li>
          <span>Reseña con más likes</span>
          <strong>{profile.mostLikedReviewTitle || '-'}</strong>
        </li>
        <li>
          <span>Reseñas en TapeFlix</span>
          <strong>{profile.tapeflixReviews}</strong>
        </li>
        <li>
          <span>Reseñas en TapeBeat</span>
          <strong>{profile.tapebeatReviews}</strong>
        </li>
      </ul>
    </main>
  );
}
