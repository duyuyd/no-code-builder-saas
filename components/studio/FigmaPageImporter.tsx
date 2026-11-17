"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {FileInput,LoaderCircle} from "lucide-react";
import {importFigmaToPage} from "@/app/builder/figma-actions";
export default function FigmaPageImporter({projectId,pageId}:{projectId:string;pageId:string}){
 const router=useRouter();const [link,setLink]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(pending)return;setError("");setPending(true);
  try{const r=await importFigmaToPage(projectId,pageId,link.trim());if(!r.ok){setError(r.error);return;}
   router.push("/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId));
   router.refresh();
  }catch{setError("Figma import failed. Check access to the file.");}finally{setPending(false);}
 };
 return <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
  <label htmlFor="figma-url" className="text-sm font-bold">URL Figma</label>
  <input id="figma-url" type="url" required maxLength={700} value={link} onChange={e=>setLink(e.target.value)} placeholder="https://www.figma.com/design/..." className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-sm outline-none focus:border-orange-400"/>
  {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
  <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold disabled:opacity-60">{pending?<LoaderCircle size={18} className="animate-spin"/>:<FileInput size={18}/>} Import và mở Builder</button>
 </form>;
}
