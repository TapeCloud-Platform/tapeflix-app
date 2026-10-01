import { useEffect } from 'react';
import tapecloudLogoLight from '../assets/tapecloud-logo-light.png';
import tapecloudLogoDark from '../assets/tapecloud-logo-dark.png';

/** El modal solo se cierra con la cruz: ni clic afuera ni Escape. */
export default function AuthModal({ onClose, theme, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-panel" role="dialog" aria-modal="true">
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="auth-modal-brand">
          <img
            className="auth-modal-logo"
            src={theme === 'light' ? tapecloudLogoLight : tapecloudLogoDark}
            alt=""
          />
          <span className="eyebrow">TapeCloud</span>
        </div>
        {children}
      </div>
    </div>
  );
}
