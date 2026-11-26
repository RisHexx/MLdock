import { useCallback, useEffect, useSyncExternalStore } from 'react';

// 'light' | 'dark' | 'system'. index.html applies the saved value before React
// loads (no white flash); this hook keeps it in sync afterwards.
const STORAGE_KEY = 'theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();

const readPreference = () => localStorage.getItem(STORAGE_KEY) || 'system';

const resolve = (pref) => (pref === 'system' ? (media.matches ? 'dark' : 'light') : pref);

const apply = (pref) => {
  document.documentElement.classList.toggle('dark', resolve(pref) === 'dark');
};

const notify = () => listeners.forEach((l) => l());

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Follow the OS setting live while the preference is 'system'
media.addEventListener('change', () => {
  if (readPreference() === 'system') {
    apply('system');
    notify();
  }
});

export const useTheme = () => {
  const preference = useSyncExternalStore(subscribe, readPreference);
  const resolved = resolve(preference);

  useEffect(() => {
    apply(preference);
  }, [preference]);

  const setTheme = useCallback((pref) => {
    localStorage.setItem(STORAGE_KEY, pref);
    apply(pref);
    notify();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolve(readPreference()) === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme: preference, resolvedTheme: resolved, setTheme, toggleTheme };
};
