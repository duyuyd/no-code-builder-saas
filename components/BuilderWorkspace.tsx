"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CheckCircle2, ChevronDown, CloudUpload, Code2, Download, Eye, ExternalLink, Globe2, Monitor, Smartphone, Tablet, Rocket, FileCode2, LoaderCircle, Plus, Redo2, Save, Settings2, Undo2, X } from "lucide-react";
import ComponentPalette from "./ComponentPalette";
import BuilderCanvas from "./BuilderCanvas";
import PropertiesPanel from "./PropertiesPanel";
import { createBuilderNode, getDefinition, validateUiTree, type BuilderNode } from "@/lib/component-registry";
import type { ComponentPreset } from "@/lib/component-presets";
import { mergeUiTrees } from "@/lib/merge-ui-tree";
import { findLocation, findNode, insertNode, moveNode, removeNode, updateNode, type DropTarget } from "@/lib/builder-tree";
import { generateHtmlCode, generateReactCode } from "@/lib/code-generator";
import { savePageTree, publishProject, unpublishProject } from "@/app/builder/actions";
import LivePage from "./LivePage";

import dynamic from "next/dynamic";
import BuilderTour from "./BuilderTour";
import FigmaImportPanel from "./studio/FigmaImportPanel";
import CollaborationPanel from "./studio/CollaborationPanel";
import {useCollaborativeCanvas} from "@/lib/collab/useCollaborativeCanvas";
const ThreeStudio = dynamic(() => import("./studio/ThreeStudio"), { ssr: false, loading: () => <div role="status" className="p-5 text-slate-300">Đang tải trình biên tập 3D…</div> });

type History = { past: BuilderNode[][]; nodes: BuilderNode[]; future: BuilderNode[][]; selectedId: string | null };
type Action =
  | { type: "restore"; nodes: BuilderNode[] }
  | { type: "select"; id: string | null }
  | { type: "add"; node: BuilderNode; target: DropTarget }
  | { type: "edit"; id: string; field: "props" | "style"; key: string; value: string }
  | { type: "preset"; id: string; preset: ComponentPreset }
  | { type: "delete"; id: string }
  | { type: "move"; id: string; target: DropTarget }
  | { type: "nudge"; id:string; direction:-1|1 }
  | { type: "duplicate"; id:string }
  | { type: "undo" } | { type: "redo" };

function countNodes(node:BuilderNode):number{
 return 1+node.children.reduce((sum,child)=>sum+countNodes(child),0);
}
function commit(state: History, nodes: BuilderNode[], selectedId: string | null = state.selectedId): History {
  if (nodes === state.nodes) return state;
  return { nodes, selectedId, past: [...state.past.slice(-49), state.nodes], future: [] };
}
function fillEmptyContainer(nodes:BuilderNode[],id:string,children:BuilderNode[]):BuilderNode[]{
  return nodes.map(n=>{
    if(n.id===id)return {...n,children};
    if(!n.children.length)return n;
    return {...n,children:fillEmptyContainer(n.children,id,children)};
  });
}
function cloneNodes(nodes:BuilderNode[]):BuilderNode[]{
  return nodes.map(n=>({...n,id:crypto.randomUUID(),props:{...n.props},style:{...n.style},children:cloneNodes(n.children)}));
}
function reducer(state: History, action: Action): History {
  switch (action.type) {
    case "restore": return { ...state, nodes: action.nodes, selectedId: state.selectedId && findNode(action.nodes, state.selectedId) ? state.selectedId : null };
    case "select": return { ...state, selectedId: action.id };
    case "add": return commit(state, insertNode(state.nodes, action.target, action.node), action.node.id);
    case "edit": return commit(state, updateNode(state.nodes, action.id, action.field, action.key, action.value));
    case "preset": {
      const current = findNode(state.nodes, action.id);
      const definition = current ? getDefinition(current.type) : null;
      if (!current || !definition || action.preset.component_type !== current.type) return state;
      let next = state.nodes;
      for (const [key,value] of Object.entries(action.preset.props_override)) {
        if (typeof value === "string" && key in definition.propsSchema)
          next = updateNode(next, action.id, "props", key, value);
      }
      for (const [key,value] of Object.entries(action.preset.style_override)) {
        if (typeof value === "string" && key in definition.styleSchema)
          next = updateNode(next, action.id, "style", key, value);
      }
      // Build a useful nested section on the first preset application, but never erase user content.
      if(definition.allowsChildren && current.children.length===0 &&
         Array.isArray(action.preset.children_template) &&
         action.preset.children_template.length && validateUiTree(action.preset.children_template)){
        next=fillEmptyContainer(next,action.id,cloneNodes(action.preset.children_template));
      }
      return validateUiTree(next) ? commit(state,next,action.id) : state;
    }
    case "delete": {
      const nodes = removeNode(state.nodes, action.id);
      return commit(state, nodes, state.selectedId && findNode(nodes, state.selectedId) ? state.selectedId : null);
    }
    case "move": return commit(state, moveNode(state.nodes, action.id, action.target), action.id);
    case "nudge": {
      const position=findLocation(state.nodes,action.id);
      if(!position)return state;
      const siblings=position.parentId?findNode(state.nodes,position.parentId)?.children:state.nodes;
      if(!siblings||position.index+action.direction<0||position.index+action.direction>=siblings.length)return state;
      const targetIndex=action.direction===1?position.index+2:position.index-1;
      return commit(state,moveNode(state.nodes,action.id,{parentId:position.parentId,index:targetIndex}),action.id);
    }
    case "duplicate": {
      const original=findNode(state.nodes,action.id);
      const position=findLocation(state.nodes,action.id);
      if(!original||!position)return state;
      const copy=cloneNodes([original])[0];
      const next=insertNode(state.nodes,{parentId:position.parentId,index:position.index+1},copy);
      return validateUiTree(next)?commit(state,next,copy.id):state;
    }
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

export default function BuilderWorkspace({ pageId, projectId, userId, projectKind, previewPages, initiallyPublished, pagePath, projectName, initialNodes, initialVersion }: {
  projectId: string;
  userId: string;
  projectKind: string;
  canInvite: boolean;
  previewPages: {path:string;ui_tree:BuilderNode[]}[];
  initiallyPublished: boolean;
  pageId: string;
  pagePath: string;
  projectName: string;
  initialNodes: BuilderNode[];
  initialVersion: number;
}) {
  const [state, dispatch] = useReducer(reducer, { nodes: initialNodes, selectedId: null, past: [], future: [] });
  const incomingRemote=useRef(false);
  const onRemoteTree=useCallback((tree:BuilderNode[])=>{
    incomingRemote.current=true;
    dispatch({type:"restore",nodes:tree});
  },[]);
  const {connected:collabConnected,peers,shareCursor,applyLocal}=useCollaborativeCanvas({
    pageId,userId,initialNodes,onRemote:onRemoteTree
  });
  useEffect(()=>{
    if(incomingRemote.current){incomingRemote.current=false;return;}
    applyLocal(state.nodes);
  },[state.nodes,applyLocal]);
  const [dragging, setDragging] = useState("");
  const [editorMode,setEditorMode]=useState<"2d"|"3d"|"timeline">("2d");
  const [status, setStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [device,setDevice]=useState<"mobile"|"tablet"|"desktop">("desktop");
  const [previewOpen,setPreviewOpen]=useState(false);
  const [previewPath,setPreviewPath]=useState(pagePath);
  const [previewError,setPreviewError]=useState("");
  const [published,setPublished]=useState(initiallyPublished);
  const [publishing,setPublishing]=useState(false);
  const [publishStatus,setPublishStatus]=useState("");
  const latestNodes = useRef(state.nodes);
  const baseTree = useRef(initialNodes);
  const savedTree = useRef(JSON.stringify(initialNodes));
  const draftKey = `no-code-builder:draft:${pageId}`;
  const version = useRef(initialVersion);
  const isSaving = useRef(false);
  useEffect(()=>{if(window.innerWidth < 640)setDevice("mobile");},[]);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 260, tolerance: 9 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Restore unsaved edits if this tab was refreshed. Supabase is the canonical store.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const draft: unknown = JSON.parse(raw);
      if (!draft || typeof draft !== "object") return;
      const value = draft as { nodes?: unknown; base?: unknown; version?: unknown };
      if (!validateUiTree(value.nodes) || !validateUiTree(value.base) ||
        !Number.isSafeInteger(value.version) || Number(value.version) < 1) return;
      if (JSON.stringify(value.nodes) === JSON.stringify(initialNodes)) {
        sessionStorage.removeItem(draftKey);
        return;
      }
      baseTree.current = value.base;
      savedTree.current = JSON.stringify(value.base);
      version.current = Number(value.version);
      latestNodes.current = value.nodes;
      dispatch({ type: "restore", nodes: value.nodes });
    } catch { /* Optional browser storage may be unavailable. */ }
    // Run only when navigating to a new page; not on Server Component refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const flushSave = useCallback(async () => {
    if (isSaving.current) return;
    if (savedTree.current === JSON.stringify(latestNodes.current)) { setStatus("saved"); return; }
    isSaving.current = true;
    setStatus("saving");
    try {
      for (let index = 0; index < 4; index++) {
        const snapshot = latestNodes.current;
        const serialized = JSON.stringify(snapshot);
        if (savedTree.current === serialized) break;
        const result = await savePageTree(pageId, snapshot, version.current, baseTree.current);
        if (!result.ok) throw new Error(result.error);

        const currentDraft = latestNodes.current;
        const reconciled = mergeUiTrees(snapshot, currentDraft, result.tree);
        version.current = result.version;
        baseTree.current = result.tree;
        savedTree.current = JSON.stringify(result.tree);
        if (!reconciled) throw new Error("Có chỉnh sửa trùng nhau khi đang lưu. Bản nháp vẫn được giữ trên thiết bị.");
        if (JSON.stringify(reconciled) !== JSON.stringify(currentDraft)) {
          latestNodes.current = reconciled;
          dispatch({ type: "restore", nodes: reconciled });
        }
      }
      const allSaved = savedTree.current === JSON.stringify(latestNodes.current);
      setStatus(allSaved ? "saved" : "unsaved");
      setErrorMessage("");
      if (allSaved) {
        try { sessionStorage.removeItem(draftKey); } catch { /* storage disabled */ }
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Không thể lưu trang. Bản nháp chưa bị xóa.");
    } finally {
      isSaving.current = false;
    }
  }, [pageId, draftKey]);

  useEffect(() => {
    latestNodes.current = state.nodes;
    if (savedTree.current === JSON.stringify(state.nodes)) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        nodes: state.nodes, base: baseTree.current, version: version.current,
      }));
    } catch { /* Supabase saving remains available without tab storage. */ }
    setStatus("unsaved");
    const timer = window.setTimeout(() => { void flushSave(); }, 2000);
    return () => window.clearTimeout(timer);
  }, [state.nodes, flushSave, draftKey]);

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
  const onNavigate=(path:string)=>{
    if(path===pagePath || previewPages.some(p=>p.path===path)){setPreviewPath(path);setPreviewError("");}
    else setPreviewError("Chưa tạo trang "+path+". Hãy thêm trang trước.");
  };
  const liveTree=previewPath===pagePath?state.nodes:previewPages.find(p=>p.path===previewPath)?.ui_tree??[];
  const publish=async()=>{
    if(publishing)return;setPublishing(true);setPublishStatus("");
    try{
      await flushSave();
      if(savedTree.current!==JSON.stringify(latestNodes.current)){setPublishStatus("Cần lưu thành công trước khi xuất bản.");return;}
      const r=await publishProject(projectId);
      if(!r.ok){setPublishStatus(r.error);return;}
      setPublished(true);setPublishStatus("Đã xuất bản "+r.count+" trang. Bản nháp vẫn được giữ riêng.");
    }catch(e){setPublishStatus(e instanceof Error?e.message:"Xuất bản thất bại.");}
    finally{setPublishing(false);}
  };
  const hide=async()=>{
    if(publishing)return;setPublishing(true);
    try{const r=await unpublishProject(projectId);if(!r.ok)setPublishStatus(r.error);else {setPublished(false);setPublishStatus("Website đã ngừng công khai.");}}
    finally{setPublishing(false);}
  };
  const iconButtonClass = "flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 sm:size-10";

  return <section
    onPointerMove={event=>{
      const r=event.currentTarget.getBoundingClientRect();
      if(r.width&&r.height)shareCursor((event.clientX-r.left)/r.width*100,(event.clientY-r.top)/r.height*100);
    }}
    className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0f172a] text-slate-100">
    <div aria-label="Collaborator cursors" className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {peers.map(peer=><div key={peer.userId} className="absolute flex items-start gap-1 text-orange-300"
        style={{left:peer.x+"%",top:peer.y+"%"}}><span className="block size-3 rotate-45 border-l-2 border-t-2 border-orange-400"/><span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">{peer.name}</span></div>)}
    </div>
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-slate-700/80 bg-[#1e293b] px-3 py-2 sm:px-5">
      <div className="mr-auto min-w-0"><p className="truncate text-xs font-bold text-white sm:text-sm">{projectName}<span className="font-normal text-slate-500"> · {pagePath}</span></p>
        <p role="status" aria-live="polite" className={`mt-0.5 flex items-center gap-1 text-[10px] ${status === "error" ? "text-rose-400" : status === "saved" ? "text-emerald-400" : "text-amber-400"}`}>
          {status === "saving" ? <LoaderCircle size={12} className="animate-spin"/> : status === "saved" ? <CheckCircle2 size={12}/> : <CloudUpload size={12}/>} {status === "saved" ? "Đã lưu vào Supabase" : status === "saving" ? "Đang lưu..." : status === "error" ? "Lưu thất bại" : "Có thay đổi chưa lưu"}
        </p>
      </div>
      <div className="hidden items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 sm:flex">
       {([{id:"mobile",Icon:Smartphone},{id:"tablet",Icon:Tablet},{id:"desktop",Icon:Monitor}] as const).map(({id,Icon})=><button key={id} type="button" title={id} aria-label={"Xem "+id} aria-pressed={device===id} onClick={()=>setDevice(id)} className={"rounded-lg p-2 "+(device===id?"bg-orange-500 text-white":"text-slate-400 hover:bg-slate-700")}><Icon size={16}/></button>)}
      </div>
      <nav aria-label="Chế độ biên tập" className="order-last flex w-full min-w-0 shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-slate-600 bg-slate-900 p-1 sm:order-none sm:w-auto sm:max-w-[42vw]">
        {([{key:"2d",label:"2D Editor"},{key:"3d",label:"3D Editor"},{key:"timeline",label:"Timeline"}] as const).map(item=><button key={item.key} type="button" onClick={()=>setEditorMode(item.key)} aria-pressed={editorMode===item.key} className={"shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-bold sm:px-3 "+(editorMode===item.key?"bg-orange-500 text-white":"text-slate-300 hover:bg-slate-700")}>{item.label}</button>)}
        <a href={"/ai-logic?project="+encodeURIComponent(projectId)} className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-700 sm:px-3">AI Logic</a>
       </nav>
       <FigmaImportPanel projectId={projectId} pageId={pageId} unsaved={status!=="saved"}/>
       <CollaborationPanel projectId={projectId} canInvite={canInvite} connected={collabConnected} peers={peers.length}/>
       <BuilderTour onOpenComponents={()=>setMobilePaletteOpen(true)} onOpenProperties={()=>setMobilePropertiesOpen(true)}/>
      <a href={"/native-build?project="+projectId} className="shrink-0 whitespace-nowrap rounded-lg border border-orange-500 px-3 py-2 text-xs font-bold text-orange-300">Xuất App</a>
      <a href="/assets" target="_blank" rel="noopener noreferrer" title="Kho ảnh và nguồn tài nguyên" className="flex h-9 items-center gap-1 rounded-xl border border-slate-600 bg-slate-800 px-2 text-xs font-semibold text-slate-200 hover:border-orange-400 sm:h-10">🖼️<span className="hidden lg:inline">Tài nguyên</span></a>
      {projectKind === "game" && <a href={"/game-builder?project="+projectId} title="Thiết kế game 2D có màn chơi" className="flex h-9 items-center gap-1 rounded-xl border border-orange-500/50 bg-orange-500/10 px-3 text-xs font-bold text-orange-300 hover:bg-orange-500/20 sm:h-10"><span className="text-base">🎮</span><span className="hidden sm:inline">Game 2D</span></a>}
      <button type="button" title="Chạy thử tương tác" onClick={()=>{setPreviewPath(pagePath);setPreviewError("");setPreviewOpen(true);}} className="flex size-9 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 text-white sm:size-10"><Eye size={18}/></button>
      <button type="button" title="Xuất bản website thật" onClick={()=>void publish()} disabled={publishing} className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white disabled:opacity-50 sm:size-10">{publishing?<LoaderCircle size={17} className="animate-spin"/>:<Rocket size={17}/>}</button>
      <button type="button" onClick={() => dispatch({ type: "undo" })} disabled={!state.past.length} className={iconButtonClass} aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)"><Undo2 size={17}/></button>
      <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} className={iconButtonClass} aria-label="Làm lại" title="Làm lại (Ctrl+Y)"><Redo2 size={17}/></button>
      <button type="button" onClick={() => void flushSave()} disabled={status === "saving"} className="flex h-9 items-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white shadow-md shadow-orange-500/15 transition hover:bg-orange-400 disabled:opacity-60 sm:h-10 sm:px-4"><Save size={16}/><span className="hidden sm:inline">Lưu</span></button>
      {<details className="relative">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 text-xs font-semibold text-slate-100 transition hover:bg-slate-600 sm:h-10 [&::-webkit-details-marker]:hidden"><Download size={16}/><span className="hidden sm:inline">Xuất mã</span><ChevronDown size={14} className="hidden sm:block"/></summary>
        <div className="absolute right-0 z-30 mt-2 w-44 space-y-1 rounded-xl border border-slate-600 bg-[#1e293b] p-2 shadow-2xl">
          <a href={"/api/projects/"+projectId+"/export"} download className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-emerald-200 transition hover:bg-slate-700"><Download size={16}/> Tải ZIP đầy đủ · Web & Game</a>
          <button type="button" onClick={() => downloadFile("page.tsx", generateReactCode(state.nodes), "text/typescript")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-700"><Code2 size={16} className="text-orange-400"/> Xuất React</button>
          <button type="button" onClick={() => downloadFile("page.html", generateHtmlCode(state.nodes, projectName), "text/html")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-700"><FileCode2 size={16} className="text-orange-400"/> Xuất HTML</button>
        </div>
      </details>}
    </div>
    {status === "error" && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
      <span>{errorMessage}</span>
      <button type="button" onClick={() => void flushSave()} className="shrink-0 rounded-lg border border-rose-400/50 px-3 py-1.5 font-semibold text-white hover:bg-rose-500/20">Thử lưu lại</button>
    </div>}
    {publishStatus && <div role="status" className="flex items-center justify-between gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-200"><span>{publishStatus}</span>{published&&<a href={"/s/"+projectId} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-300"><ExternalLink size={14}/>Xem</a>}</div>}
    {published && <div className="flex items-center justify-between gap-2 border-b border-emerald-800 bg-emerald-950/30 px-4 py-1.5 text-xs text-emerald-300"><a href={"/s/"+projectId} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1"><Globe2 size={14}/> Website đang công khai · Mở</a><button type="button" onClick={()=>void hide()} className="rounded-md border border-slate-600 px-2 py-1 text-slate-300">Ẩn website</button></div>}
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-700 bg-slate-900 px-2 py-2 sm:hidden">{([{id:"mobile",Icon:Smartphone,label:"Điện thoại"},{id:"tablet",Icon:Tablet,label:"Máy tính bảng"},{id:"desktop",Icon:Monitor,label:"Web"}] as const).map(({id,Icon,label})=><button key={id} type="button" onClick={()=>setDevice(id)} aria-pressed={device===id} className={"flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg p-2 text-xs "+(device===id?"bg-orange-500 text-white":"bg-slate-800 text-slate-400")}><Icon size={15}/>{label}</button>)}</div>
    {editorMode!=="2d" ? <ThreeStudio key={pageId} projectId={projectId} pageId={pageId} showTimeline={editorMode==="timeline"}/> : <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging("")}>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[270px_minmax(0,1fr)_320px]">
        <div className="hidden min-h-0 lg:block"><ComponentPalette onAdd={onAdd}/></div>
        <BuilderCanvas onReorder={(id,direction)=>dispatch({type:"nudge",id,direction})} onDuplicate={id=>dispatch({type:"duplicate",id})} device={device} onPreview={()=>{setPreviewPath(pagePath);setPreviewOpen(true);}} nodes={state.nodes} selectedId={state.selectedId} onSelect={onSelect} onRequestAdd={() => setMobilePaletteOpen(true)}/>
        <div className="hidden min-h-0 lg:block"><PropertiesPanel userId={userId} onApplyPreset={(id,preset)=>dispatch({type:"preset",id,preset})} node={selectedNode} onChange={(id, field, key, value) => dispatch({ type: "edit", id, field, key, value })} onDelete={onDelete}/></div>
      </div>
      <DragOverlay dropAnimation={null} zIndex={70}>
        {dragging && <motion.div initial={{ scale: 0.95, opacity: 0.75 }} animate={{ scale: 1.02, opacity: 0.94 }} className="rounded-xl border border-orange-400 bg-[#1e293b] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)]">{dragging}</motion.div>}
      </DragOverlay>
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-700 bg-[#1e293b] px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <button type="button" onClick={() => setMobilePaletteOpen(true)} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-400"><Plus size={19}/> Thêm thành phần</button>
        <button type="button" onClick={() => setMobilePropertiesOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"><Settings2 size={17}/> Thuộc tính</button>
      </div>
      <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/85"/>
          <Dialog.Content className="fixed inset-0 z-[101] flex flex-col bg-[#0f172a] text-white outline-none" aria-describedby="live-preview-desc">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-800 p-3">
              <Dialog.Title className="mr-auto flex items-center gap-2 font-bold"><Eye size={17}/> Chạy thử: {projectName}</Dialog.Title>
              <Dialog.Description id="live-preview-desc" className="sr-only">Kiểm tra tương tác, liên kết và giao diện trên thiết bị.</Dialog.Description>
              <select title="Đổi trang" value={previewPath} onChange={e=>{setPreviewPath(e.target.value);setPreviewError("");}} className="max-w-24 rounded-lg border border-slate-600 bg-slate-900 p-2 text-xs">{previewPages.map(p=><option value={p.path} key={p.path}>{p.path}</option>)}</select>
              <Dialog.Close asChild><button type="button" aria-label="Đóng chạy thử" className="rounded-lg border border-slate-600 p-2"><X size={18}/></button></Dialog.Close>
            </div>
            {previewError&&<p role="alert" className="bg-rose-900 p-2 text-xs">{previewError}</p>}
            <div className="editor-scroll min-h-0 flex-1 overflow-auto p-3 sm:p-8">
              <div className="mx-auto min-h-[65dvh] overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl transition-[width]" style={{width:device==="mobile"?"390px":device==="tablet"?"768px":"1120px",maxWidth:"100%"}}>
                <LivePage key={previewPath} nodes={liveTree} onNavigate={onNavigate}/>
              </div>
            </div>
            <p className="border-t border-slate-700 p-2 text-center text-xs text-slate-400">Đây là bản chạy thử. Nhấn Xuất bản để khách có thể truy cập website.</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <MobileSheet open={mobilePaletteOpen} onOpenChange={setMobilePaletteOpen} title="Thêm thành phần">
        <ComponentPalette onAdd={onAdd}/>
      </MobileSheet>
      <MobileSheet open={mobilePropertiesOpen} onOpenChange={setMobilePropertiesOpen} title="Chỉnh sửa thành phần">
        <PropertiesPanel userId={userId} onApplyPreset={(id,preset)=>dispatch({type:"preset",id,preset})} node={selectedNode} onChange={(id, field, key, value) => dispatch({ type: "edit", id, field, key, value })} onDelete={onDelete}/>
      </MobileSheet>
    </DndContext>}
  </section>;
}
