/** Serializable scene models, independent of the React client renderer. */
export type Vec3 = readonly [number, number, number];
export type Primitive = "box" | "sphere" | "plane";
export interface SceneObject {
  id: string;
  primitive: Primitive;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  material: { color: string; roughness: number; metalness: number };
}
export interface StudioScene { schemaVersion: 1; objects: SceneObject[] }
const hex = /^#[0-9a-fA-F]{6}$/;
export function validateScene(value: unknown): value is StudioScene {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const scene = value as Partial<StudioScene>;
  if (scene.schemaVersion !== 1 || !Array.isArray(scene.objects) || scene.objects.length > 1500) return false;
  const ids = new Set<string>();
  return scene.objects.every(o => {
    if (typeof o !== "object" || !o || typeof o.id !== "string" || o.id.length > 128 || ids.has(o.id)) return false;
    ids.add(o.id);
    return ["box", "sphere", "plane"].includes(o.primitive) &&
      [o.position, o.rotation, o.scale].every(v => Array.isArray(v) && v.length === 3 &&
        v.every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 10000)) &&
      !!o.material && hex.test(o.material.color) &&
      Number.isFinite(o.material.roughness) && o.material.roughness >= 0 && o.material.roughness <= 1 &&
      Number.isFinite(o.material.metalness) && o.material.metalness >= 0 && o.material.metalness <= 1;
  });
}
