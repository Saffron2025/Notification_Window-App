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

  if (process.env.NODE_ENV === "development") {
    // DEV MODE
    win.loadURL("http://localhost:5173");
  } else {
    // PRODUCTION MODE
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("notify", (event, data) => {
  new Notification({ title: data.title, body: data.body }).show();
});

app.whenReady().then(createWindow);
