const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fox", {
  openMediaPlayer: (url) =>
    ipcRenderer.invoke("open-media-player", url)
});
