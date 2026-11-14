"use client";
import { createElement, type CSSProperties, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon } from "lucide-react";
import { getDefinition, nodeCss, safeUrl, sanitizeNumeric, type BuilderNode } from "@/lib/component-registry";
export type CanvasNodeProps = { node: BuilderNode; selectedId: string | null; onSelect: (id: string) => void };

function DropInside({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `inside:${id}`, data: { kind: "inside", id } });
  return <div ref={setNodeRef} className={`min-h-9 rounded-md border-2 border-dashed p-2 text-center text-xs ${isOver ? "border-orange-500 bg-orange-50" : "border-slate-200 text-slate-400"}`}>
    Thả khối vào đây
  </div>;
}
function RenderElement({ node, selectedId, onSelect }: CanvasNodeProps) {
  const def = getDefinition(node.type);
  if (!def) return null;
  const p = node.props;
  const style = nodeCss(node) as CSSProperties;
  const src = safeUrl(p.src ?? "");
  const text = p.text ?? "";
  switch (def.kind) {
    case "text": return createElement(def.tag, { style, className: "whitespace-pre-wrap" }, text);
    case "button": return <button type="button" style={style} onClick={e => e.preventDefault()}>{text}</button>;
    case "link": return <a style={style} href={safeUrl(p.href ?? "") || "#"} onClick={e => e.preventDefault()}>{text}</a>;
    case "image": return src ? <div style={style}><img src={src} alt={p.alt ?? ""} className="max-h-64 w-full object-contain" /></div> :
      <div style={style} className="flex min-h-28 items-center justify-center gap-2 rounded border border-dashed"><ImageIcon size={20} />Thiết lập URL ảnh</div>;
    case "video": return src ? <video controls style={style} src={src} onClick={e => e.stopPropagation()} /> : <div style={style}>Thiết lập URL video</div>;
    case "audio": return src ? <audio controls style={style} src={src} onClick={e => e.stopPropagation()} /> : <div style={style}>Thiết lập URL âm thanh</div>;
    case "divider": return def.tag === "hr" ? <hr style={style} /> : <div style={{...style, height: 20}} />;
    case "input": return <input disabled type={node.type === "email-input" ? "email" : node.type === "password-input" ? "password" : node.type === "number-input" ? "number" : node.type === "date-input" ? "date" : node.type === "time-input" ? "time" : node.type === "search-input" ? "search" : node.type === "file-input" ? "file" : "text"} placeholder={p.placeholder ?? ""} style={style} className="max-w-full border" />;
    case "textarea": return <textarea disabled placeholder={p.placeholder ?? ""} style={style} rows={2} className="w-full border" />;
    case "select": return <select disabled style={style} className="max-w-full border"><option>-- Chọn --</option>{(p.options ?? "").split(/\r?\n/).filter(Boolean).map((value, i) => <option key={i}>{value}</option>)}</select>;
    case "checkbox": return <label style={style} className="inline-flex items-center gap-2"><input disabled type={node.type === "radio" ? "radio" : "checkbox"} checked={p.checked === "true"} readOnly />{text}</label>;
    case "range": return <input disabled style={style} type="range" min={sanitizeNumeric(p.min ?? "", 0)} max={sanitizeNumeric(p.max ?? "", 100)} />;
    case "progress": return createElement(def.tag, { style, value: sanitizeNumeric(p.value ?? "", 0), max: sanitizeNumeric(p.max ?? "", 100, 1, 10000) });
    case "list": return createElement(def.tag, { style }, (p.items ?? "").split(/\r?\n/).filter(Boolean).map((item,i) => <li key={i}>{item}</li>));
    case "table": {
      const rows = (p.csv ?? "").split(/\r?\n/).filter(Boolean).slice(0, 100).map(r => r.split(",").slice(0, 40));
      return <table style={style} className="w-full border-collapse text-xs"><tbody>{rows.map((row,i) => <tr key={i}>{row.map((cell,j) => i === 0 ? <th className="border p-2" key={j}>{cell}</th> : <td className="border p-2" key={j}>{cell}</td>)}</tr>)}</tbody></table>;
    }
    case "chart": {
      const values = (p.values ?? "").split(",").map(Number).filter(n => Number.isFinite(n) && n >= 0).slice(0, 50);
      const max = Math.max(1, ...values);
      return <div style={style} className="flex min-h-24 items-end gap-1 border border-dashed border-slate-200">{values.length ? values.map((value,i) => <div key={i} title={String(value)} className="brand-bg min-w-3 flex-1" style={{height: `${Math.max(1, value/max*100)}%`, minHeight: `${Math.max(2, value/max*130)}px`}} />) : <span className="p-2 text-xs text-slate-400">Nhập dữ liệu cho biểu đồ</span>}</div>;
    }
    case "iframe": return src ? <iframe src={src} title={p.title ?? "Embed"} style={style} sandbox="allow-scripts allow-forms" className="min-h-40 w-full border" /> : <div style={style}>Thiết lập URL nhúng</div>;
    case "container": {
      const children: ReactNode = <>
        <SortableContext items={node.children.map(c => `node:${c.id}`)} strategy={verticalListSortingStrategy}>
          {node.children.map(child => <CanvasNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />)}
        </SortableContext>
        <DropInside id={node.id} />
      </>;
      return createElement(def.tag, { style, className: "min-h-24 w-full min-w-0 border border-slate-100" }, children);
    }
  }
}
export default function CanvasNode({ node, selectedId, onSelect }: CanvasNodeProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `node:${node.id}`, data: { kind: "node", id: node.id },
  });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
    className={`builder-node min-w-0 rounded border-2 bg-white p-2 ${selectedId === node.id ? "brand-border" : "border-transparent hover:border-slate-300"}`}
    onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
    <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{getDefinition(node.type)?.label}</span>
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Di chuyển khối"
        className="drag-handle rounded p-1 hover:bg-slate-100"><GripVertical size={16}/></button>
    </div>
    <RenderElement node={node} selectedId={selectedId} onSelect={onSelect} />
  </div>;
}
