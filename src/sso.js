const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';
const TAPEFLIX_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5174';
const TAPEBEAT_URL = import.meta.env.VITE_TAPEBEAT_URL || 'http://localhost:5175';

/**
 * Sincroniza solo perfil UI (email/display/avatar/theme) al portal.
 * La auth viaja por cookie httpOnly del API (mismo dominio API), así que el
 * JWT ya NO pasa por URL ni toca localStorage/iframes.
 */
export function syncSessionToPortal({ email, displayName, avatarDataUri }, theme) {
  const params = new URLSearchParams({
    sso_email: email || '',
    sso_display_name: displayName || '',
    sso_theme: theme || '',
  });
  if (avatarDataUri) {
    params.set('sso_avatar', avatarDataUri);
  }

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.src = `${PORTAL_URL}/?${params.toString()}`;
  document.body.appendChild(iframe);
  iframe.addEventListener('load', () => {
    setTimeout(() => iframe.remove(), 500);
  });
}

/**
 * Cierre de sesión global: cada app vive en otro origen y nadie puede tocar
 * el localStorage ajeno, así que se avisa con iframes invisibles a las demás
 * apps (?sso_logout=true) y cada una se limpia a sí misma.
 */
export function broadcastLogout(theme, selfUrl) {
  const params = new URLSearchParams({ sso_logout: 'true', sso_theme: theme });
  for (const baseUrl of [PORTAL_URL, TAPEFLIX_URL, TAPEBEAT_URL]) {
    if (!baseUrl || baseUrl === selfUrl) {
      continue;
    }
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = `${baseUrl}/?${params.toString()}`;
    document.body.appendChild(iframe);
    iframe.addEventListener('load', () => {
      setTimeout(() => iframe.remove(), 500);
    });
  }
}
