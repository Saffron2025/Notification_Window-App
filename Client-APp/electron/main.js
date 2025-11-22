const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  Menu
} = require("electron");

const AutoLaunch = require("auto-launch"); // ⭐ Auto Launch
const path = require("path");

let win;
let tray;

/* ---------------------------------------------------------
   ✔ Prevent multiple app instances
--------------------------------------------------------- */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
  }
});

/* ---------------------------------------------------------
   ✔ Enable Auto Launch on Windows startup
--------------------------------------------------------- */
const autoLauncher = new AutoLaunch({
  name: "Notification Client",
  path: process.execPath
});

autoLauncher.isEnabled().then(isEnabled => {
  if (!isEnabled) autoLauncher.enable();
});

/* ---------------------------------------------------------
   ✔ Create Window 
--------------------------------------------------------- */
function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 360,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  win.once("ready-to-show", () => win.show());

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ❗ Window close → only hide (background me chalega)
  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
}

/* ---------------------------------------------------------
   ✔ Create Tray icon
--------------------------------------------------------- */
function createTray() {
  tray = new Tray(path.join(__dirname, "icon.png"));

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Notification Client",
      click: () => win.show()
    },
    {
      label: "Quit App",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Notification Client");
  tray.setContextMenu(trayMenu);

  // Click on tray = show window
  tray.on("click", () => win.show());
}

/* ---------------------------------------------------------
   ✔ App ready
--------------------------------------------------------- */
app.whenReady().then(() => {
  createWindow();
  createTray();
});

/* ---------------------------------------------------------
   ✔ Notification handler (called from React frontend)
--------------------------------------------------------- */
ipcMain.handle("notify", (event, data) => {
  new Notification({
    title: data.title,
    body: data.body
  }).show();
});

/* ---------------------------------------------------------
   ✔ Quit Handling
--------------------------------------------------------- */
app.on("before-quit", () => (app.isQuiting = true));
