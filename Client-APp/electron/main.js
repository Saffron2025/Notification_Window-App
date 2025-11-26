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


function showCustomNotification(title, body) {
  const notifyWin = new BrowserWindow({
    width: 350,
    height: 110,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    x: 1000,  // right bottom corner approx
    y: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    }
  });

  notifyWin.loadFile(path.join(__dirname, "notification.html"));

  // Pass data to window
  notifyWin.webContents.on("did-finish-load", () => {
    notifyWin.webContents.send("notify-data", { title, body });
  });
}


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
  minWidth: 430,
  minHeight: 360,
  show: false,
  resizable: true,        // ⭐ MUST BE TRUE
  maximizable: true,       // ⭐ Ensure maximize allowed
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
  showCustomNotification(data.title, data.body);
});


/* ---------------------------------------------------------
   ✔ Quit Handling
--------------------------------------------------------- */
app.on("before-quit", () => (app.isQuiting = true));
