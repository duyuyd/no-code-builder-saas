"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, rectIntersection, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CheckCircle2, ChevronDown, CloudUpload, Code2, Download, FileCode2, Layers3, LoaderCircle, Plus, Redo2, Save, Settings2, Undo2, X } from "lucide-react";
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
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function MobileSheet({ open, onOpenChange, title, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-[3px] lg:hidden"/>
      <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 h-[min(82dvh,760px)] max-h-[calc(100dvh-16px)] overflow-hidden rounded-t-[26px] border-t border-slate-600 bg-[#1e293b] shadow-[0_-20px_70px_rgba(0,0,0,0.6)] outline-none lg:hidden">
        <motion.div initial={{ y: 80, opacity: 0.65 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 310, damping: 31 }} className="flex h-full min-h-0 flex-col">
          <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-slate-500" aria-hidden="true"/>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-700/80 px-5 py-3">
            <Dialog.Title className="text-sm font-bold text-white">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">Bảng chỉnh sửa có thể đóng bằng phím Escape hoặc nút Đóng.</Dialog.Description>
            <Dialog.Close className="flex size-9 items-center justify-center rounded-xl bg-slate-700 text-slate-300 transition hover:text-white" aria-label="Đóng ngăn kéo"><X size={19}/></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export default function BuilderWorkspace({ pageId, pagePath, projectName, initialNodes, initialVersion }: {
  pageId: string;
  pagePath: string;
  projectName: string;
  initialNodes: BuilderNode[];
  initialVersion: number;
}) {
  const [state, dispatch] = useReducer(reducer, { nodes: initialNodes, selectedId: null, past: [], future: [] });
  const [dragging, setDragging] = useState("");
  const [status, setStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
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
      for (let index = 0; index < 20; index++) {
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
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") {
        event.preventDefault();
        dispatch({ type: key === "y" || event.shiftKey ? "redo" : "undo" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const selectedNode = state.selectedId ? findNode(state.nodes, state.selectedId) : null;
  const onAdd = (type: string) => {
    dispatch({ type: "add", node: createBuilderNode(type), target: { parentId: null, index: state.nodes.length } });
    if (mobilePaletteOpen) { setMobilePaletteOpen(false); setMobilePropertiesOpen(true); }
  };
  const onSelect = (id: string | null) => {
    dispatch({ type: "select", id });
    if (id) setMobilePropertiesOpen(true);
  };
  const onDelete = (id: string) => {
    dispatch({ type: "delete", id });
    setMobilePropertiesOpen(false);
  };
  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.kind === "palette" && typeof data.type === "string") setDragging(getDefinition(data.type)?.label ?? "Thành phần");
    else if (data?.kind === "node" && typeof data.id === "string") setDragging(getDefinition(findNode(state.nodes, data.id)?.type ?? "")?.label ?? "Thành phần");
  };
  const onDragEnd = (event: DragEndEvent) => {
    setDragging("");
    if (!event.over || event.active.id === event.over.id) return;
    const target = dropTarget(state.nodes, String(event.over.id));
    if (!target) return;
    const data = event.active.data.current;
    if (data?.kind === "palette" && typeof data.type === "string" && getDefinition(data.type)) {
      dispatch({ type: "add", node: createBuilderNode(data.type), target });
      setMobilePaletteOpen(false);
    } else if (data?.kind === "node" && typeof data.id === "string") {
      dispatch({ type: "move", id: data.id, target });
    }
  };
  const iconButtonClass = "flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 sm:size-10";

  return <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0f172a] text-slate-100">
    <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-slate-700/80 bg-[#1e293b] px-3 py-2 sm:px-5">
      <div className="mr-auto min-w-0"><p className="truncate text-xs font-bold text-white sm:text-sm">{projectName}<span className="font-normal text-slate-500"> · {pagePath}</span></p>
        <p role="status" aria-live="polite" className={`mt-0.5 flex items-center gap-1 text-[10px] ${status === "error" ? "text-rose-400" : status === "saved" ? "text-emerald-400" : "text-amber-400"}`}>
          {status === "saving" ? <LoaderCircle size={12} className="animate-spin"/> : status === "saved" ? <CheckCircle2 size={12}/> : <CloudUpload size={12}/>} {status === "saved" ? "Đã lưu vào Supabase" : status === "saving" ? "Đang lưu..." : status === "error" ? "Lưu thất bại" : "Có thay đổi chưa lưu"}
        </p>
      </div>
      <button type="button" onClick={() => dispatch({ type: "undo" })} disabled={!state.past.length} className={iconButtonClass} aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)"><Undo2 size={17}/></button>
      <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} className={iconButtonClass} aria-label="Làm lại" title="Làm lại (Ctrl+Y)"><Redo2 size={17}/></button>
      <button type="button" onClick={() => void flushSave()} disabled={status === "saving"} className="flex h-9 items-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white shadow-md shadow-orange-500/15 transition hover:bg-orange-400 disabled:opacity-60 sm:h-10 sm:px-4"><Save size={16}/><span className="hidden sm:inline">Lưu</span></button>
      <details className="relative">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 text-xs font-semibold text-slate-100 transition hover:bg-slate-600 sm:h-10 [&::-webkit-details-marker]:hidden"><Download size={16}/><span className="hidden sm:inline">Xuất mã</span><ChevronDown size={14} className="hidden sm:block"/></summary>
        <div className="absolute right-0 z-30 mt-2 w-44 space-y-1 rounded-xl border border-slate-600 bg-[#1e293b] p-2 shadow-2xl">
          <button type="button" onClick={() => downloadFile("page.tsx", generateReactCode(state.nodes), "text/typescript")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-700"><Code2 size={16} className="text-orange-400"/> Xuất React</button>
          <button type="button" onClick={() => downloadFile("page.html", generateHtmlCode(state.nodes, projectName), "text/html")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-700"><FileCode2 size={16} className="text-orange-400"/> Xuất HTML</button>
        </div>
      </details>
    </div>
    {status === "error" && <p role="alert" className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">{errorMessage}</p>}
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging("")}>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[270px_minmax(0,1fr)_320px]">
        <div className="hidden min-h-0 lg:block"><ComponentPalette onAdd={onAdd}/></div>
        <BuilderCanvas nodes={state.nodes} selectedId={state.selectedId} onSelect={onSelect} onRequestAdd={() => setMobilePaletteOpen(true)}/>
        <div className="hidden min-h-0 lg:block"><PropertiesPanel node={selectedNode} onChange={(id, field, key, value) => dispatch({ type: "edit", id, field, key, value })} onDelete={onDelete}/></div>
      </div>
      <DragOverlay dropAnimation={null} zIndex={70}>
        {dragging && <motion.div initial={{ scale: 0.95, opacity: 0.75 }} animate={{ scale: 1.02, opacity: 0.94 }} className="rounded-xl border border-orange-400 bg-[#1e293b] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)]">{dragging}</motion.div>}
      </DragOverlay>
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-700 bg-[#1e293b] px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <button type="button" onClick={() => setMobilePaletteOpen(true)} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-400"><Plus size={19}/> Thêm thành phần</button>
        <button type="button" onClick={() => setMobilePropertiesOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"><Settings2 size={17}/> Thuộc tính</button>
      </div>
      <MobileSheet open={mobilePaletteOpen} onOpenChange={setMobilePaletteOpen} title="Thêm thành phần">
        <ComponentPalette onAdd={onAdd}/>
      </MobileSheet>
      <MobileSheet open={mobilePropertiesOpen} onOpenChange={setMobilePropertiesOpen} title="Chỉnh sửa thành phần">
        <PropertiesPanel node={selectedNode} onChange={(id, field, key, value) => dispatch({ type: "edit", id, field, key, value })} onDelete={onDelete}/>
      </MobileSheet>
    </DndContext>
  </section>;
}
