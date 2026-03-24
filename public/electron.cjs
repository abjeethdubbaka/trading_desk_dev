const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged; // Better way to detect development mode

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'), // You'll need to add an icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default', // Use default Windows title bar
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true, // Hide menu bar by default
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5176');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Check if it's an internal app navigation
    const appUrl = 'http://localhost:5176';
    if (url.startsWith(appUrl)) {
      // Extract the path and navigate internally
      const path = url.replace(appUrl, '');
      mainWindow.webContents.executeJavaScript(`
        window.location.hash = '${path}';
      `);
      return { action: 'deny' };
    }
    
    // Handle external links
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Trade',
          accelerator: 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-trade');
          }
        },
        {
          label: 'Exit',
          accelerator: process.platform === 'win32' ? 'Alt+F4' : 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
            // Force quit for Windows to prevent terminal hanging
            if (process.platform === 'win32') {
              setTimeout(() => process.exit(0), 100);
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Force quit the process to prevent terminal hanging
    app.quit();
    // Additional force quit for Windows
    if (process.platform === 'win32') {
      process.exit(0);
    }
  }
});

// Handle all windows closed event
app.on('before-quit', (event) => {
  // Clean up any resources before quitting
  if (mainWindow) {
    mainWindow.removeAllListeners();
  }
});

// Force quit on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  app.quit();
  process.exit(0);
});

// Force quit on SIGTERM
process.on('SIGTERM', () => {
  app.quit();
  process.exit(0);
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('close-app', async () => {
  app.quit();
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
