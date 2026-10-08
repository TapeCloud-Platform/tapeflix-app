import { useEffect, useState } from 'react';
import { Dropdown } from '@heroui/react';
import { getMyReviewStats } from '../api';
import ConfirmDialog from './ConfirmDialog';
import userIconLight from '../assets/user-icon-light.svg';
import userIconDark from '../assets/user-icon-dark.svg';

/** Menú de cuenta con el mismo lenguaje que el portal (secciones 01/02). */
export default function SettingsMenu({
  sessionUser,
  onLogout,
  theme,
  onThemeChange,
  portalUrl,
  onLoginClick,
}) {
  const token = sessionUser ? localStorage.getItem('tapecloud_token') : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);

  const guestIcon = theme === 'light' ? userIconLight : userIconDark;

  useEffect(() => {
    setStats(null);
    setStatsError('');
  }, [sessionUser?.email]);

  useEffect(() => {
    if (!reviewsOpen || !sessionUser || stats || statsError || loadingStats) {
      return;
    }
    setLoadingStats(true);
    getMyReviewStats(token)
      .then(setStats)
      .catch((err) => setStatsError(err.message || 'No se pudieron cargar las reseñas.'))
      .finally(() => setLoadingStats(false));
  }, [reviewsOpen, sessionUser, stats, statsError, loadingStats, token]);

  function handleLogoutRequest() {
    setMenuOpen(false);
    setConfirmLogoutOpen(true);
  }

  function handleLogoutConfirm() {
    setConfirmLogoutOpen(false);
    onLogout();
  }

  return (
    <>
      <Dropdown.Root isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <Dropdown.Trigger className="account-menu__trigger" aria-label="Cuenta de usuario">
          {sessionUser?.avatarDataUri ? (
            <img className="account-menu__trigger-avatar" src={sessionUser.avatarDataUri} alt="" />
          ) : (
            <img className="account-menu__trigger-avatar account-menu__trigger-guest" src={guestIcon} alt="" />
          )}
        </Dropdown.Trigger>

        <Dropdown.Popover className="account-menu__panel" placement="bottom start" offset={10}>
          {/* ---- Sección Usuario ---- */}
          <p className="account-menu__section-title">Usuario</p>

          <div className="user-menu__profile">
            {sessionUser?.avatarDataUri ? (
              <img
                className="user-menu__avatar user-menu__avatar--large"
                src={sessionUser.avatarDataUri}
                alt=""
              />
            ) : (
              <img
                className="user-menu__avatar user-menu__avatar--large"
                src={guestIcon}
                alt=""
              />
            )}
            <div>
              <p className="user-menu__name">{sessionUser?.displayName || 'Invitado'}</p>
              <p className="user-menu__email">{sessionUser?.email || 'Sesión de invitado'}</p>
            </div>
          </div>

          {sessionUser && (
            <div className="user-menu__reviews">
              <button
                type="button"
                className="user-menu__reviews-toggle"
                onClick={() => setReviewsOpen((open) => !open)}
                aria-expanded={reviewsOpen}
              >
                Reseñas
                <span className={`user-menu__chevron ${reviewsOpen ? 'is-open' : ''}`}>›</span>
              </button>

              {reviewsOpen && loadingStats && !stats && <p className="settings-menu__hint">Cargando...</p>}
              {reviewsOpen && statsError && <p className="error">{statsError}</p>}
              {reviewsOpen && stats && (
                <ul className="user-menu__list">
                  <li>
                    <span>Reseña con más likes</span>
                    <strong>{stats.mostLikedReviewTitle || '-'}</strong>
                  </li>
                  <li>
                    <span>Reseñas publicadas en TapeBeat</span>
                    <strong>{stats.tapebeatReviews}</strong>
                  </li>
                  <li>
                    <span>Reseñas publicadas en TapeFlix</span>
                    <strong>{stats.tapeflixReviews}</strong>
                  </li>
                </ul>
              )}
            </div>
          )}

          {!sessionUser && (
            <div className="account-menu__guest-cta">
              <p className="settings-menu__hint">¡Para obtener la experiencia de TapeCloud, iniciá sesión!</p>
              <button
                type="button"
                className="login-button login-button--primary"
                onClick={() => {
                  setMenuOpen(false);
                  onLoginClick();
                }}
              >
                Iniciar sesión
                <span className="account-menu__cta-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* ---- Apariencia ---- */}
          <p className="account-menu__section-title account-menu__section-title--spaced">Apariencia</p>
          <div className="theme-toggle" role="group" aria-label="Elegir tema">
            <button
              type="button"
              className={`theme-toggle__option ${theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => onThemeChange('dark')}
              aria-pressed={theme === 'dark'}
            >
              Oscuro
            </button>
            <button
              type="button"
              className={`theme-toggle__option ${theme === 'light' ? 'is-active' : ''}`}
              onClick={() => onThemeChange('light')}
              aria-pressed={theme === 'light'}
            >
              Claro
            </button>
          </div>

          {/* ---- Cuenta ---- */}
          <p className="account-menu__section-title account-menu__section-title--spaced">Cuenta</p>
          <a className="settings-menu__item" href={portalUrl}>
            Gestionar perfil en TapeCloud
            <span aria-hidden="true">→</span>
          </a>
          <p className="settings-menu__hint">
            Usuario, contraseña y verificación en dos pasos se manejan desde el portal.
          </p>

          {sessionUser && (
            <button
              type="button"
              className="settings-menu__item settings-menu__item--danger"
              onClick={handleLogoutRequest}
            >
              Cerrar sesión
            </button>
          )}
        </Dropdown.Popover>
      </Dropdown.Root>

      {confirmLogoutOpen && (
        <ConfirmDialog
          title="Cerrar sesión"
          message="¿Estás seguro de que querés cerrar sesión?"
          confirmLabel="Cerrar sesión"
          danger
          onConfirm={handleLogoutConfirm}
          onCancel={() => setConfirmLogoutOpen(false)}
        />
      )}
    </>
  );
}
