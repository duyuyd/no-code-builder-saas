"use client";
import {useState,type FormEvent} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {Figma,LoaderCircle,X} from "lucide-react";
import {importFigmaToPage} from "@/app/builder/figma-actions";
export default function FigmaImportPanel({projectId,pageId,unsaved}:{projectId:string;pageId:string;unsaved:boolean}){
 const [open,setOpen]=useState(false),[link,setLink]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(unsaved){setError("Save your pending canvas changes before importing to avoid losing your unsaved work.");return;}
  setBusy(true);setError("");
  try{const res=await importFigmaToPage(projectId,pageId,link);if(!res.ok){setError(res.error);return;}window.location.reload();}
  catch{setError("Figma import failed. Check the file access.");}finally{setBusy(false);}
 };
 return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="shrink-0 whitespace-nowrap rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/10"><Figma size={14} className="mr-1 inline"/> Import from Figma</button></Dialog.Trigger>
  <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[110] bg-slate-950/80"/><Dialog.Content className="fixed left-1/2 top-1/2 z-[111] w-[min(94vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-[#152238] p-6 text-slate-100 shadow-2xl">
   <div className="mb-4 flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-black">Import Figma design</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-slate-400">Paste a Figma file or frame URL. Supported frames, text, fills and shapes become editable builder nodes. Advanced vectors and effects may require manual recreation.</Dialog.Description></div><Dialog.Close aria-label="Close"><X size={19}/></Dialog.Close></div>
   <form onSubmit={submit} className="space-y-4"><label htmlFor="figma-file" className="block text-xs font-semibold">Figma design link</label><input id="figma-file" type="url" required maxLength={700} placeholder="https://www.figma.com/design/..." value={link} onChange={e=>setLink(e.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-xs outline-none focus:border-orange-400"/>
    {error&&<p role="alert" className="text-xs text-rose-300">{error}</p>}
    <button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-xs font-bold text-white disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={15}/>:<Figma size={15}/>} Import editable nodes</button>
   </form></Dialog.Content></Dialog.Portal>
 </Dialog.Root>;
}
