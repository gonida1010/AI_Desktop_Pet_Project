const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.loadURL("http://localhost:5173");
}

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setIgnoreMouseEvents(ignore, { forward: true });
});

app.whenReady().then(createWindow);
