import type { BuilderNode } from "./component-registry";
export type DropTarget = { parentId: string | null; index: number };
export type NodeLocation = DropTarget;
export function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children, id);
    if (nested) return nested;
  }
  return null;
}
export function findLocation(nodes: BuilderNode[], id: string, parentId: string | null = null): NodeLocation | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.id === id) return { parentId, index };
    const nested = findLocation(node.children, id, node.id);
    if (nested) return nested;
  }
  return null;
}
export function insertNode(nodes: BuilderNode[], target: DropTarget, item: BuilderNode): BuilderNode[] {
  if (target.parentId === null) {
    const next = [...nodes]; next.splice(target.index, 0, item); return next;
  }
  let changed = false;
  const result = nodes.map((node) => {
    if (node.id === target.parentId) {
      changed = true;
      const children = [...node.children]; children.splice(target.index, 0, item);
      return { ...node, children };
    }
    const children = insertNode(node.children, target, item);
    if (children !== node.children) { changed = true; return {...node, children}; }
    return node;
  });
  return changed ? result : nodes;
}
export function updateNode(nodes: BuilderNode[], id: string, type: "props" | "style", key: string, value: string): BuilderNode[] {
  let changed = false;
  const result = nodes.map(node => {
    if (node.id === id) {
      if (node[type][key] === value) return node;
      changed = true; return {...node, [type]: {...node[type], [key]: value}};
    }
    const children = updateNode(node.children, id, type, key, value);
    if (children !== node.children) { changed = true; return {...node, children}; }
    return node;
  });
  return changed ? result : nodes;
}
export function detachNode(nodes: BuilderNode[], id: string): {nodes: BuilderNode[]; removed: BuilderNode | null} {
  const idx = nodes.findIndex(node => node.id === id);
  if (idx !== -1) return { nodes: nodes.filter(node => node.id !== id), removed: nodes[idx] };
  for (let i = 0; i < nodes.length; i++) {
    const nested = detachNode(nodes[i].children, id);
    if (nested.removed) return { nodes: nodes.map((node, j) => i === j ? {...node, children: nested.nodes} : node), removed: nested.removed };
  }
  return {nodes, removed: null};
}
export function removeNode(nodes: BuilderNode[], id: string): BuilderNode[] {
  return detachNode(nodes, id).nodes;
}
export function moveNode(nodes: BuilderNode[], id: string, target: DropTarget): BuilderNode[] {
  const location = findLocation(nodes, id);
  const node = findNode(nodes, id);
  if (!location || !node || target.parentId === id) return nodes;
  if (target.parentId && findNode(node.children, target.parentId)) return nodes;
  const nextTarget = {...target};
  if (location.parentId === target.parentId && location.index < target.index) nextTarget.index--;
  if (location.parentId === target.parentId && location.index === nextTarget.index) return nodes;
  const detached = detachNode(nodes, id);
  return detached.removed ? insertNode(detached.nodes, nextTarget, detached.removed) : nodes;
}
