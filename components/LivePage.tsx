"use client";
import CommerceNode from "@/components/commerce/CommerceNode";
import PluginSlot from "@/components/plugins/PluginSlot";
import { createElement, useMemo, useState, type CSSProperties, type ReactNode, type FormEvent, type MouseEvent } from "react";
import { ArrowRight, RotateCcw, Trophy, Image as ImageIcon } from "lucide-react";
import { getDefinition, nodeCss, safeUrl, sanitizeNumeric, type BuilderNode } from "@/lib/component-registry";
import { responsiveLayoutClass } from "@/lib/responsive-layout";
import {formFieldName} from "@/lib/auto-database";
import dynamic from "next/dynamic";
const MemoryMatchGame = dynamic(() => import("./MemoryMatchGame"), { ssr: false, loading: () => <div className="rounded-2xl bg-slate-900 p-6 text-sm text-slate-300">Đang tải trò chơi...</div> });

function Quiz({node}:{node:BuilderNode}) {
 const questions=useMemo(()=>(node.props.questions??"").split(/\r?\n/).map(row=>row.split("|").map(s=>s.trim()))
   .filter(row=>row.length===6 && row.slice(0,5).every(Boolean) && /^[1-4]$/.test(row[5])).slice(0,40),[node.props.questions]);
 const [i,setI]=useState(0),[answer,setAnswer]=useState<number|null>(null),[score,setScore]=useState(0);
 const current=questions[i];
 return <section id="quiz" style={nodeCss(node) as CSSProperties} className="rounded-3xl border border-indigo-100 p-5 shadow-md">
   <h2 className="mb-3 text-xl font-bold">{node.props.title||"Trắc nghiệm"} <span className="float-right text-xs">{Math.min(i+1,questions.length)}/{questions.length}</span></h2>
   {!questions.length?<p>Nhập mỗi câu theo dạng: Câu hỏi|A|B|C|D|1</p>:i>=questions.length?
    <div className="space-y-4 rounded-2xl bg-white p-6 text-center text-slate-900"><Trophy className="mx-auto text-amber-500" size={36}/><p className="text-2xl font-bold">{score}/{questions.length} điểm</p><button onClick={()=>{setI(0);setScore(0);setAnswer(null)}} className="rounded-xl bg-indigo-600 px-5 py-3 text-white"><RotateCcw className="mr-1 inline" size={16}/> Chơi lại</button></div>:
    <div><div className="mb-4 h-2 overflow-hidden rounded-full bg-indigo-100"><div className="h-full bg-indigo-600" style={{width:(100*i/questions.length)+"%"}}/></div>
    <p className="mb-4 text-lg font-semibold">{current[0]}</p><div className="grid gap-2 sm:grid-cols-2">{current.slice(1,5).map((value,j)=><button key={j} type="button" disabled={answer!==null} onClick={()=>{setAnswer(j);if(j===Number(current[5])-1)setScore(s=>s+1)}} className={"rounded-xl border p-4 text-left text-sm font-semibold transition "+(answer===null?"border-indigo-200 bg-white text-slate-800 hover:border-indigo-500":j===Number(current[5])-1?"border-emerald-500 bg-emerald-50 text-emerald-900":answer===j?"border-rose-500 bg-rose-50 text-rose-900":"border-slate-200 bg-white text-slate-400")}>{String.fromCharCode(65+j)}. {value}</button>)}</div>
    {answer!==null&&<div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm">{answer===Number(current[5])-1?"✅ Chính xác!":"Đáp án đúng: "+current[Number(current[5])]}</p><button type="button" onClick={()=>{setI(v=>v+1);setAnswer(null)}} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">{i+1===questions.length?"Xem điểm":"Tiếp tục"} <ArrowRight size={15} className="inline"/></button></div>}</div>}
 </section>;
}
function Item({node,projectId,onNavigate}:{node:BuilderNode;projectId?:string;onNavigate?:(path:string)=>void}) {
 const def=getDefinition(node.type); const [feedback,setFeedback]=useState(""); if(!def)return null;
 const p=node.props,s=nodeCss(node) as CSSProperties,src=safeUrl(p.src??""),href=safeUrl(p.href??"");
 const url=href.startsWith("/")&&projectId?"/s/"+projectId+(href==="/"? "":href):href;
 const navigate=(event:MouseEvent<HTMLAnchorElement>)=>{if(href.startsWith("/")&&onNavigate){event.preventDefault();onNavigate(href)}};
 const text=p.text??"";
 if(["product-card","product-grid","cart","checkout-form"].includes(node.type))return <CommerceNode node={node} projectId={projectId}/>;
 if(node.type==="plugin-slot")return <PluginSlot pluginId={node.props.pluginId??""}/>;
 switch(def.kind){
  case "quiz":return <Quiz node={node}/>;
  case "memory":return <MemoryMatchGame node={node}/>;
  case "text":return createElement(def.tag,{style:s,className:"max-w-full whitespace-pre-wrap break-words"},text);
  case "button":return node.type==="submit-button"?<button type="submit" style={s} className="w-fit rounded-xl shadow-sm">{text}</button>:href?<a href={url} onClick={navigate} style={s} className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl shadow-sm hover:brightness-95">{text}<ArrowRight size={15}/></a>:<button type="button" style={s} onClick={()=>setFeedback("Chưa cấu hình liên kết.")} className="w-fit rounded-xl shadow-sm">{text}{feedback&&<span className="ml-2 text-xs">{feedback}</span>}</button>;
  case "link":return <a href={url||"#"} onClick={navigate} style={s} className="break-all underline underline-offset-4">{text}</a>;
  case "image":return src?<img src={src} alt={p.alt??""} loading="lazy" style={s} className="max-w-full rounded-xl object-cover shadow-md"/>:<div style={{...s,backgroundColor:"#f1f5f9",color:"#475569",minHeight:150,padding:16}} className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 text-center text-sm"><ImageIcon size={28} className="text-slate-400"/><span className="break-words">Chưa có ảnh — chọn từ Kho ảnh trong Builder</span></div>;
  case "video":return src?<video controls src={src} style={s} className="max-w-full rounded-xl"/>:<div>Chưa có URL video</div>;
  case "audio":return src?<audio controls src={src} style={s} className="max-w-full"/>:<div>Chưa có URL âm thanh</div>;
  case "divider":return def.tag==="hr"?<hr style={s}/>:<div style={{...s,height:20}}/>;
  case "input":return <input style={s} type={node.type==="email-input"?"email":node.type==="password-input"?"password":node.type==="number-input"?"number":node.type==="date-input"?"date":node.type==="time-input"?"time":node.type==="file-input"?"file":"text"} name={formFieldName(node)} placeholder={p.placeholder??""} className="max-w-full border border-slate-300"/>;
  case "textarea":return <textarea style={s} name={p.name??""} placeholder={p.placeholder??""} rows={3} className="w-full border border-slate-300"/>;
  case "select":return <select style={s} name={p.name??""} className="max-w-full border border-slate-300">{(p.options??"").split(/\r?\n/).filter(Boolean).map((v,i)=><option key={i}>{v}</option>)}</select>;
  case "checkbox":return <label style={s} className="inline-flex items-center gap-2"><input type={node.type==="radio"?"radio":"checkbox"} name={formFieldName(node)} defaultChecked={p.checked==="true"}/>{text}</label>;
  case "range":return <input type="range" style={s} min={sanitizeNumeric(p.min??"",0)} max={sanitizeNumeric(p.max??"",100)}/>;
  case "progress":return createElement(def.tag,{style:s,value:sanitizeNumeric(p.value??"",0),max:sanitizeNumeric(p.max??"",100,1,10000)});
  case "list":return createElement(def.tag,{style:s},(p.items??"").split(/\r?\n/).filter(Boolean).map((v,i)=><li key={i}>{v}</li>));
  case "table":{const rows=(p.csv??"").split(/\r?\n/).filter(Boolean).slice(0,100).map(x=>x.split(",").slice(0,40));return <div className="overflow-x-auto"><table style={s} className="w-full border-collapse"><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=>i===0?<th key={j} className="border p-2 text-left">{v}</th>:<td key={j} className="border p-2">{v}</td>)}</tr>)}</tbody></table></div>}
  case "chart":{const values=(p.values??"").split(",").map(Number).filter(v=>Number.isFinite(v)&&v>=0).slice(0,50);const max=Math.max(1,...values);return <div style={s} className="flex min-h-40 items-end gap-2 rounded-xl border border-slate-200">{values.length?values.map((v,i)=><div key={i} title={String(v)} style={{height:(Math.max(2,v/max*100))+"%"}} className="min-w-2 flex-1 rounded-t-md bg-orange-500"/>):<p className="m-auto text-sm text-slate-500">Hãy nhập dữ liệu biểu đồ</p>}</div>;}
  case "iframe":return src?<iframe style={s} src={src} title={p.title||"Nhúng"} sandbox="allow-scripts allow-forms" loading="lazy" className="min-h-40 w-full rounded-xl border"/>:<p>Chưa có URL nhúng</p>;
  case "container":{
   const children:ReactNode=node.children.map(n=><Item key={n.id} node={n} projectId={projectId} onNavigate={onNavigate}/>);
   if(def.tag==="form"){
    const submit=async(e:FormEvent<HTMLFormElement>)=>{
     e.preventDefault();const form=e.currentTarget;const data=new FormData(form);
     const values:Record<string,string|boolean>={};
     for(const [key,val] of data.entries())if(typeof val==="string"&&key.length<=40)values[key]=val.slice(0,2000);
     for(const field of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')))if(field.name)values[field.name]=field.checked;
     if(!projectId){setFeedback("Biểu mẫu cần được xuất bản trong dự án.");return;}
     setFeedback("Đang gửi biểu mẫu...");
     try{
      const res=await fetch("/api/forms/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId,nodeId:node.id,values})});
      const result=await res.json() as {ok?:boolean;error?:string};
      if(!res.ok||!result.ok){setFeedback(result.error??"Không thể gửi biểu mẫu.");return;}
      form.reset();setFeedback("Đã lưu thông tin thành công.");
     }catch{setFeedback("Không kết nối được hệ thống lưu biểu mẫu.");}
    };
    return <form onSubmit={submit} style={s} className="flex min-w-0 flex-col gap-3 rounded-xl">{children}{feedback&&<p role="alert" className="text-xs text-rose-600">{feedback}</p>}</form>;
   }
   return createElement(def.tag,{style:s,className:"min-w-0 max-w-full rounded-xl "+responsiveLayoutClass(node.type,"studio-responsive")},children);
  }
 }
}
export default function LivePage({nodes,projectId,onNavigate}:{nodes:BuilderNode[];projectId?:string;onNavigate?:(path:string)=>void}) {
 return <main className="studio-responsive-root min-w-0 bg-white text-slate-900"><div className="mx-auto flex min-h-[60dvh] max-w-6xl flex-col gap-4 p-3 sm:p-6">{nodes.map(n=><Item key={n.id} node={n} projectId={projectId} onNavigate={onNavigate}/>)}</div></main>;
}
