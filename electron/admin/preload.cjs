"use strict";
// Admin shell preload. The production host is baked in here so the isolated
// preload context has it before any SPA script runs (no cross-process globals).
const { expose } = require("@bio/electron-config/preload");

expose({
  apiBase: "https://admin.memeclawai.com",
  cbtApiBase: "https://admin.memeclawai.com/cbt-api",
  portal: "admin",
});
