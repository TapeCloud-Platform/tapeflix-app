import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tapecloud_theme';

function getStoredTheme() {
  if (typeof localStorage === 'undefined') {
    return 'dark';
  }
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

/** Tema compartido con el portal y TapeBeat: persiste en localStorage y en <html data-theme>. */
export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
}
