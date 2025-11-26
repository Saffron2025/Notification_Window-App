const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  notify: (data) => ipcRenderer.invoke("notify", data),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (e, ...args) => func(...args));
  }
});

