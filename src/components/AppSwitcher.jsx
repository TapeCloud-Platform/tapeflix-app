import { Dropdown } from '@heroui/react';
import tapecloudLogoDark from '../assets/tapecloud-logo-dark.png';
import tapecloudLogoLight from '../assets/tapecloud-logo-light.png';
import tapebeatLogoDark from '../assets/tapebeat-logo-dark.png';
import tapebeatLogoLight from '../assets/tapebeat-logo-light.png';
import tapeflixLogoDark from '../assets/tapeflix-logo-dark.png';
import tapeflixLogoLight from '../assets/tapeflix-logo-light.png';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';
const TAPEFLIX_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5174';
const TAPEBEAT_URL = import.meta.env.VITE_TAPEBEAT_URL || 'http://localhost:5175';

/**
 * Link entre apps: solo perfil UI por query (email/display/avatar/tema).
 * La auth viaja por cookie httpOnly del API, el JWT ya no pasa por URL.
 */
function buildAppUrl(baseUrl, theme) {
  const email = localStorage.getItem('tapecloud_email');
  const displayName = localStorage.getItem('tapecloud_display_name');
  const avatar = localStorage.getItem('tapecloud_avatar');
  const params = new URLSearchParams({ sso_theme: theme });
  if (email) {
    params.set('sso_email', email);
    params.set('sso_display_name', displayName || '');
    if (avatar) {
      params.set('sso_avatar', avatar);
    }
  }
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Flechita junto a la marca: salta a los otros sistemas del ecosistema.
 * La app actual no aparece (ya estás en ella).
 */
export default function AppSwitcher({ current, theme }) {
  const apps = [
    { id: 'tapecloud', name: 'TapeCloud', url: PORTAL_URL, icon: theme === 'light' ? tapecloudLogoLight : tapecloudLogoDark },
    { id: 'tapeflix', name: 'TapeFlix', url: TAPEFLIX_URL, icon: theme === 'light' ? tapeflixLogoLight : tapeflixLogoDark },
    { id: 'tapebeat', name: 'TapeBeat', url: TAPEBEAT_URL, icon: theme === 'light' ? tapebeatLogoLight : tapebeatLogoDark },
  ].filter((app) => app.id !== current);

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="brand-switcher__trigger" aria-label="Ir a otro sistema">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Dropdown.Trigger>
      <Dropdown.Popover className="app-switcher__panel" placement="bottom start" offset={10}>
        <p className="app-switcher__title">Ir a otro sistema</p>
        {apps.map((app) => (
          <a key={app.id} className="app-switcher__item" href={buildAppUrl(app.url, theme)}>
            <img src={app.icon} alt="" aria-hidden="true" />
            <span>{app.name}</span>
          </a>
        ))}
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
