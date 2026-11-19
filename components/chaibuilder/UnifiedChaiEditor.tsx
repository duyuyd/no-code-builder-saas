"use client";
import {useMemo,useRef,useState} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type {BuilderNode} from "@/lib/component-registry";
import {migrateToChai} from "@/lib/unified-chai-bridge";
import {extractFormSchemas} from "@/lib/auto-database";
import FormDatabasePanel from "./FormDatabasePanel";
import FigmaPageImporter from "@/components/studio/FigmaPageImporter";
import {saveUnifiedChai} from "@/app/builder/chai-save-actions";
import {publishProject,unpublishProject} from "@/app/builder/actions";
import {registerNuvoraBlocks} from "./ChaiRegistry";
const ChaiEditor=dynamic(()=>import("@chaibuilder/sdk").then(x=>x.ChaiBuilderEditor),{ssr:false,loading:()=><p className="p-8 text-slate-300">Đang tải ChaiBuilder...</p>});
export default function UnifiedChaiEditor({projectId,pageId,projectName,pagePath,initialNodes,initialVersion,initiallyPublished}:{
 projectId:string;pageId:string;projectName:string;pagePath:string;initialNodes:BuilderNode[];initialVersion:number;initiallyPublished:boolean;
}){
 registerNuvoraBlocks();
 const blocks=useMemo(()=>migrateToChai(initialNodes),[initialNodes]);
 const version=useRef(initialVersion),base=useRef(initialNodes);
 const [published,setPublished]=useState(initiallyPublished),[notice,setNotice]=useState(""),[saving,setSaving]=useState(false);
 const [forms,setForms]=useState(()=>extractFormSchemas(initialNodes));
 const save=async({blocks:updated}:{blocks:unknown[]})=>{
  setSaving(true);setNotice("");
  try{
   const result=await saveUnifiedChai(projectId,pageId,updated,version.current,base.current);
   if(!result.ok){setNotice("Không lưu: "+result.error);return new Error(result.error);}
   version.current=result.version;base.current=result.tree;setForms(extractFormSchemas(result.tree));
   setNotice(result.warnings?.length?"Đã lưu, lưu ý: "+result.warnings.join(" | "):"Đã lưu vào Supabase pages.ui_tree.");
   return true;
  }catch(e){const message=e instanceof Error?e.message:"Không thể lưu ChaiBuilder";setNotice(message);return new Error(message);}
  finally{setSaving(false);}
 };
 const publish=async()=>{
  setNotice("Đang xuất bản...");
  const result=published?await unpublishProject(projectId):await publishProject(projectId);
  if(!result.ok){setNotice(result.error);return;}
  setPublished(!published);setNotice(published?"Đã ẩn website.":"Đã xuất bản "+result.count+" trang.");
 };
 return <div className="flex h-full min-h-0 flex-1 flex-col bg-[#0b1323]">
  <header className="z-40 flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
   <span className="mr-auto min-w-0 truncate font-bold">{projectName} · {pagePath} · ChaiBuilder</span>
   <Link href={"/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId)+"&mode=inspect"} className="rounded-lg border border-amber-500/60 px-3 py-2 text-amber-200">Xem JSON bản gốc</Link>
   <Link href={"/studio-3d?project="+projectId+"&page="+pageId} className="rounded-lg border border-slate-600 px-3 py-2">3D / Timeline</Link>
   <details className="relative"><summary className="cursor-pointer rounded-lg border border-slate-600 px-3 py-2">Import Figma</summary><div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[92vw] rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"><FigmaPageImporter projectId={projectId} pageId={pageId} compact/></div></details>
   <Link href={"/video-studio?project="+projectId+"&page="+pageId} className="rounded-lg border border-slate-600 px-3 py-2">🎬 Tạo Video Demo</Link>
   <FormDatabasePanel projectId={projectId} pageId={pageId} forms={forms}/>
   <Link href={"/form-data?project="+projectId} className="rounded-lg border border-slate-600 px-3 py-2">Auto-Database</Link>
   <a href={"/api/projects/"+projectId+"/export"} className="rounded-lg border border-slate-600 px-3 py-2">Source ZIP</a>
   <button type="button" disabled={saving} onClick={()=>void publish()} className="rounded-lg bg-orange-500 px-3 py-2 font-bold disabled:opacity-50">{published?"Ẩn website":"Xuất bản"}</button>
   {published&&<a target="_blank" rel="noreferrer" href={"/s/"+projectId} className="text-orange-200">Xem Live</a>}
  </header>
  {notice&&<p role="status" className="shrink-0 border-b border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-200">{notice}</p>}
  <div className="min-h-0 flex-1 overflow-hidden">
   <ChaiEditor key={pageId} pageId={pageId} blocks={blocks} autoSave onSave={save} flags={{dragAndDrop:true,copyPaste:true,importHtml:true}}/>
  </div>
 </div>;
}
