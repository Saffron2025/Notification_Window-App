const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  Menu
} = require("electron");

const path = require("path");

let win;
let tray;

// ⭐⭐⭐ PREVENT MULTIPLE APP INSTANCES
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
  process.exit(0);
}

// If user opens app again → show previous window
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
  }
});

function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 360,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  win.once("ready-to-show", () => win.show());

  // Dev tools (optional)
  // win.webContents.openDevTools();

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ❗ Close = MINIMIZE (background me rahega)
  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // ⭐ TRAY ICON
  tray = new Tray(path.join(__dirname, "icon.png")); // your icon
  tray.setToolTip("Notification Client");

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => win.show()
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(trayMenu);
});

// IPC Notification
ipcMain.handle("notify", (event, data) => {
  new Notification({
    title: data.title,
    body: data.body
  }).show();
});

app.on("before-quit", () => (app.isQuiting = true));
