/** Pure, deterministic timeline evaluator. No DOM, WebGL or network access. */
export type AnimationPath = "position.x" | "position.y" | "position.z" |
  "rotation.x" | "rotation.y" | "rotation.z" |
  "scale.x" | "scale.y" | "scale.z";
export type Interpolation = "linear" | "step";
export interface Keyframe {
  id: string;
  objectId: string;
  path: AnimationPath;
  timeMs: number;
  value: number;
  interpolation: Interpolation;
}
export interface Timeline {
  schemaVersion: 1;
  durationMs: number;
  keyframes: Keyframe[];
}
const paths = new Set<string>(["position.x","position.y","position.z","rotation.x","rotation.y","rotation.z","scale.x","scale.y","scale.z"]);
export function validateTimeline(value: unknown): value is Timeline {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const t = value as Partial<Timeline>;
  if (t.schemaVersion !== 1 || !Number.isSafeInteger(t.durationMs) || t.durationMs! < 0 ||
      t.durationMs! > 3_600_000 || !Array.isArray(t.keyframes) || t.keyframes.length > 10000) return false;
  const ids = new Set<string>();
  return t.keyframes.every(k => !!k && typeof k.id === "string" && k.id.length > 0 && !ids.has(k.id) &&
    (ids.add(k.id), true) && typeof k.objectId === "string" && k.objectId.length > 0 &&
    paths.has(k.path) && Number.isSafeInteger(k.timeMs) && k.timeMs >= 0 && k.timeMs <= t.durationMs! &&
    Number.isFinite(k.value) && Math.abs(k.value) <= 10000 &&
    (k.interpolation === "linear" || k.interpolation === "step"));
}
export function evaluateTimeline(timeline: Timeline, timeMs: number): Record<string, number> {
  if (!validateTimeline(timeline)) throw new TypeError("Invalid timeline");
  if (!Number.isFinite(timeMs)) throw new TypeError("Invalid time");
  const time = Math.max(0, Math.min(timeline.durationMs, timeMs));
  const grouped = new Map<string, Keyframe[]>();
  for (const frame of timeline.keyframes) {
    const key = frame.objectId + ":" + frame.path;
    const group = grouped.get(key) ?? [];
    group.push(frame);
    grouped.set(key, group);
  }
  const result: Record<string, number> = {};
  for (const [key, frames] of grouped) {
    frames.sort((a,b) => a.timeMs - b.timeMs || a.id.localeCompare(b.id));
    const first = frames[0];
    const last = frames[frames.length - 1];
    if (time <= first.timeMs) { result[key] = first.value; continue; }
    if (time >= last.timeMs) { result[key] = last.value; continue; }
    for (let i = 1; i < frames.length; i++) {
      if (frames[i].timeMs < time) continue;
      const a = frames[i-1], b = frames[i];
      const f = (time - a.timeMs) / (b.timeMs - a.timeMs);
      result[key] = a.interpolation === "step" ? a.value : a.value + (b.value - a.value) * f;
      break;
    }
  }
  return result;
}
