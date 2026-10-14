"use strict";
// CJS bootstrap for the lecturer desktop shell. Electron's default loader cannot
// execute TypeScript, so this thin entry requires the compiled shared factory
// and opens the lecturer portal window.
const { app, BrowserWindow } = require("electron");
const { createPortalWindow } = require("@bio/electron-config/main");

app.whenReady().then(() => {
  createPortalWindow("lecturer");

  // macOS convention: re-open a window when the dock icon is clicked.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createPortalWindow("lecturer");
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
