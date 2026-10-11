const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  // Backward-compatible alias
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialog
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // App control
  closeApp: () => ipcRenderer.invoke('close-app'),

  // Secure AI bridge (keeps API keys in Electron main process env)
  secureAIRequest: (payload) => ipcRenderer.invoke('secure-ai-request', payload),
  
  // Weekly data backups (written by the main process to a real folder)
  backup: {
    getFolder: () => ipcRenderer.invoke('backup:get-folder'),
    chooseFolder: () => ipcRenderer.invoke('backup:choose-folder'),
    write: (payload) => ipcRenderer.invoke('backup:write', payload),
    read: (payload) => ipcRenderer.invoke('backup:read', payload),
    revealFolder: () => ipcRenderer.invoke('backup:reveal-folder'),
  },

  // Local image store (files on disk, not base64 in the database)
  images: {
    write: (payload) => ipcRenderer.invoke('images:write', payload),
    read: (payload) => ipcRenderer.invoke('images:read', payload),
    delete: (payload) => ipcRenderer.invoke('images:delete', payload),
    list: (payload) => ipcRenderer.invoke('images:list', payload),
  },

  // Trading Guardian (Windows desktop only)
  guardian: {
    getStatus: () => ipcRenderer.invoke('guardian:get-status'),
    setEnabled: (enabled) => ipcRenderer.invoke('guardian:set-enabled', enabled),
    setRules: (rules) => ipcRenderer.invoke('guardian:set-rules', rules),
    setProcessName: (name) => ipcRenderer.invoke('guardian:set-process-name', name),
    pickRegion: (key) => ipcRenderer.invoke('guardian:pick-region', key),
    setStartBalance: (payload) => ipcRenderer.invoke('guardian:set-start-balance', payload),
    testRead: () => ipcRenderer.invoke('guardian:test-read'),
    runTest: (name) => ipcRenderer.invoke('guardian:run-test', name),
    getTriggers: (dateKey) => ipcRenderer.invoke('guardian:get-triggers', dateKey),
    openLog: () => ipcRenderer.invoke('guardian:open-log'),
    onStatus: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on('guardian:status', listener);
      return () => ipcRenderer.removeListener('guardian:status', listener);
    },
  },

  // Menu events
  onMenuNewTrade: (callback) => ipcRenderer.on('menu-new-trade', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),
  
  // Remove all listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Expose a safe version of process.platform
contextBridge.exposeInMainWorld('platform', process.platform);
