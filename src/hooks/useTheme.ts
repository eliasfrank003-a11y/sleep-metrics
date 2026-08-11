import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sleep-metrics:theme';

export type Theme = 'dark' | 'light';

/** Dark is the default - this is an app you look at in a dark bedroom. */
function initial(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    // The boot script in index.html sets this inline to avoid a flash, and an
    // inline style outranks the stylesheet - so the toggle has to clear it.
    root.style.backgroundColor = theme === 'dark' ? '#000' : '#f7f9fb';
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
