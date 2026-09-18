import { useEffect, useRef, useState } from 'react';
import { Dropdown, Avatar } from '@heroui/react';
import { getMyReviewStats, updateAvatar } from '../api';
import { resizeImageToDataUri } from '../avatar';
import ConfirmDialog from './ConfirmDialog';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Oscuro', icon: '🌙' },
  { value: 'light', label: 'Claro', icon: '☀️' },
];

export default function SettingsMenu({
  sessionUser,
  onLogout,
  theme,
  onThemeChange,
  portalUrl,
  onAvatarChange,
  onLoginClick,
}) {
  const fileInputRef = useRef(null);
  const token = sessionUser ? localStorage.getItem('tapecloud_token') : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

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

  async function handleAvatarPick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      const response = await updateAvatar(token, dataUri);
      onAvatarChange(response.avatarDataUri);
    } catch (err) {
      setAvatarError(err.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarError('');
    setAvatarUploading(true);
    try {
      await updateAvatar(token, null);
      onAvatarChange(null);
    } catch (err) {
      setAvatarError(err.message || 'No se pudo quitar la foto de perfil.');
    } finally {
      setAvatarUploading(false);
    }
  }

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
      {/* Fuera del Dropdown: si el diálogo nativo de archivos abre dentro del
          popover, se desmonta al perder foco y el onChange nunca llega a
          dispararse. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="account-menu__file-input"
        onChange={handleAvatarPick}
      />

      <Dropdown.Root isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <Dropdown.Trigger className="icon-button account-trigger" aria-label="Cuenta">
          <Avatar size="sm" className="account-trigger__avatar">
            {sessionUser?.avatarDataUri && <Avatar.Image src={sessionUser.avatarDataUri} alt="" />}
            <Avatar.Fallback>
              {sessionUser?.displayName?.[0]?.toUpperCase() || '?'}
            </Avatar.Fallback>
          </Avatar>
        </Dropdown.Trigger>

        <Dropdown.Popover className="settings-menu__panel" placement="bottom end" offset={10}>
          <div className="settings-menu__section settings-card__profile">
            <Avatar size="lg" className="settings-avatar">
              {sessionUser?.avatarDataUri && <Avatar.Image src={sessionUser.avatarDataUri} alt="" />}
              <Avatar.Fallback>
                {sessionUser?.displayName?.[0]?.toUpperCase() || '?'}
              </Avatar.Fallback>
            </Avatar>
            <div>
              <h2>{sessionUser?.displayName || 'Invitado'}</h2>
              <p className="settings-card__email">{sessionUser?.email || 'No iniciaste sesión'}</p>
            </div>
          </div>

          {sessionUser && (
            <div className="settings-menu__section account-menu__avatar-actions">
              <button
                type="button"
                className="settings-menu__item"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? 'Subiendo...' : 'Cambiar foto de perfil'}
              </button>
              {sessionUser.avatarDataUri && (
                <button
                  type="button"
                  className="settings-menu__item"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                >
                  Quitar foto
                </button>
              )}
              {avatarError && <p className="error">{avatarError}</p>}
            </div>
          )}

          {sessionUser && (
            <div className="settings-menu__section">
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
            <div className="settings-menu__section account-menu__guest-cta">
              <p className="settings-card__hint">¡Para obtener la experiencia de TapeCloud, iniciá sesión!</p>
              <button
                type="button"
                className="inline-login-btn"
                onClick={() => {
                  setMenuOpen(false);
                  onLoginClick();
                }}
              >
                Iniciar sesión
              </button>
            </div>
          )}

          <div className="settings-menu__section">
            <button
              type="button"
              className="account-menu__section-toggle"
              onClick={() => setConfigOpen((open) => !open)}
              aria-expanded={configOpen}
            >
              Configuración
              <span className={`user-menu__chevron ${configOpen ? 'is-open' : ''}`}>›</span>
            </button>

            {configOpen && (
              <>
                <a className="settings-menu__item" href={portalUrl}>
                  Editar cuenta en el portal
                  <span aria-hidden="true">→</span>
                </a>
                <p className="settings-menu__hint">
                  Usuario, contraseña y verificación en dos pasos se manejan desde el portal de TapeCloud.
                </p>

                <h3 className="settings-card__title" style={{ marginTop: 14 }}>Apariencia</h3>
                <p className="settings-card__hint">Elegí cómo se ve TapeFlix en este dispositivo.</p>
                <div className="theme-toggle-group">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`theme-toggle-option ${theme === option.value ? 'is-active' : ''}`}
                      onClick={() => onThemeChange(option.value)}
                      aria-pressed={theme === option.value}
                    >
                      <span aria-hidden="true">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>

                <button type="button" className="settings-menu__item" disabled style={{ marginTop: 14 }}>
                  Contacto y soporte
                  <span className="settings-menu__badge">Próximamente</span>
                </button>

                {sessionUser && (
                  <button
                    type="button"
                    className="settings-menu__item settings-menu__item--danger"
                    onClick={handleLogoutRequest}
                  >
                    Cerrar sesión
                  </button>
                )}
              </>
            )}
          </div>
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
