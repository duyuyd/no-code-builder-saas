"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Boxes, ChartNoAxesColumnIncreasing, GripVertical, Image as ImageIcon, LayoutGrid, Plus, Search, SlidersHorizontal, Type, ClipboardList, Database } from "lucide-react";
import { COMPONENT_REGISTRY, type ComponentCategory, type ComponentDefinition } from "@/lib/component-registry";

const icons = { basic: Type, layout: LayoutGrid, form: ClipboardList, media: ImageIcon, data: Database };
const categoryLabels: Record<ComponentCategory, string> = {
  basic: "Thành phần cơ bản", layout: "Bố cục", form: "Biểu mẫu", media: "Đa phương tiện", data: "Dữ liệu và biểu đồ",
};

function PaletteItem({ definition, onAdd }: { definition: ComponentDefinition; onAdd: (type: string) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `palette:${definition.type}`, data: { kind: "palette", type: definition.type },
  });
  const Icon = icons[definition.category];
  return <motion.div ref={setNodeRef} whileHover={{ x: 2 }} transition={{ duration: 0.12 }}
    className={`group flex items-center gap-2 rounded-xl border bg-[#263448] p-1.5 transition-colors hover:border-orange-400/50 hover:bg-[#2b3a50] ${isDragging ? "border-orange-400 opacity-50 shadow-xl shadow-black/40" : "border-slate-700/80"}`}>
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
      className="drag-handle flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-400" title={`Kéo ${definition.label} vào khung thiết kế`}>
      <GripVertical size={14} className="hidden shrink-0 text-slate-500 sm:block"/>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/80 text-orange-300"><Icon size={16}/></span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-200">{definition.label}</span>
    </button>
    <button type="button" onClick={() => onAdd(definition.type)} aria-label={`Thêm ${definition.label}`} title={`Thêm ${definition.label}`}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-600/70 bg-slate-800 text-slate-300 transition-colors hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline-2 focus-visible:outline-orange-400"><Plus size={16}/></button>
  </motion.div>;
}

export default function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ComponentCategory | "all">("all");
  const normalized = query.trim().toLocaleLowerCase("vi");
  const matches = COMPONENT_REGISTRY.filter(item =>
    (categoryFilter === "all" || item.category === categoryFilter) &&
    (!normalized || item.label.toLocaleLowerCase("vi").includes(normalized) || item.type.includes(normalized))
  );
  return <aside aria-label="Thư viện thành phần" className="editor-scroll flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-700/80 bg-[#1e293b]">
    <div className="shrink-0 border-b border-slate-700/80 p-4">
      <div className="mb-1 flex items-center gap-2.5"><Boxes size={18} className="text-orange-400"/><h2 className="text-sm font-bold text-white">Thư viện thành phần</h2><span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">{COMPONENT_REGISTRY.length}</span></div>
      <p className="mb-4 pl-7 text-[11px] text-slate-400">Kéo thả hoặc bấm + để thêm</p>
      <label className="flex items-center gap-2 rounded-xl border border-slate-600 bg-[#0f172a] px-3 transition-colors focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10">
        <Search size={16} className="shrink-0 text-slate-400"/>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm thành phần..." aria-label="Tìm thành phần" className="min-w-0 flex-1 bg-transparent py-3 text-xs text-white outline-none placeholder:text-slate-500"/>
        <SlidersHorizontal size={14} className="shrink-0 text-slate-500"/>
      </label>
      <div className="editor-scroll mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
        <button type="button" onClick={() => setCategoryFilter("all")} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${categoryFilter === "all" ? "bg-orange-500 text-white" : "bg-slate-700/75 text-slate-300 hover:bg-slate-600"}`}>Tất cả</button>
        {(Object.keys(categoryLabels) as ComponentCategory[]).map(category => <button type="button" key={category} onClick={() => setCategoryFilter(category)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${categoryFilter === category ? "bg-orange-500 text-white" : "bg-slate-700/75 text-slate-300 hover:bg-slate-600"}`}>{category === "data" ? "Dữ liệu" : category === "media" ? "Media" : category === "basic" ? "Cơ bản" : category === "layout" ? "Bố cục" : "Biểu mẫu"}</button>)}
      </div>
    </div>
    <div className="editor-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {(Object.keys(categoryLabels) as ComponentCategory[]).map(category => {
        const group = matches.filter(item => item.category === category);
        if (!group.length) return null;
        const Icon = icons[category];
        return <section key={category} aria-label={categoryLabels[category]}>
          <h3 className="mb-2.5 flex items-center gap-2 px-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400"><Icon size={13}/>{categoryLabels[category]}<span className="ml-auto text-slate-500">{group.length}</span></h3>
          <div className="space-y-2">{group.map(item => <PaletteItem key={item.type} definition={item} onAdd={onAdd}/>)}</div>
        </section>;
      })}
      {matches.length === 0 && <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-600 px-3 py-8 text-center text-slate-400"><ChartNoAxesColumnIncreasing size={24}/><p className="text-xs">Không tìm thấy thành phần phù hợp</p><button type="button" onClick={() => { setQuery(""); setCategoryFilter("all"); }} className="text-xs font-semibold text-orange-300 hover:underline">Xóa bộ lọc</button></div>}
    </div>
    <div className="shrink-0 border-t border-slate-700/75 px-4 py-3 text-[11px] text-slate-500">{matches.length} thành phần sẵn sàng sử dụng</div>
  </aside>;
}
