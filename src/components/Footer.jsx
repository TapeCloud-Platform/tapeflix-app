import tapeflixLogoLight from '../assets/tapeflix-logo-light.png';
import tapeflixLogoDark from '../assets/tapeflix-logo-dark.png';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';
const TAPEFLIX_URL = import.meta.env.VITE_TAPEFLIX_URL || 'http://localhost:5174';
const TAPEBEAT_URL = import.meta.env.VITE_TAPEBEAT_URL || 'http://localhost:5175';

/** Pie sólido del ecosistema: marca, legales y links entre sistemas. */
export default function Footer({ theme }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <img
          className="app-footer__logo"
          src={theme === 'light' ? tapeflixLogoLight : tapeflixLogoDark}
          alt="TapeFlix"
        />
        <p className="app-footer__legal">
          © 2026 TapeCloud — Todos los derechos reservados.
        </p>
        <p className="app-footer__note">
          Proyecto independiente. Sin rastreadores, sin publicidad: tus reseñas son tuyas.
        </p>
        <nav className="app-footer__nav" aria-label="Ecosistema TapeCloud">
          <a href={PORTAL_URL}>TapeCloud</a>
          <a href={TAPEFLIX_URL} aria-current="page">TapeFlix</a>
          <a href={TAPEBEAT_URL}>TapeBeat</a>
        </nav>
      </div>
    </footer>
  );
}
