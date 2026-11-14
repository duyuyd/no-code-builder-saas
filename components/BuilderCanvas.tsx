"use client";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutTemplate, MousePointer2, Plus, Smartphone } from "lucide-react";
import CanvasNode from "./CanvasNode";
import type { BuilderNode } from "@/lib/component-registry";

export default function BuilderCanvas({ nodes, selectedId, onSelect, onRequestAdd }: {
  nodes: BuilderNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRequestAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-root", data: { kind: "root" } });
  return <main aria-label="Vùng thiết kế giao diện" className="editor-scroll relative flex h-full min-h-0 min-w-0 flex-col overflow-y-auto bg-[#0b1323]">
    <div className="canvas-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true"/>
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400"><MousePointer2 size={15} className="text-orange-400"/><span className="font-semibold text-slate-200">Khung thiết kế</span><span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px]">{nodes.length} khối gốc</span></div>
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-[11px] text-slate-400"><Smartphone size={13}/> Xem trước trực tiếp</div>
    </div>
    <div className="relative z-10 flex min-h-0 flex-1 justify-center px-3 pb-28 pt-2 sm:px-6 sm:pb-8">
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="w-full max-w-[960px] self-start">
        <div className="mx-auto mb-0 h-7 w-32 rounded-t-xl border border-b-0 border-slate-600 bg-slate-800/90 px-4 py-2 text-center text-[10px] font-semibold tracking-wide text-slate-400">TRANG WEB</div>
        <div ref={setNodeRef} onClick={() => onSelect(null)} className={`min-h-[520px] rounded-2xl rounded-tl-xl border-2 bg-white p-4 text-slate-900 shadow-[0_28px_75px_rgba(0,0,0,0.35)] transition-colors duration-200 sm:min-h-[680px] sm:p-7 ${isOver ? "border-orange-400 ring-4 ring-orange-500/15" : "border-slate-500/60"}`}>
          {nodes.length === 0 && <div className="flex min-h-[450px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-5 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-500"><LayoutTemplate size={30}/></span>
            <div><p className="text-base font-bold text-slate-800">Khởi tạo giao diện của bạn</p><p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">Kéo khối từ thư viện vào đây hoặc bấm nút bên dưới để bắt đầu.</p></div>
            <button type="button" onClick={e => { e.stopPropagation(); onRequestAdd?.(); }} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/15 transition hover:bg-orange-400 lg:hidden"><Plus size={16}/> Thêm thành phần</button>
          </div>}
          <SortableContext items={nodes.map(node => `node:${node.id}`)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">{nodes.map(node => <CanvasNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect}/>)}</div>
          </SortableContext>
          {nodes.length > 0 && <div className={`pointer-events-none mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-5 text-center text-xs transition-colors ${isOver ? "border-orange-400 bg-orange-50 text-orange-500" : "border-slate-200 bg-slate-50 text-slate-400"}`}><Plus size={15}/> Thả vào đây để thêm khối cuối trang</div>}
        </div>
        <div className="mt-4 text-center text-[11px] text-slate-500">Chọn thành phần để chỉnh sửa • Kéo tay cầm để sắp xếp</div>
      </motion.div>
    </div>
  </main>;
}
