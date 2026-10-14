"use strict";
// Shared preload logic. Each shell ships a tiny generated preload.cjs that
// calls this with its resolved host baked in, so the values are available in
// the isolated preload context WITHOUT relying on cross-process globals or
// fragile path-query parsing. contextBridge runs before any page script, so
// the SPA sees the host before it evaluates its base URL.
const { contextBridge } = require("electron");

function expose(env) {
  const e = env || {};
  contextBridge.exposeInMainWorld("__ELECTRON_ENV__", {
    VITE_API_BASE: e.apiBase || "",
    VITE_CBT_API_BASE: e.cbtApiBase || "",
    portal: e.portal || "",
  });
}

module.exports = { expose };
