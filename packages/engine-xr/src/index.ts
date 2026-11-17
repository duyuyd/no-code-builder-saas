/** Browser capability check; call only after mounting on a client. */
export type XrMode = "immersive-ar" | "immersive-vr";
export async function xrSupported(mode: XrMode): Promise<boolean> {
  if (typeof navigator === "undefined" || !("xr" in navigator)) return false;
  const xr = (navigator as Navigator & { xr?: { isSessionSupported: (mode: XrMode) => Promise<boolean> } }).xr;
  if (!xr) return false;
  try { return await xr.isSessionSupported(mode); } catch { return false; }
}
