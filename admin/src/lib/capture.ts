export type BridgePingOk = { ok: true; vendor: string; scanner: string };
export type BridgePingFail = { ok: false; reason: string };
export type BridgePingResult = BridgePingOk | BridgePingFail;

export async function pingBridge(bridgeUrl: string): Promise<BridgePingResult> {
  const url = `${bridgeUrl.replace(/\/$/, "")}/health`;
  let r: Response;
  try {
    r = await fetch(url, { method: "GET" });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const network =
      /failed to fetch|networkerror|load failed|network request failed/i.test(raw);
    return {
      ok: false,
      reason: network
        ? "No response from the bridge. Start it on this PC (e.g. pnpm dev:bridge inside the repo). If you opened the admin site from another device, 127.0.0.1 points at that device—not the scanner PC—use local admin or file upload."
        : raw,
    };
  }

  const text = await r.text();
  let j: { status?: string; message?: string; scanner?: string; vendor?: string } = {};
  try {
    j = JSON.parse(text) as typeof j;
  } catch {
    /* non-JSON body */
  }

  if (!r.ok) {
    const detail =
      typeof j.message === "string" && j.message.trim()
        ? j.message.trim()
        : text.trim().slice(0, 280) || `HTTP ${r.status}`;
    return {
      ok: false,
      reason:
        r.status >= 500
          ? `${detail} The bridge process is up but not healthy (often missing Futronic SDK DLLs or VC++ runtime next to ftrScanAPI.dll).`
          : detail,
    };
  }

  if (j.status === "error") {
    return { ok: false, reason: j.message || "Bridge reported an error" };
  }

  return {
    ok: true,
    vendor: j.vendor || "unknown",
    scanner: j.scanner || "scanner",
  };
}

export async function captureFromBridge(bridgeUrl: string) {
  const url = `${bridgeUrl.replace(/\/$/, "")}/capture`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Capture bridge ${r.status}: ${t}`);
  }
  const j = await r.json();
  if (!j.imageBase64 || typeof j.width !== "number" || typeof j.height !== "number") {
    throw new Error("Capture bridge returned invalid payload (need imageBase64, width, height)");
  }
  return {
    base64: j.imageBase64,
    width: j.width,
    height: j.height,
    dpi: j.dpi ?? 500,
    format: j.format || "png", // Get format from bridge, default to png
  };
}
