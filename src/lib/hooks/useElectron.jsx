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
      // Check if getAppVersion method exists before calling it
      if (typeof window.electronAPI.getAppVersion === 'function') {
        window.electronAPI.getAppVersion().then(setAppVersion).catch(() => {
          setAppVersion('Unknown');
        });
      } else {
        // Electron API exists but doesn't have getAppVersion method
        setAppVersion('Unknown');
      }
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
