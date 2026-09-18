import { useEffect } from 'react';
import tapecloudMarkWhite from '../assets/tapecloud-mark-white.png';
import tapecloudMarkDark from '../assets/tapecloud-mark-dark.png';

export default function AuthModal({ onClose, theme, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="auth-modal-brand">
          <img
            className="auth-modal-logo"
            src={theme === 'light' ? tapecloudMarkDark : tapecloudMarkWhite}
            alt=""
          />
          <span className="eyebrow">TapeCloud</span>
        </div>
        {children}
      </div>
    </div>
  );
}
