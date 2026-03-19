import { useEffect, useState } from 'react';

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    // Check if running in Electron
    const electronAPI = window.electronAPI;
    const isElectronApp = !!electronAPI;
    setIsElectron(isElectronApp);

    if (isElectronApp) {
      // Get app version
      electronAPI.getVersion().then(version => {
        setAppVersion(version);
      });

      // Set up menu listeners
      electronAPI.onMenuNewTrade(() => {
        console.log('New trade requested from menu');
        // Navigate to execution page or open trade modal
        window.location.hash = '/Execution';
      });

      electronAPI.onMenuAbout(() => {
        electronAPI.showMessageBox({
          type: 'info',
          title: 'About TradeDesk Pro',
          message: 'TradeDesk Pro',
          detail: `Version: ${appVersion}\nA professional trading application built with React and Electron.`,
          buttons: ['OK']
        });
      });
    }
  }, [appVersion]);

  const showMessageBox = async (options) => {
    if (isElectron && window.electronAPI) {
      return await window.electronAPI.showMessageBox(options);
    }
    // Fallback for web version
    if (options.type === 'info') {
      alert(options.message);
    }
    return { response: 0 };
  };

  const closeApp = async () => {
    if (isElectron && window.electronAPI) {
      try {
        await window.electronAPI.closeApp();
      } catch (error) {
        console.error('Failed to close app:', error);
      }
    } else {
      // Fallback for web version - close window
      if (window.close) {
        window.close();
      }
    }
  };

  return {
    isElectron,
    appVersion,
    platform: window.platform || 'web',
    showMessageBox,
    closeApp
  };
};
