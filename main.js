

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
const playerWindows = new Set();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Google Fox",
    backgroundColor: "#101116",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile("index.html");
}

ipcMain.handle("open-media-player", (event, url) => {
  if (typeof url !== "string" || url.length > 4096) {
    throw new Error("Invalid media URL");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const player = new BrowserWindow({
    width: 1050,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    title: "Google Fox Media Player",
    backgroundColor: "#090a0e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  playerWindows.add(player);
  player.on("closed", () => playerWindows.delete(player));

  player.loadFile("player.html", {
    query: { url: parsed.href }
  });

  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
