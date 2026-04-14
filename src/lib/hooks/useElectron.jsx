import { useEffect, useState } from 'react';

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    // Check if running in Electron
    const userAgent = navigator.userAgent.toLowerCase();
    const electron = userAgent.indexOf('electron') > -1;
    
    setIsElectron(electron);
    
    if (electron && window.electronAPI) {
      const getVersionFn =
        typeof window.electronAPI.getVersion === 'function'
          ? window.electronAPI.getVersion
          : typeof window.electronAPI.getAppVersion === 'function'
            ? window.electronAPI.getAppVersion
            : null;

      if (!getVersionFn) {
        setAppVersion('Unknown');
        return;
      }

      getVersionFn().then(setAppVersion).catch(() => {
        setAppVersion('Unknown');
      });
    } else if (!electron) {
      // Not running in Electron - set web version
      setAppVersion('Web Version');
    }
  }, []);

  const closeApp = () => {
    if (isElectron && window.electronAPI && typeof window.electronAPI.closeApp === 'function') {
      window.electronAPI.closeApp();
    }
  };

  return {
    isElectron,
    appVersion,
    closeApp
  };
};


