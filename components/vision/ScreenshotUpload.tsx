"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ImagePlus,LoaderCircle,ArrowRight} from "lucide-react";
import {screenshotToApp} from "@/app/screenshot-to-app/actions";
export default function ScreenshotUpload(){
 const router=useRouter(),[file,setFile]=useState<File|null>(null),[notes,setNotes]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!file||busy)return;setBusy(true);setError("");
  const data=new FormData();data.set("screenshot",file);data.set("instruction",notes);
  try{const res=await screenshotToApp(data);if(res.ok){router.push("/builder?project="+encodeURIComponent(res.projectId));return;}setError(res.error);}
  catch{setError("Could not contact vision service.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-9">
  <label htmlFor="vision-upload" className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-500/50 bg-slate-800 p-4 text-center"><ImagePlus size={32} className="text-orange-400"/><span className="text-sm font-semibold">{file?file.name:"Select a screenshot (PNG / JPG / WebP)"}</span><span className="text-xs text-slate-400">Max 3 MB · Only upload designs you may use</span><input id="vision-upload" type="file" accept="image/png,image/jpeg,image/webp" required className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
  <label className="block text-xs font-semibold text-slate-300">Instructions (optional)<textarea rows={3} maxLength={400} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recreate the visual design using editable blocks..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm text-white"/></label>
  <button disabled={!file||busy} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold disabled:opacity-50">{busy?<LoaderCircle size={18} className="animate-spin"/>:<ImagePlus size={18}/>} Generate editable project <ArrowRight size={16}/></button>
  {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
  <p className="text-xs leading-6 text-slate-400">The AI reconstructs a layout, not the original app's code, assets, functionality or ownership. You can edit the result in the existing Builder.</p>
 </form>;
}
