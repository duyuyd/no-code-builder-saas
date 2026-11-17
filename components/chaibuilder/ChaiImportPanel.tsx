"use client";
import Link from "next/link";
import {useState,type FormEvent} from "react";
import {importChaiBlocks,type ImportResult} from "@/app/builder/chai-import/actions";
export default function ChaiImportPanel({projectId,pageId}:{projectId:string;pageId:string}){
 const [source,setSource]=useState(""),[working,setWorking]=useState(false),[result,setResult]=useState<ImportResult|null>(null);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(working)return;setWorking(true);setResult(null);
  try{setResult(await importChaiBlocks(projectId,pageId,source));}
  catch{setResult({ok:false,error:"Could not import Chai JSON."});}
  finally{setWorking(false);}
 }
 return <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-5">
  <p className="text-sm leading-7 text-slate-300">Import Chai Builder exported blocks without overwriting existing nodes. Only supported block types are imported, and unsupported blocks reject the entire import.</p>
  <label htmlFor="chai-json" className="block text-sm font-bold">Chai blocks JSON</label>
  <textarea id="chai-json" value={source} onChange={e=>setSource(e.target.value)} rows={13} required maxLength={120000} placeholder='{"blocks":[...]}' spellCheck={false} className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-orange-500"/>
  <p className="text-xs text-amber-200">Review styles after import. Existing Supabase page content is preserved. Imported blocks are appended and edited in the current Builder.</p>
  <button type="submit" disabled={working||source.trim().length<5} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold disabled:opacity-50">{working?"Đang lưu Supabase...":"Import Chai blocks"}</button>
  {result&&<p role="status" className={"rounded-xl border p-3 text-sm "+(result.ok?"border-emerald-700 text-emerald-300":"border-rose-700 text-rose-300")}>{result.ok?<>Imported {result.count} blocks. <Link href={"/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId)} className="underline">Open Builder</Link>{result.warnings.length?" · "+result.warnings.join(" "):""}</>:result.error}</p>}
 </form>;
}
