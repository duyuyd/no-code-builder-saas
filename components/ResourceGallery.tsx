"use client";
import {useMemo,useState} from "react";
import {ExternalLink,Gamepad2,Images,Search,ShieldCheck} from "lucide-react";
type Source={id:number;category:string;title:string;provider:string;url:string;license_notes:string;description:string};
export default function ResourceGallery({sources}:{sources:Source[]}){
 const [category,setCategory]=useState("Tất cả");
 const [query,setQuery]=useState("");
 const [visibleCount,setVisibleCount]=useState(18);
 const categories=useMemo(()=>["Tất cả",...new Set(sources.map(s=>s.category))],[sources]);
 const result=useMemo(()=>sources.filter(s=>{
  const matchesCategory=category==="Tất cả"||s.category===category;
  const term=query.trim().toLocaleLowerCase("vi-VN");
  return matchesCategory&&(!term||[s.title,s.description,s.category,s.provider].some(value=>value.toLocaleLowerCase("vi-VN").includes(term)));
 }),[sources,category,query]);
 return <div>
  <label className="mb-4 flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-slate-300"><Search size={18}/><input value={query} onChange={e=>{setQuery(e.target.value);setVisibleCount(18);}} placeholder="Tìm nhân vật, thời trang, sprite, icon..." aria-label="Tìm nguồn tài nguyên" className="w-full bg-transparent py-2 text-sm text-white outline-none"/></label>
  <div className="editor-scroll mb-6 flex gap-2 overflow-x-auto pb-2">{categories.map(item=><button type="button" key={item} onClick={()=>{setCategory(item);setVisibleCount(18);}} className={"shrink-0 rounded-xl px-3 py-2 text-xs font-bold "+(category===item?"bg-orange-500 text-white":"border border-slate-700 bg-slate-800 text-slate-300")}>{item}</button>)}</div>
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400"><Images size={17}/>{result.length} nguồn tài nguyên · Lấy file từ trang gốc</div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result.slice(0,visibleCount).map(source=><article key={source.id} className="flex flex-col rounded-2xl border border-slate-700 bg-[#1e293b] p-5 shadow-lg shadow-black/10">
   <div className="mb-3 flex items-start justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-orange-300">{source.category.startsWith("Game")?<Gamepad2 size={20}/>:<Images size={20}/>}</div><span className="rounded-full border border-slate-600 px-2.5 py-1 text-[11px] text-slate-300">{source.category}</span></div>
   <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">{source.provider}</p><h3 className="mt-2 text-lg font-bold text-white">{source.title}</h3>
   <p className="mt-3 min-h-14 flex-1 text-sm leading-6 text-slate-400">{source.description}</p>
   <p className="mt-4 flex items-start gap-1.5 text-xs text-emerald-300"><ShieldCheck size={14} className="mt-0.5 shrink-0"/> Điều kiện: {source.license_notes}</p>
   <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/50 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-200 hover:bg-orange-500/20">Xem và tải tài nguyên <ExternalLink size={17}/></a>
  </article>)}</div>
  {result.length>visibleCount&&<button type="button" onClick={()=>setVisibleCount(n=>n+18)} className="mt-6 w-full rounded-xl border border-orange-500/50 bg-orange-500/10 px-4 py-4 text-sm font-bold text-orange-200 hover:bg-orange-500/20">Xem thêm nguồn tài nguyên ({result.length-visibleCount} còn lại)</button>}
  {result.length===0&&<div className="rounded-xl border border-dashed border-slate-600 p-9 text-center text-slate-400">Không tìm thấy nguồn phù hợp. Thử từ khóa khác.</div>}
 </div>;
}
