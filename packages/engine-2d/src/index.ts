/** Compatibility classification for the existing 2D component registry.
 * The original lib/component-registry.ts stays canonical until monorepo migration.
 */
export type EngineDimension = "2d" | "3d" | "ai";
export type ClassifiedComponent = { type: string; engine: EngineDimension; tags: readonly string[] };
export function classifyLegacyComponent(type: string): ClassifiedComponent {
  if (!type.trim()) throw new Error("Component type is required");
  return { type, engine: "2d", tags: ["legacy", "preserved"] };
}
