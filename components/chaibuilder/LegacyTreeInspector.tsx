"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {BuilderNode} from "@/lib/component-registry";
import LivePage from "@/components/LivePage";

type Props={projectId:string;pageId:string;projectName:string;pagePath:string;initialNodes:BuilderNode[]};

export default function LegacyTreeInspector({projectId,pageId,projectName,pagePath,initialNodes}:Props){
 const [source,setSource]=useState(false);
 const json=useMemo(()=>JSON.stringify(initialNodes,null,2),[initialNodes]);
 const nodeCount=useMemo(()=>{
  const count=(nodes:BuilderNode[]):number=>nodes.reduce((acc,node)=>acc+1+count(node.children),0);
  return count(initialNodes);
 },[initialNodes]);
 function download(){
  const blob=new Blob([json],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="nuvoracraft-ui-tree-"+pageId+".json";
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-white">
  <header className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 p-3">
   <strong className="min-w-0 flex-1 truncate">{projectName} · {pagePath} · Saved JSON inspector</strong>
   <span className="text-xs text-slate-300">{nodeCount} thành phần · xem dữ liệu, không tự ghi đè</span>
   <button type="button" onClick={()=>setSource(x=>!x)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">{source?"Xem giao diện":"Xem JSON"}</button>
   <button type="button" onClick={download} className="rounded-lg border border-orange-400 px-3 py-2 text-xs text-orange-200">Xuất JSON bản gốc</button>
   <Link href={"/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId)} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold">Mở ChaiBuilder</Link>
  </header>
  <div className="min-h-0 flex-1 overflow-auto p-4">
   {source
    ? <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs leading-6 whitespace-pre-wrap break-words">{json}</pre>
    : <div className="mx-auto max-w-6xl overflow-hidden rounded-xl bg-white"><LivePage nodes={initialNodes}/></div>}
  </div>
 </section>;
}
