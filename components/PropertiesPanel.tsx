"use client";
import {useEffect,useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {Brush,Box,ImagePlus,Info,Layers3,LoaderCircle,Settings2,SlidersHorizontal,Sparkles,Trash2,X,ExternalLink} from "lucide-react";
import {getDefinition,type BuilderNode,type FieldSchema} from "@/lib/component-registry";
import {createClient} from "@/lib/supabase/browser";
import {type ComponentPreset} from "@/lib/component-presets";
import AssetBrowser from "./AssetBrowser";

const presetCache=new Map<string,Promise<ComponentPreset[]>>();
function getPresets(type:string):Promise<ComponentPreset[]>{
 let req=presetCache.get(type);
 if(!req){
  req=Promise.resolve(createClient().from("component_presets").select("component_type,variant_key,label_vi,context_vi,props_override,style_override,children_template,sort_order")
   .eq("component_type",type).order("sort_order")).then(({data,error})=>{
    if(error)throw new Error(error.message);
    return (data??[]) as ComponentPreset[];
   });
  presetCache.set(type,req);
 }
 return req;
}
function PropertyField({field,name,value,onChange}:{field:FieldSchema;name:string;value:string;onChange:(value:string)=>void}){
 const id=name+"-field";
 const input="mt-2 w-full rounded-xl border border-slate-600 bg-[#0f172a] px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-orange-500";
 if(field.type==="boolean")return <label htmlFor={id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-slate-200">{field.label}<input id={id} type="checkbox" checked={value==="true"} onChange={e=>onChange(String(e.target.checked))} className="size-5 accent-orange-500"/></label>;
 return <label htmlFor={id} className="block text-xs font-medium text-slate-300"><span>{field.label}</span>
  {field.type==="textarea"?<textarea id={id} rows={4} value={value} onChange={e=>onChange(e.target.value)} className={input+" resize-y"}/>:
   field.type==="select"?<select id={id} value={value} onChange={e=>onChange(e.target.value)} className={input}>{(field.options??[]).map(option=><option key={option} value={option}>{option}</option>)}</select>:
   field.type==="color"?<div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950 p-2">
    <input id={id} type="color" value={value} onChange={e=>onChange(e.target.value)} className="h-9 w-12 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"/>
    <span className="flex-1 rounded bg-slate-800 p-2 font-mono text-xs">{value}</span>
   </div>:
    <input id={id} value={value} type={field.type==="number"?"number":field.type==="url"?"url":"text"} onChange={e=>onChange(e.target.value)} className={input}/>}
 </label>;
}
export default function PropertiesPanel({node,userId,onChange,onDelete,onApplyPreset}:{
 node:BuilderNode|null;userId:string;
 onChange:(id:string,field:"props"|"style",key:string,value:string)=>void;
 onDelete:(id:string)=>void;
 onApplyPreset:(id:string,preset:ComponentPreset)=>void;
}){
 const definition=node?getDefinition(node.type):null;
 const [presets,setPresets]=useState<ComponentPreset[]>([]);
 const [loading,setLoading]=useState(false);
 const [presetError,setPresetError]=useState("");
 const [assetOpen,setAssetOpen]=useState(false);
 const type=definition?.type??"";
 useEffect(()=>{
  if(!type){return;}
  let mounted=true;setLoading(true);setPresetError("");
  getPresets(type).then(result=>{if(mounted)setPresets(result);}).catch(e=>{if(mounted){setPresets([]);setPresetError(e instanceof Error?e.message:"Không tải được biến thể.");presetCache.delete(type);}})
   .finally(()=>{if(mounted)setLoading(false);});
  return ()=>{mounted=false;};
 },[type]);
 return <aside aria-label="Bảng thuộc tính thành phần" className="editor-scroll flex h-full min-h-0 flex-col overflow-hidden border-l border-slate-700/80 bg-[#1e293b]">
  <div className="shrink-0 border-b border-slate-700/80 p-4">
   <h2 className="flex items-center gap-2 text-sm font-bold"><Settings2 size={17} className="text-orange-400"/> Bảng thuộc tính</h2>
   <p className="mt-1 pl-6 text-[11px] text-slate-400">Chọn mẫu → sửa nội dung → tự lưu</p>
  </div>
  {!node||!definition?<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
   <SlidersHorizontal size={30} className="text-orange-300"/><p className="text-sm font-semibold">Chạm thành phần để chỉnh sửa</p>
   <p className="text-xs leading-5 text-slate-400">Mọi thành phần có 12 kiểu và ngữ cảnh. Chọn một kiểu sẽ áp dụng ngay, có thể hoàn tác.</p>
  </div>:
   <div key={node.id} className="editor-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
    <div className="flex items-center gap-3 rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
     <Box size={20} className="text-orange-300"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{definition.label}</p><p className="font-mono text-[11px] text-slate-400">{node.type}</p></div><Layers3 size={17} className="text-orange-300"/>
    </div>
    <section aria-label="Mẫu thiết kế có sẵn">
     <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-200"><Sparkles size={16}/> 12 cách thiết kế / ngữ cảnh</h3>
     <p className="mb-3 text-[11px] leading-5 text-slate-400">Chạm một mẫu để thay đổi màu, khoảng cách, lưới, viền và nội dung phù hợp. Có thể hoàn tác chỉ một lần.</p>
     {loading?<p className="flex items-center gap-2 text-xs text-slate-400"><LoaderCircle size={14} className="animate-spin"/> Đang tải mẫu...</p>:presetError?<p role="alert" className="text-xs text-rose-300">{presetError}</p>:
      <div className="grid grid-cols-2 gap-2">{presets.map(preset=><button type="button" key={preset.variant_key} onClick={()=>onApplyPreset(node.id,preset)}
       title={preset.label_vi} className="min-h-20 overflow-hidden rounded-xl border border-slate-600 bg-slate-900 p-1 text-left transition hover:border-orange-400 focus-visible:outline-2 focus-visible:outline-orange-400">
       <div className="mb-1 h-8 rounded-lg border border-white/10 p-2" style={{backgroundColor:preset.style_override.backgroundColor??"#0f172a",color:preset.style_override.color??"#ffffff"}}>
        <div className="h-1.5 w-1/2 rounded bg-current opacity-75"/><div className="mt-1 h-1 w-3/4 rounded bg-current opacity-35"/>
       </div>
       <p className="truncate px-1 text-[11px] font-bold text-slate-100">{preset.label_vi.split(" · ")[0]}</p>
       <p className="truncate px-1 text-[10px] text-slate-400">{preset.context_vi}</p>
       {preset.children_template?.length>0&&<p className="px-1 text-[10px] text-emerald-300">Có khối nội dung dựng sẵn</p>}
      </button>)}</div>}
    </section>
    {definition.kind==="image"&&<div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
     <p className="mb-2 text-xs text-slate-300">Hình ảnh đang chọn</p>
     {node.props.src?<img src={node.props.src} alt={node.props.alt??""} loading="lazy" className="mb-3 max-h-32 w-full rounded-lg object-contain"/>:<p className="mb-3 text-xs text-slate-500">Chưa chọn ảnh.</p>}
     <button type="button" onClick={()=>setAssetOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-xs font-bold text-white"><ImagePlus size={17}/> Chọn hoặc tải ảnh lên</button>
    </div>}
    <section className="space-y-4" aria-label="Nội dung thành phần">
     <h3 className="flex items-center gap-2 border-b border-slate-700 pb-2 text-xs font-bold uppercase tracking-wider text-slate-300"><SlidersHorizontal size={15} className="text-orange-400"/> Nội dung</h3>
     {Object.entries(definition.propsSchema).map(([key,field])=><PropertyField key={key} name={"prop-"+node.id+"-"+key} field={field} value={node.props[key]??field.defaultValue} onChange={value=>onChange(node.id,"props",key,value)}/>)}
     {!Object.keys(definition.propsSchema).length&&<p className="text-xs text-slate-500">Thành phần này không có trường nội dung.</p>}
    </section>
    <section className="space-y-4" aria-label="Kiểu dáng">
     <h3 className="flex items-center gap-2 border-b border-slate-700 pb-2 text-xs font-bold uppercase tracking-wider text-slate-300"><Brush size={15} className="text-orange-400"/> Màu và kích thước</h3>
     {Object.entries(definition.styleSchema).filter(([key])=>["color","backgroundColor","fontSize","padding","borderRadius","gap","gridColumns","textAlign"].includes(key)).map(([key,field])=>
      <PropertyField key={key} name={"style-"+node.id+"-"+key} field={field} value={node.style[key]??field.defaultValue} onChange={value=>onChange(node.id,"style",key,value)}/>)}
     <details className="rounded-xl border border-slate-700 p-3"><summary className="cursor-pointer text-xs font-semibold text-orange-200">Tùy chỉnh nâng cao: lề, viền, bóng, căn khối</summary>
      <div className="mt-4 space-y-4">{Object.entries(definition.styleSchema).filter(([key])=>!["color","backgroundColor","fontSize","padding","borderRadius","gap","gridColumns","textAlign"].includes(key)).map(([key,field])=>
       <PropertyField key={key} name={"advanced-"+node.id+"-"+key} field={field} value={node.style[key]??field.defaultValue} onChange={value=>onChange(node.id,"style",key,value)}/>)}</div>
     </details>
    </section>
    <button type="button" onClick={()=>onDelete(node.id)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-300"><Trash2 size={15}/> Xóa thành phần này</button>
    <div className="flex items-center gap-2 pb-6 text-[11px] text-slate-400"><Info size={13}/> Thay đổi tự lưu sau 2 giây.</div>
   </div>}
  <Dialog.Root open={assetOpen} onOpenChange={setAssetOpen}>
   <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/80"/>
    <Dialog.Content className="fixed inset-3 z-[71] flex flex-col overflow-hidden rounded-2xl bg-[#0f172a] p-3 text-white shadow-2xl outline-none sm:inset-10">
     <div className="mb-3 flex items-center justify-between gap-3 px-2"><Dialog.Title className="flex items-center gap-2 font-bold"><ImagePlus size={19}/> Chọn ảnh cho {definition?.label}</Dialog.Title><Dialog.Close className="rounded-lg bg-slate-700 p-2" aria-label="Đóng thư viện ảnh"><X size={18}/></Dialog.Close></div>
     <Dialog.Description className="sr-only">Chọn ảnh trong kho cá nhân hoặc tải ảnh mới.</Dialog.Description>
     <div className="editor-scroll min-h-0 flex-1 overflow-auto">
      <AssetBrowser userId={userId} onPick={url=>{if(node)onChange(node.id,"props","src",url);setAssetOpen(false);}}/>
     </div>
     <a href="/resources" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-orange-300"><ExternalLink size={15}/> Khám phá nguồn ảnh, icon và game asset</a>
    </Dialog.Content>
   </Dialog.Portal>
  </Dialog.Root>
 </aside>;
}
