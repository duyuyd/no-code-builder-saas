"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutTemplate } from "lucide-react";
import CanvasNode from "./CanvasNode";
import type { BuilderNode } from "@/lib/component-registry";
export default function BuilderCanvas({ nodes, selectedId, onSelect }: {
  nodes: BuilderNode[]; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-root", data: { kind: "root" } });
  return <main className="editor-scroll h-full overflow-y-auto bg-slate-200 p-4 sm:p-6">
    <h2 className="mb-3 text-sm font-semibold text-slate-600">Canvas</h2>
    <div ref={setNodeRef} onClick={() => onSelect(null)}
      className={`mx-auto min-h-[600px] w-full max-w-4xl rounded-lg border-2 bg-white p-4 shadow sm:p-7 ${isOver ? "border-orange-400" : "border-slate-300"}`}>
      {!nodes.length && <div className="pointer-events-none flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400"><LayoutTemplate size={36}/><p className="text-sm">Kéo component từ trái vào Canvas</p></div>}
      <SortableContext items={nodes.map(n => `node:${n.id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">{nodes.map(node => <CanvasNode key={node.id} node={node} selectedId={selectedId} onSelect={id => onSelect(id)}/>)}</div>
      </SortableContext>
      {!!nodes.length && <div className="pointer-events-none mt-5 rounded-md border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">Thả vào khoảng trống để thêm cuối trang</div>}
    </div>
  </main>;
}
