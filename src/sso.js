const PORTAL_URL = 'http://localhost:5173';

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
