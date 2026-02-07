import { useState, useEffect } from 'react';

const LOCAL_STORAGE_MODE_KEY = 'sqfm:localStorageMode';

export function useLocalStorageMode() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MODE_KEY, isEnabled.toString());
    } catch (error) {
      console.error('[SQFM] Failed to persist Local Storage Mode setting', error);
    }
  }, [isEnabled]);

  const enable = () => setIsEnabled(true);
  const disable = () => setIsEnabled(false);
  const toggle = () => setIsEnabled(prev => !prev);

  return {
    isEnabled,
    enable,
    disable,
    toggle,
  };
}
