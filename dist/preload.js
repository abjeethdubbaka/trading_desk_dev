const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialog
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // App control
  closeApp: () => ipcRenderer.invoke('close-app'),
  
  // Menu events
  onMenuNewTrade: (callback) => ipcRenderer.on('menu-new-trade', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),
  
  // Remove all listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Expose a safe version of process.platform
contextBridge.exposeInMainWorld('platform', process.platform);
