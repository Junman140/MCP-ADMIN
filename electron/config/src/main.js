"use strict";
// Reusable Electron main-process factory shared by the admin/lecturer/student
// desktop shells. Plain CommonJS on purpose — see the note in ./index.js.
//
// __dirname here is MCP-ADMIN/electron/config/src, so three levels up is
// MCP-ADMIN: src -> config -> electron -> MCP-ADMIN.
const { BrowserWindow, session, shell } = require("electron");
const { join } = require("node:path");
const {
  DEFAULT_API_HOST,
  PORTAL_META,
  cbtHostFrom,
} = require("./index.js");

const MCP_ADMIN_ROOT = join(__dirname, "..", "..", "..");

/**
 * resolveApiHost picks the backend origin for this run: --api-host=... flag,
 * then ELECTRON_API_HOST env, then the packaged default.
 *
 * @param {string[]} argv
 * @returns {string}
 */
function resolveApiHost(argv) {
  const flag = argv.find((a) => a.startsWith("--api-host="));
  if (flag) return flag.slice("--api-host=".length).replace(/\/+$/, "");
  const env = process.env.ELECTRON_API_HOST;
  if (env) return env.replace(/\/+$/, "");
  return DEFAULT_API_HOST;
}

/**
 * buildCsp restricts the renderer to its own bundle plus the resolved API
 * hosts. Network, images, and media may only reach the configured backend.
 *
 * @param {string} apiHost
 * @returns {string}
 */
function buildCsp(apiHost) {
  const connect = [apiHost, cbtHostFrom(apiHost)].join(" ");
  return [
    "default-src 'self'",
    `connect-src 'self' ${connect}`,
    `img-src 'self' data: blob: ${apiHost}`,
    `media-src 'self' blob: ${apiHost}`,
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * createPortalWindow boots one desktop shell. portal selects the SPA to load
 * (which sibling dist/ to read) and the preload to inject the API host with.
 *
 * @param {import("./index.js").PortalKind} portal
 */
function createPortalWindow(portal) {
  const apiHost = resolveApiHost(process.argv);
  const meta = PORTAL_META[portal];

  // Inject a strict CSP on every response the renderer receives.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [buildCsp(apiHost)],
      },
    });
  });

  // Deny every risky permission request (camera/mic/geolocation/etc). Biometric
  // capture uses a local bridge on localhost, not the web platform APIs.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => {
    cb(false);
  });

  const win = new BrowserWindow({
    title: meta.title,
    width: meta.width,
    height: meta.height,
    backgroundColor: "#0b1020",
    autoHideMenuBar: true,
    webPreferences: {
      // Each shell ships its own preload.cjs (with the host baked in) that
      // calls the shared config's expose(). contextIsolation keeps it isolated
      // from the page; the preload still runs before any SPA script.
      preload: join(MCP_ADMIN_ROOT, "electron", portal, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      // Preload sandboxing is off so preload.cjs can require the shared
      // "@bio/electron-config/preload" module from node_modules. Sandboxed
      // preloads may only require a few built-ins and cannot resolve packages.
      // contextIsolation stays on and nodeIntegration stays off, so the page
      // still has no Node access.
      sandbox: false,
      spellcheck: false,
    },
  });

  // External links open in the system browser, never inside the shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Load the sibling SPA's Vite build. Each shell lives at
  // MCP-ADMIN/electron/<portal>/, and its SPA build at
  // MCP-ADMIN/<portal>/dist/index.html.
  void win.loadFile(join(MCP_ADMIN_ROOT, portal, "dist", "index.html"));
}

module.exports = { createPortalWindow };
