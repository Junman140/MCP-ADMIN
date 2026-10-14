"use strict";
// Shared runtime configuration for the Electron desktop shells.
//
// This is plain CommonJS, not TypeScript. Electron's default loader runs the
// main process with Node's CJS module system, which cannot execute .ts files,
// and the repo's **/dist/ ignore rule means a compiled dist/ would not survive
// a fresh clone. Keeping these files as .cjs/.js makes `electron .` work from
// a clean checkout with no build step. Only erasable JSDoc types are used.

/** Origin of the production API, behind the Cloudflare tunnel. */
const DEFAULT_API_HOST = "https://admin.memeclawai.com";

/**
 * The CBT API is reached via the "/cbt-api" path on the same host in
 * production (Caddy routes /cbt-api/ -> cbt-api). We derive it from the API
 * host so a single --api-host flag configures both backends.
 *
 * @param {string} apiHost
 * @returns {string}
 */
function cbtHostFrom(apiHost) {
  return `${apiHost.replace(/\/+$/, "")}/cbt-api`;
}

/**
 * @typedef {"admin" | "lecturer" | "student"} PortalKind
 */

/**
 * Per-portal window metadata. Every PortalKind must be present.
 *
 * @type {Record<PortalKind, { title: string, width: number, height: number }>}
 */
const PORTAL_META = {
  admin: { title: "MCP School Admin", width: 1440, height: 900 },
  lecturer: { title: "MCP Lecturer Portal", width: 1360, height: 860 },
  student: { title: "MCP Student LMS", width: 1360, height: 860 },
};

module.exports = {
  DEFAULT_API_HOST,
  PORTAL_META,
  cbtHostFrom,
};
