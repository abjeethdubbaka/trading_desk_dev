const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged; // Better way to detect development mode

// Keep a global reference of the window object
let mainWindow;
let splashWindow;
let isShuttingDown = false;
const SPLASH_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Loading TradeDesk</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: "Segoe UI", "Inter", sans-serif;
        color: #e6fbff;
        background:
          radial-gradient(circle at 20% 15%, rgba(16, 185, 129, 0.28), transparent 44%),
          radial-gradient(circle at 84% 75%, rgba(34, 211, 238, 0.24), transparent 42%),
          #070d18;
      }
      .card {
        width: 300px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        background: rgba(10, 18, 31, 0.72);
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.38);
        padding: 18px 20px;
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
      .subtitle {
        margin-top: 6px;
        color: rgba(230, 251, 255, 0.72);
        font-size: 12px;
      }
      .row {
        margin-top: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(230, 251, 255, 0.25);
        border-top-color: #22d3ee;
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
      }
      .status {
        font-size: 12px;
        color: rgba(230, 251, 255, 0.82);
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">TradeDesk</div>
      <div class="subtitle">Booting your workspace...</div>
      <div class="row">
        <div class="spinner"></div>
        <div class="status">Loading modules</div>
      </div>
    </div>
  </body>
</html>`;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 240,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#070d18',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(SPLASH_HTML)}`);
  splashWindow.once('ready-to-show', () => {
    if (!isShuttingDown) {
      splashWindow.show();
    }
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

function shutdownApp(force = false) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  closeSplashWindow();

  if (force) {
    app.exit(0);
    return;
  }

  app.quit();

  // Safety fallback: some Windows shells keep the process alive if child handles remain open.
  const fallbackDelay = process.platform === 'win32' ? 120 : 250;
  setTimeout(() => {
    try {
      app.exit(0);
    } catch (error) {
      process.exit(0);
    }
  }, fallbackDelay);
}

function createWindow() {
  createSplashWindow();

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
    closeSplashWindow();
    mainWindow.show();
  });

  // If page load fails, close splash so the app does not look stuck.
  mainWindow.webContents.on('did-fail-load', () => {
    closeSplashWindow();
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    closeSplashWindow();
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
            shutdownApp();
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
    shutdownApp(true);
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
  shutdownApp(true);
});

// Force quit on SIGTERM
process.on('SIGTERM', () => {
  shutdownApp(true);
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
  shutdownApp();
  return true;
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
