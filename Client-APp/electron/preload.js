const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  notify: (data) => ipcRenderer.invoke("notify", data),
});
