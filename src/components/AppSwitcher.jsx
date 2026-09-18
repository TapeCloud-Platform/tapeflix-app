import { Dropdown } from '@heroui/react';
import tapecloudIconDark from '../assets/tapecloud-icon-dark.png';
import tapecloudIconLight from '../assets/tapecloud-icon-light.png';
import tapebeatIcon from '../assets/tapebeat-icon.png';
import tapebeatIconLight from '../assets/tapebeat-icon-light.png';
import tapeflixIcon from '../assets/tapeflix-icon.png';
import tapeflixIconLight from '../assets/tapeflix-icon-light.png';

const PORTAL_URL = 'http://localhost:5173';
const TAPEFLIX_URL = 'http://localhost:5174';
const TAPEBEAT_URL = 'http://localhost:5175';

function buildAppUrl(baseUrl, theme) {
  const token = localStorage.getItem('tapecloud_token');
  const email = localStorage.getItem('tapecloud_email');
  const displayName = localStorage.getItem('tapecloud_display_name');
  const avatar = localStorage.getItem('tapecloud_avatar');
  const params = new URLSearchParams({ sso_theme: theme });
  if (token && email) {
    params.set('sso_token', token);
    params.set('sso_email', email);
    params.set('sso_display_name', displayName || '');
    if (avatar) {
      params.set('sso_avatar', avatar);
    }
  }
  return `${baseUrl}?${params.toString()}`;
}

/** Selector de apps del ecosistema, activado desde el logo del header. */
export default function AppSwitcher({ current, theme, logoSrc, appName }) {
  const apps = [
    { id: 'tapecloud', name: 'TapeCloud', url: PORTAL_URL, icon: theme === 'light' ? tapecloudIconLight : tapecloudIconDark },
    { id: 'tapeflix', name: 'TapeFlix', url: TAPEFLIX_URL, icon: theme === 'light' ? tapeflixIconLight : tapeflixIcon },
    { id: 'tapebeat', name: 'TapeBeat', url: TAPEBEAT_URL, icon: theme === 'light' ? tapebeatIconLight : tapebeatIcon },
  ];

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="app-switcher__trigger" aria-label={`${appName} — cambiar de app`}>
        <img className="app-switcher__logo" src={logoSrc} alt={appName} />
      </Dropdown.Trigger>
      <Dropdown.Popover className="app-switcher__panel" placement="bottom end" offset={10}>
        <p className="app-switcher__title">Ecosistema TapeCloud</p>
        {apps.map((app) =>
          app.id === current ? (
            <div key={app.id} className="app-switcher__item is-current">
              <img src={app.icon} alt="" aria-hidden="true" />
              <span>{app.name}</span>
              <span className="app-switcher__badge">Actual</span>
            </div>
          ) : (
            <a key={app.id} className="app-switcher__item" href={buildAppUrl(app.url, theme)}>
              <img src={app.icon} alt="" aria-hidden="true" />
              <span>{app.name}</span>
            </a>
          )
        )}
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
