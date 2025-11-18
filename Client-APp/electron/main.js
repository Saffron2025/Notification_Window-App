const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 380,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL("http://localhost:5173");
}

ipcMain.handle("notify", (event, data) => {
  new Notification({
    title: data.title,
    body: data.body
  }).show();
});

app.whenReady().then(createWindow);
