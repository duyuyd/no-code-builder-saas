"use client";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plus, Search, Boxes, Type, LayoutGrid, ClipboardList, Image as ImageIcon, Database } from "lucide-react";
import { COMPONENT_REGISTRY, type ComponentCategory, type ComponentDefinition } from "@/lib/component-registry";
const icons = { basic: Type, layout: LayoutGrid, form: ClipboardList, media: ImageIcon, data: Database };
const categoryLabels: Record<ComponentCategory, string> = {
  basic: "Cơ bản", layout: "Layout", form: "Biểu mẫu", media: "Media", data: "Dữ liệu"
};
function PaletteItem({ definition, onAdd }: { definition: ComponentDefinition; onAdd: (type: string) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `palette:${definition.type}`,
    data: { kind: "palette", type: definition.type },
  });
  const Icon = icons[definition.category];
  return <div ref={setNodeRef} className={`flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 hover:border-orange-300 ${isDragging ? "opacity-50" : ""}`}>
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
      className="drag-handle flex min-w-0 flex-1 items-center gap-2 rounded-md p-2 text-left text-xs" title={`Kéo ${definition.label}`}>
      <GripVertical size={14} className="shrink-0 text-slate-400" /><Icon size={15} className="brand-text shrink-0" />
      <span className="truncate">{definition.label}</span>
    </button>
    <button type="button" aria-label={`Thêm ${definition.label}`} title={`Thêm ${definition.label}`}
      onClick={() => onAdd(definition.type)} className="rounded p-2 hover:bg-slate-100"><Plus size={14} /></button>
  </div>;
}
export default function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const [query, setQuery] = useState("");
  const matches = COMPONENT_REGISTRY.filter(item => item.label.toLowerCase().includes(query.toLowerCase()) || item.type.includes(query.toLowerCase()));
  return <aside className="editor-scroll h-full overflow-y-auto border-r bg-slate-50 p-3">
    <h2 className="mb-3 flex items-center gap-2 font-semibold"><Boxes size={17} />Components <span className="ml-auto text-xs text-slate-500">{COMPONENT_REGISTRY.length}</span></h2>
    <label className="mb-4 flex items-center gap-2 rounded-lg border bg-white px-2"><Search size={15} className="text-slate-400" />
      <input className="w-full bg-transparent py-2 text-xs outline-none" placeholder="Tìm component..." value={query} onChange={e => setQuery(e.target.value)} />
    </label>
    {(Object.keys(categoryLabels) as ComponentCategory[]).map(category => {
      const group = matches.filter(item => item.category === category);
      return group.length > 0 && <section className="mb-5" key={category}>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{categoryLabels[category]}</h3>
        <div className="space-y-1.5">{group.map(item => <PaletteItem key={item.type} definition={item} onAdd={onAdd} />)}</div>
      </section>;
    })}
  </aside>;
}
