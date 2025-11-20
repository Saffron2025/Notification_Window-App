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

function createWindow() {
  win = new BrowserWindow({
    width: 450,
    height: 380,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  // DevTools (optional)
  win.webContents.openDevTools();

  // Load correct source (dev/prod)
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ⭐  CLOSE = HIDE (background me chalta rahe)
  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide(); // ❗ Window hide but app running
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // ⭐ TRAY ICON (image optional)
  tray = new Tray(null); // You can add icon path later
  tray.setToolTip("Notification Client Running");

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Open Client",
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

// ⭐ Notifier
ipcMain.handle("notify", (event, data) => {
  new Notification({
    title: data.title,
    body: data.body
  }).show();
});

// Quit handler
app.on("before-quit", () => {
  app.isQuiting = true;
});
