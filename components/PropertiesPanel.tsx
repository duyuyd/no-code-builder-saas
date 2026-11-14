"use client";
import { motion } from "framer-motion";
import { Box, Brush, Info, Layers3, Settings2, SlidersHorizontal, Trash2 } from "lucide-react";
import { getDefinition, type BuilderNode, type FieldSchema } from "@/lib/component-registry";

function PropertyField({ field, name, value, onChange }: {
  field: FieldSchema;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `${name}-field`;
  const inputClass = "mt-2 w-full rounded-xl border border-slate-600 bg-[#0f172a] px-3 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10";
  if (field.type === "boolean") return <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-xs font-medium text-slate-200">
    <span>{field.label}</span><input id={id} type="checkbox" checked={value === "true"} onChange={e => onChange(String(e.target.checked))} className="size-4 accent-orange-500"/>
  </label>;
  return <label htmlFor={id} className="block text-xs font-medium text-slate-300">
    <span>{field.label}</span>
    {field.type === "textarea" ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={4} className={`${inputClass} resize-y`}/>
      : field.type === "color" ? <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-600 bg-[#0f172a] p-2"><input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"/><span className="min-w-0 flex-1 truncate rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-200">{value}</span></span>
      : <input id={id} type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"} value={value} onChange={e => onChange(e.target.value)} className={inputClass}/>}
  </label>;
}

export default function PropertiesPanel({ node, onChange, onDelete }: {
  node: BuilderNode | null;
  onChange: (id: string, field: "props" | "style", key: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const definition = node ? getDefinition(node.type) : null;
  return <aside aria-label="Bảng thuộc tính thành phần" className="editor-scroll flex h-full min-h-0 flex-col overflow-hidden border-l border-slate-700/80 bg-[#1e293b]">
    <div className="shrink-0 border-b border-slate-700/80 px-4 py-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Settings2 size={17} className="text-orange-400"/> Bảng thuộc tính</h2>
      <p className="mt-1 pl-6 text-[11px] text-slate-400">Tùy chỉnh nội dung và giao diện</p>
    </div>
    {!node || !definition ? <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-slate-600 bg-slate-800 text-orange-300"><SlidersHorizontal size={29}/></div>
      <div><p className="text-sm font-semibold text-slate-100">Chưa chọn thành phần</p><p className="mt-2 text-xs leading-5 text-slate-400">Chạm vào một thành phần trong khung thiết kế để chỉnh sửa nội dung, màu sắc và kích thước.</p></div>
      <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-[11px] text-slate-500"><Info size={13}/> Mọi thay đổi được tự động lưu</div>
    </div> : <motion.div key={node.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="editor-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-orange-400/20 bg-orange-500/10 px-3 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Box size={20}/></span>
        <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-100">{definition.label}</p><p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{node.type}</p></div>
        <Layers3 size={15} className="ml-auto shrink-0 text-orange-300"/>
      </div>
      <section className="space-y-4" aria-label="Nội dung thành phần">
        <h3 className="flex items-center gap-2 border-b border-slate-700 pb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300"><SlidersHorizontal size={15} className="text-orange-400"/> Nội dung</h3>
        {Object.keys(definition.propsSchema).length ? Object.entries(definition.propsSchema).map(([key, field]) => <PropertyField key={key} name={`prop-${node.id}-${key}`} field={field} value={node.props[key] ?? field.defaultValue} onChange={value => onChange(node.id, "props", key, value)}/>) : <p className="text-xs text-slate-500">Thành phần này không có thuộc tính nội dung.</p>}
      </section>
      <section className="mt-7 space-y-4" aria-label="Kiểu dáng thành phần">
        <h3 className="flex items-center gap-2 border-b border-slate-700 pb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300"><Brush size={15} className="text-orange-400"/> Kiểu dáng</h3>
        {Object.entries(definition.styleSchema).map(([key, field]) => <PropertyField key={key} name={`style-${node.id}-${key}`} field={field} value={node.style[key] ?? field.defaultValue} onChange={value => onChange(node.id, "style", key, value)}/>) }
      </section>
      <button type="button" onClick={() => onDelete(node.id)} className="mb-4 mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/20"><Trash2 size={15}/> Xóa thành phần</button>
    </motion.div>}
  </aside>;
}
