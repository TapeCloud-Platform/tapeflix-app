<<<<<<< HEAD
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tapecloud_theme');
    return saved || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('tapecloud_theme', theme);
=======
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
>>>>>>> 0579c975b38e5f6355578da460b97ececc4aa252
  }, [theme]);

  return [theme, setTheme];
}
