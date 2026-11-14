import type { BuilderNode } from "./component-registry";
import { findLocation, findNode, insertNode, moveNode, removeNode, updateNode } from "./builder-tree";

type Position = { node: BuilderNode; parentId: string | null; index: number; depth: number };

/** Merge independently edited UI trees without discarding another tab's changes.
 * Returns null if both editors changed the same value, deleted a modified node,
 * or changed existing sibling order. Never silently picks a winner in a conflict.
 */
export function mergeUiTrees(base: BuilderNode[], local: BuilderNode[], remote: BuilderNode[]): BuilderNode[] | null {
  if (JSON.stringify(base) === JSON.stringify(remote)) return local;
  if (JSON.stringify(base) === JSON.stringify(local)) return remote;

  function indexTree(nodes: BuilderNode[]): Map<string, Position> {
    const result = new Map<string, Position>();
    function visit(children: BuilderNode[], parentId: string | null, depth: number): void {
      children.forEach((node, index) => {
        result.set(node.id, { node, parentId, index, depth });
        visit(node.children, node.id, depth + 1);
      });
    }
    visit(nodes, null, 0);
    return result;
  }
  const before = indexTree(base);
  const edited = indexTree(local);
  const onServer = indexTree(remote);

  // Reordering old siblings needs explicit review rather than dropping the move.
  for (const [parentId, parent] of [[null, base] as const, ...[...before.values()].map(x => [x.node.id, x.node.children] as const)]) {
    const oldIds = parent.map(n => n.id).filter(id => edited.has(id) && edited.get(id)?.parentId === parentId);
    const current = (parentId ? edited.get(parentId)?.node.children : local) ?? [];
    const changedOrder = current.map(n => n.id).filter(id => oldIds.includes(id));
    if (oldIds.join("|") !== changedOrder.join("|")) return null;
  }

  let merged = remote;
  // Apply deletions, deepest-first. A remote modification blocks deletion.
  for (const [id, original] of [...before].sort((a, b) => b[1].depth - a[1].depth)) {
    if (edited.has(id)) continue;
    const newer = onServer.get(id);
    if (!newer) continue;
    if (newer.parentId !== original.parentId || JSON.stringify(newer.node) !== JSON.stringify(original.node)) return null;
    merged = removeNode(merged, id);
  }

  for (const [id, original] of before) {
    const candidate = edited.get(id);
    if (!candidate) continue;
    const newer = onServer.get(id);
    if (!newer) {
      // Another tab deleted it; only safe to accept if this tab did not edit it.
      if (candidate.parentId !== original.parentId || JSON.stringify(candidate.node) !== JSON.stringify(original.node)) return null;
      continue;
    }
    if (candidate.parentId !== original.parentId) {
      // Move safely only if another editor has not moved it elsewhere.
      if (newer.parentId !== original.parentId && newer.parentId !== candidate.parentId) return null;
      if (newer.parentId === original.parentId) {
        if (candidate.parentId && !findNode(merged, candidate.parentId)) return null;
        const target = { parentId: candidate.parentId, index: candidate.index };
        merged = moveNode(merged, id, target);
      }
    }
    for (const field of ["props", "style"] as const) {
      const baseline = original.node[field];
      const mine = candidate.node[field];
      const theirs = newer.node[field];
      for (const key of new Set([...Object.keys(baseline), ...Object.keys(mine)])) {
        const oldValue = baseline[key];
        const newValue = mine[key];
        if (oldValue === newValue) continue;
        if (theirs[key] !== oldValue && theirs[key] !== newValue) return null;
        if (newValue === undefined) return null;
        if (!findNode(merged, id)) return null;
        merged = updateNode(merged, id, field, key, newValue);
      }
    }
  }

  // Add top-level additions, preserving nested children and nearest siblings.
  // Never create a second copy of an added child.
  function addNew(nodes: BuilderNode[], parentId: string | null): boolean {
    for (const [index, node] of nodes.entries()) {
      if (!before.has(node.id)) {
        if (findNode(merged, node.id)) return false;
        if (parentId && !findNode(merged, parentId)) return false;
        let insertIndex = parentId ? (findNode(merged, parentId)?.children.length ?? 0) : merged.length;
        const siblings = parentId ? edited.get(parentId)?.node.children ?? [] : local;
        for (let i = index + 1; i < siblings.length; i++) {
          const location = findLocation(merged, siblings[i].id);
          if (location?.parentId === parentId) { insertIndex = location.index; break; }
        }
        merged = insertNode(merged, { parentId, index: insertIndex }, node);
      } else if (!addNew(node.children, node.id)) {
        return false;
      }
    }
    return true;
  }
  return addNew(local, null) ? merged : null;
}
