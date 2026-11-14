"use client";
import { motion } from "framer-motion";
import { Settings2, Trash2 } from "lucide-react";
import { getDefinition, type BuilderNode, type FieldSchema } from "@/lib/component-registry";
function PropertyField({ field, name, value, onChange }: {
  field: FieldSchema; name: string; value: string; onChange: (value: string) => void;
}) {
  const id = `${name}-field`;
  const common = "mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm outline-none focus:border-orange-500";
  return <label htmlFor={id} className="block text-xs font-medium text-slate-600">{field.label}
    {field.type === "textarea" ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={3} className={common}/>
      : field.type === "boolean" ? <input id={id} type="checkbox" checked={value === "true"} onChange={e => onChange(String(e.target.checked))} className="ml-3"/>
      : <input id={id} type={field.type} value={value} onChange={e => onChange(e.target.value)} className={field.type === "color" ? "mt-2 block h-10 w-full cursor-pointer" : common} />}
  </label>;
}
export default function PropertiesPanel({ node, onChange, onDelete }: {
  node: BuilderNode | null;
  onChange: (id: string, field: "props" | "style", key: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const def = node ? getDefinition(node.type) : null;
  return <aside className="editor-scroll h-full overflow-y-auto border-l bg-slate-50 p-4">
    <h2 className="mb-4 flex items-center gap-2 font-semibold"><Settings2 size={17}/>Properties</h2>
    {!node || !def ? <p className="text-sm text-slate-500">Chọn một component để sửa thuộc tính.</p> :
      <motion.div key={node.id} initial={{opacity:0, y:7}} animate={{opacity:1, y:0}} transition={{duration:0.15}}>
        <p className="brand-text mb-4 font-semibold">{def.label}</p>
        <h3 className="mb-3 text-sm font-bold">Props</h3>
        <div className="space-y-3">{Object.entries(def.propsSchema).map(([key, field]) => <PropertyField key={key} name={`prop-${key}`} field={field} value={node.props[key] ?? field.defaultValue} onChange={value => onChange(node.id,"props",key,value)} />)}</div>
        <h3 className="my-4 border-t pt-4 text-sm font-bold">Style</h3>
        <div className="space-y-3">{Object.entries(def.styleSchema).map(([key, field]) => <PropertyField key={key} name={`style-${key}`} field={field} value={node.style[key] ?? field.defaultValue} onChange={value => onChange(node.id,"style",key,value)} />)}</div>
        <button type="button" onClick={() => onDelete(node.id)} className="mt-6 flex w-full items-center justify-center gap-2 rounded border border-red-300 p-2 text-sm text-red-700 hover:bg-red-50"><Trash2 size={16}/>Xóa component</button>
      </motion.div>}
  </aside>;
}
