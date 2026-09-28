const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';
const TAPEFLIX_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5174';
const TAPEBEAT_URL = import.meta.env.VITE_TAPEBEAT_URL || 'http://localhost:5175';

/**
 * Loguea la sesión también en el portal, sin sacar al usuario de esta app:
 * un iframe invisible carga el portal con los mismos datos de sesión por
 * query params, y el portal los guarda en su propio localStorage (otro
 * origen, así que no se puede escribir ahí directamente).
 */
export function syncSessionToPortal({ token, email, displayName, avatarDataUri }, theme) {
  const params = new URLSearchParams({
    sso_token: token,
    sso_email: email,
    sso_display_name: displayName || '',
    sso_theme: theme,
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
