"use client";
import { createElement, type CSSProperties, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowUp, ArrowDown, Copy, Image as ImageIcon } from "lucide-react";
import { getDefinition, nodeCss, safeUrl, sanitizeNumeric, type BuilderNode } from "@/lib/component-registry";
import { responsiveLayoutClass } from "@/lib/responsive-layout";
export type CanvasNodeProps = { node: BuilderNode; selectedId: string | null; onSelect: (id: string) => void; onReorder?:(id:string,direction:-1|1)=>void; onDuplicate?:(id:string)=>void };

function DropInside({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `inside:${id}`, data: { kind: "inside", id } });
  return <div ref={setNodeRef} className={`min-h-9 rounded-md border-2 border-dashed p-2 text-center text-xs ${isOver ? "border-orange-500 bg-orange-50" : "border-slate-200 text-slate-400"}`}>
    Thả thành phần vào vùng chứa
  </div>;
}
function RenderElement({ node, selectedId, onSelect, onReorder, onDuplicate }: CanvasNodeProps) {
  const def = getDefinition(node.type);
  if (!def) return null;
  const p = node.props;
  const style = nodeCss(node) as CSSProperties;
  const src = safeUrl(p.src ?? "");
  const text = p.text ?? "";
  switch (def.kind) {
    case "text": return createElement(def.tag, { style, className: "block whitespace-pre-wrap break-words leading-relaxed" }, text);
    case "button": return <button type="button" style={style} className="rounded-xl border border-slate-200 shadow-sm transition hover:brightness-95" onClick={e => e.preventDefault()}>{text}</button>;
    case "link": return <a style={style} className="inline-flex rounded-lg underline decoration-orange-400 underline-offset-4" href={safeUrl(p.href ?? "") || "#"} onClick={e => e.preventDefault()}>{text}</a>;
    case "image": return src ? <div style={style}><img src={src} alt={p.alt ?? ""} className="max-h-72 w-full rounded-lg object-contain" /></div> :
      <div style={style} className="flex min-h-36 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500"><ImageIcon size={20} />Thiết lập URL ảnh</div>;
    case "video": return src ? <video controls style={style} src={src} onClick={e => e.stopPropagation()} /> : <div style={style}>Thiết lập URL video</div>;
    case "audio": return src ? <audio controls style={style} src={src} onClick={e => e.stopPropagation()} /> : <div style={style}>Thiết lập URL âm thanh</div>;
    case "divider": return def.tag === "hr" ? <hr style={style} /> : <div style={{...style, height: 20}} />;
    case "input": return <input disabled type={node.type === "email-input" ? "email" : node.type === "password-input" ? "password" : node.type === "number-input" ? "number" : node.type === "date-input" ? "date" : node.type === "time-input" ? "time" : node.type === "search-input" ? "search" : node.type === "file-input" ? "file" : "text"} placeholder={p.placeholder ?? ""} style={style} className="max-w-full rounded-lg border border-slate-300 bg-slate-50 shadow-sm" />;
    case "textarea": return <textarea disabled placeholder={p.placeholder ?? ""} style={style} rows={2} className="w-full rounded-lg border border-slate-300 bg-slate-50 shadow-sm" />;
    case "select": return <select disabled style={style} className="max-w-full rounded-lg border border-slate-300 bg-slate-50 shadow-sm"><option>Chọn một mục</option>{(p.options ?? "").split(/\r?\n/).filter(Boolean).map((value, i) => <option key={i}>{value}</option>)}</select>;
    case "checkbox": return <label style={style} className="inline-flex items-center gap-2"><input disabled type={node.type === "radio" ? "radio" : "checkbox"} checked={p.checked === "true"} readOnly />{text}</label>;
    case "range": return <input disabled style={style} type="range" min={sanitizeNumeric(p.min ?? "", 0)} max={sanitizeNumeric(p.max ?? "", 100)} />;
    case "progress": return createElement(def.tag, { style, value: sanitizeNumeric(p.value ?? "", 0), max: sanitizeNumeric(p.max ?? "", 100, 1, 10000) });
    case "list": return createElement(def.tag, { style }, (p.items ?? "").split(/\r?\n/).filter(Boolean).map((item,i) => <li key={i}>{item}</li>));
    case "table": {
      const rows = (p.csv ?? "").split(/\r?\n/).filter(Boolean).slice(0, 100).map(r => r.split(",").slice(0, 40));
      return <table style={style} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-sm"><tbody>{rows.map((row,i) => <tr key={i}>{row.map((cell,j) => i === 0 ? <th className="border-b border-r border-slate-200 bg-slate-100 p-2 text-left" key={j}>{cell}</th> : <td className="border-b border-r border-slate-100 p-2" key={j}>{cell}</td>)}</tr>)}</tbody></table>;
    }
    case "memory": return <div style={style} className="rounded-2xl border border-orange-200 bg-slate-900 p-5 text-white"><p className="text-xl font-bold">{p.title || "Lật thẻ trí nhớ"}</p><div className="mt-3 grid grid-cols-4 gap-2">{Array.from({length:8},(_,i)=><span key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-center text-lg">✦</span>)}</div><p className="mt-3 text-xs text-slate-300">Bấm Chạy thử để chơi, Thuộc tính để đổi biểu tượng và số cặp.</p></div>;
    case "quiz": return <div style={style} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-900"><p className="font-bold">{p.title || "Trắc nghiệm"}</p><p className="mt-2 text-sm">Chạy thử để chơi và tính điểm. Chọn Thuộc tính để sửa câu hỏi.</p></div>;
    case "chart": {
      const values = (p.values ?? "").split(",").map(value => value.trim()).filter(Boolean)
        .map(Number).filter(n => Number.isFinite(n) && n >= 0).slice(0, 50);
      const max = Math.max(1, ...values);
      return <div style={style} className="flex min-h-32 flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
        {values.length === 0 ? <p className="py-8 text-center text-xs text-slate-500">Chưa có dữ liệu biểu đồ. Chọn thành phần rồi nhập số liệu trong Thuộc tính.</p> :
          <div className="flex h-40 w-full items-end gap-2 border-b border-slate-300 pb-1">
            {values.map((value, i) => <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={String(value)}>
              <span className="truncate text-[10px] text-slate-500">{value}</span>
              <div className="w-full min-w-2 rounded-t-md bg-orange-500 shadow-sm" style={{ height: `${Math.max(2, value / max * 100)}%` }} />
            </div>)}
          </div>}
      </div>;
    }
    case "iframe": return src ? <iframe src={src} title={p.title ?? "Embed"} style={style} sandbox="allow-scripts allow-forms" className="min-h-40 w-full border" /> : <div style={style}>Thiết lập URL nhúng</div>;
    case "container": {
      const children: ReactNode = <>
        <SortableContext items={node.children.map(c => `node:${c.id}`)} strategy={verticalListSortingStrategy}>
          {node.children.map(child => <CanvasNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onReorder={onReorder} onDuplicate={onDuplicate} />)}
        </SortableContext>
        <DropInside id={node.id} />
      </>;
      return createElement(def.tag, { style, className: "min-h-24 w-full min-w-0 rounded-xl border border-slate-200 shadow-sm "+responsiveLayoutClass(node.type,"studio-responsive") }, children);
    }
  }
}
export default function CanvasNode({ node, selectedId, onSelect, onReorder, onDuplicate }: CanvasNodeProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `node:${node.id}`, data: { kind: "node", id: node.id },
  });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    data-layout-container={getDefinition(node.type)?.allowsChildren ? "true" : undefined}
    className={`builder-node group min-w-0 rounded-xl border-2 border-dashed bg-white p-2.5 shadow-sm transition-[border-color,box-shadow,background-color] duration-150 sm:p-3 ${isDragging ? "border-orange-400 shadow-2xl shadow-black/30" : selectedId === node.id ? "border-orange-400 bg-orange-50/30 ring-2 ring-orange-400/15" : "border-slate-200 hover:border-sky-400 hover:shadow-lg hover:shadow-slate-200/80"}`}
    onClick={e => { e.stopPropagation(); onSelect(node.id); }}>
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
      <span className="min-w-0 truncate font-semibold text-slate-600">{getDefinition(node.type)?.label}</span>
      <span className="flex shrink-0 items-center gap-1">
       <button type="button" onClick={e=>{e.stopPropagation();onReorder?.(node.id,-1);}} aria-label="Đưa khối lên một vị trí" title="Lên trên" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 active:bg-orange-100"><ArrowUp size={17}/></button>
       <button type="button" onClick={e=>{e.stopPropagation();onReorder?.(node.id,1);}} aria-label="Đưa khối xuống một vị trí" title="Xuống dưới" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 active:bg-orange-100"><ArrowDown size={17}/></button>
       <button type="button" onClick={e=>{e.stopPropagation();onDuplicate?.(node.id);}} aria-label="Nhân đôi khối" title="Nhân đôi" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 active:bg-orange-100"><Copy size={16}/></button>
       <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} onClick={e=>e.stopPropagation()} aria-label="Giữ rồi kéo để sắp xếp khối" title="Giữ 0,26 giây và kéo" style={{touchAction:"none"}}
        className="drag-handle flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 active:bg-orange-200"><GripVertical size={20}/></button>
      </span>
    </div>
    <div className="min-w-0 overflow-hidden rounded-lg">
      <RenderElement node={node} selectedId={selectedId} onSelect={onSelect} onReorder={onReorder} onDuplicate={onDuplicate}/>
    </div>
  </div>;
}
