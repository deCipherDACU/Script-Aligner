const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "ScriptAligner",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplifies local file access for this prototype
      webSecurity: false // Allows loading local files in dev mode
    },
    // Icon path relative to where electron is run
    icon: path.join(__dirname, '../public/icons/icon_48.png')
  });

  // Remove the default menu bar for a cleaner, modern look
  win.setMenuBarVisibility(false);

  // Load the built app
  // In production, this loads the index.html from the dist folder
  // In development, you might want to load http://localhost:5173
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  win.loadURL(startUrl);

  // Open external links in browser instead of Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});