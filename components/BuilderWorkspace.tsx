"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, rectIntersection, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Save, Undo2, Redo2, Code, FileCode2, CheckCircle2 } from "lucide-react";
import ComponentPalette from "./ComponentPalette";
import BuilderCanvas from "./BuilderCanvas";
import PropertiesPanel from "./PropertiesPanel";
import { createBuilderNode, getDefinition, type BuilderNode } from "@/lib/component-registry";
import { findLocation, findNode, insertNode, moveNode, removeNode, updateNode, type DropTarget } from "@/lib/builder-tree";
import { generateHtmlCode, generateReactCode } from "@/lib/code-generator";
import { savePageTree } from "@/app/builder/actions";

type History = { past: BuilderNode[][]; nodes: BuilderNode[]; future: BuilderNode[][]; selectedId: string | null };
type Action =
  | { type: "select"; id: string | null }
  | { type: "add"; node: BuilderNode; target: DropTarget }
  | { type: "edit"; id: string; field: "props" | "style"; key: string; value: string }
  | { type: "delete"; id: string }
  | { type: "move"; id: string; target: DropTarget }
  | { type: "undo" } | { type: "redo" };
function commit(state: History, nodes: BuilderNode[], selectedId: string | null = state.selectedId): History {
  if (nodes === state.nodes) return state;
  return { nodes, selectedId, past: [...state.past.slice(-49), state.nodes], future: [] };
}
function reducer(state: History, action: Action): History {
  switch (action.type) {
    case "select": return { ...state, selectedId: action.id };
    case "add": return commit(state, insertNode(state.nodes, action.target, action.node), action.node.id);
    case "edit": return commit(state, updateNode(state.nodes, action.id, action.field, action.key, action.value));
    case "delete": {
      const nodes = removeNode(state.nodes, action.id);
      return commit(state, nodes, state.selectedId && findNode(nodes, state.selectedId) ? state.selectedId : null);
    }
    case "move": return commit(state, moveNode(state.nodes, action.id, action.target), action.id);
    case "undo": {
      if (!state.past.length) return state;
      const nodes = state.past[state.past.length - 1];
      return { nodes, selectedId: state.selectedId && findNode(nodes, state.selectedId) ? state.selectedId : null,
        past: state.past.slice(0, -1), future: [state.nodes, ...state.future] };
    }
    case "redo": {
      if (!state.future.length) return state;
      const nodes = state.future[0];
      return { nodes, selectedId: state.selectedId && findNode(nodes, state.selectedId) ? state.selectedId : null,
        past: [...state.past.slice(-49), state.nodes], future: state.future.slice(1) };
    }
  }
}
const collisionDetection: CollisionDetection = args => {
  const pointer = pointerWithin(args);
  if (pointer.length) {
    const inside = pointer.filter(hit => String(hit.id).startsWith("inside:"));
    if (inside.length) return inside;
    const nodes = pointer.filter(hit => String(hit.id).startsWith("node:"));
    if (nodes.length) return nodes;
    return pointer;
  }
  return rectIntersection(args);
};
function dropTarget(nodes: BuilderNode[], overId: string): DropTarget | null {
  if (overId === "canvas-root") return { parentId: null, index: nodes.length };
  if (overId.startsWith("inside:")) {
    const parentId = overId.slice(7);
    const parent = findNode(nodes, parentId);
    return parent && getDefinition(parent.type)?.allowsChildren ? { parentId, index: parent.children.length } : null;
  }
  if (overId.startsWith("node:")) return findLocation(nodes, overId.slice(5));
  return null;
}
function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
export default function BuilderWorkspace({ pageId, pagePath, projectName, initialNodes, initialVersion }: {
  pageId: string; pagePath: string; projectName: string; initialNodes: BuilderNode[]; initialVersion: number;
}) {
  const [state, dispatch] = useReducer(reducer, { nodes: initialNodes, selectedId: null, past: [], future: [] });
  const [dragging, setDragging] = useState("");
  const [status, setStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const latestNodes = useRef(state.nodes);
  const savedTree = useRef(JSON.stringify(initialNodes));
  const version = useRef(initialVersion);
  const isSaving = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const flushSave = useCallback(async () => {
    if (isSaving.current) return;
    if (savedTree.current === JSON.stringify(latestNodes.current)) { setStatus("saved"); return; }
    isSaving.current = true;
    setStatus("saving");
    try {
      for (let i=0; i<20; i++) {
        const snapshot = latestNodes.current;
        const serialized = JSON.stringify(snapshot);
        if (savedTree.current === serialized) break;
        const result = await savePageTree(pageId, snapshot, version.current);
        if (!result.ok) throw new Error(result.error);
        version.current = result.version;
        savedTree.current = serialized;
      }
      setStatus(savedTree.current === JSON.stringify(latestNodes.current) ? "saved" : "unsaved");
      setErrorMessage("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Không thể lưu trang.");
    } finally {
      isSaving.current = false;
    }
  }, [pageId]);
  useEffect(() => {
    latestNodes.current = state.nodes;
    if (savedTree.current === JSON.stringify(state.nodes)) return;
    setStatus("unsaved");
    const timer = window.setTimeout(() => { void flushSave(); }, 2000);
    return () => window.clearTimeout(timer);
  }, [state.nodes, flushSave]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" || k === "y") { e.preventDefault(); dispatch({type: k === "y" || e.shiftKey ? "redo" : "undo"}); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const selectedNode = state.selectedId ? findNode(state.nodes, state.selectedId) : null;
  const onAdd = (type: string) => dispatch({type:"add", node:createBuilderNode(type), target:{parentId:null,index:state.nodes.length}});
  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.kind === "palette" && typeof data.type === "string") setDragging(getDefinition(data.type)?.label ?? "Component");
    else if (data?.kind === "node" && typeof data.id === "string") setDragging(getDefinition(findNode(state.nodes,data.id)?.type ?? "")?.label ?? "Component");
  };
  const onDragEnd = (event: DragEndEvent) => {
    setDragging("");
    if (!event.over || event.active.id === event.over.id) return;
    const target = dropTarget(state.nodes, String(event.over.id));
    if (!target) return;
    const data = event.active.data.current;
    if (data?.kind === "palette" && typeof data.type === "string" && getDefinition(data.type)) {
      dispatch({ type:"add", node:createBuilderNode(data.type), target });
    } else if (data?.kind === "node" && typeof data.id === "string") {
      dispatch({ type:"move", id:data.id, target });
    }
  };
  return <section className="flex min-h-0 flex-1 flex-col">
    <div className="flex flex-wrap items-center gap-2 border-b bg-white px-4 py-2 text-xs">
      <span className="mr-auto font-semibold">{projectName} · {pagePath}</span>
      <span role="status" className={status === "error" ? "text-red-600" : status === "saved" ? "text-emerald-700" : "text-amber-700"}>
        {status === "saved" ? <span className="flex items-center gap-1"><CheckCircle2 size={13}/>Đã lưu Supabase</span> : status === "saving" ? "Đang lưu..." : status === "error" ? "Lỗi lưu" : "Chưa lưu"}
      </span>
      <button title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!state.past.length} onClick={() => dispatch({type:"undo"})} className="rounded border p-2 disabled:opacity-30"><Undo2 size={16}/></button>
      <button title="Redo (Ctrl+Y)" aria-label="Redo" disabled={!state.future.length} onClick={() => dispatch({type:"redo"})} className="rounded border p-2 disabled:opacity-30"><Redo2 size={16}/></button>
      <button onClick={() => void flushSave()} className="brand-bg flex items-center gap-1 rounded px-3 py-2 font-semibold text-white"><Save size={15}/>Lưu</button>
      <button onClick={() => downloadFile("page.tsx", generateReactCode(state.nodes), "text/typescript")} className="flex items-center gap-1 rounded border px-2 py-2"><Code size={15}/>React</button>
      <button onClick={() => downloadFile("page.html", generateHtmlCode(state.nodes, projectName), "text/html")} className="flex items-center gap-1 rounded border px-2 py-2"><FileCode2 size={15}/>HTML</button>
    </div>
    {status === "error" && <p role="alert" className="bg-red-50 px-4 py-2 text-xs text-red-700">{errorMessage}</p>}
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging("")}>
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[180px_minmax(0,1fr)_220px] lg:grid-cols-[245px_minmax(0,1fr)_300px] lg:grid-rows-1">
        <ComponentPalette onAdd={onAdd}/>
        <BuilderCanvas nodes={state.nodes} selectedId={state.selectedId} onSelect={id => dispatch({type:"select",id})}/>
        <PropertiesPanel node={selectedNode} onChange={(id, field, key, value) => dispatch({type:"edit",id,field,key,value})} onDelete={id => dispatch({type:"delete",id})}/>
      </div>
      <DragOverlay dropAnimation={null}>{dragging && <div className="rounded-lg border-2 border-orange-500 bg-white px-5 py-3 text-sm shadow-xl">{dragging}</div>}</DragOverlay>
    </DndContext>
  </section>;
}
