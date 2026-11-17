"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ImagePlus,LoaderCircle,ArrowRight} from "lucide-react";
export default function ScreenshotUpload(){
 const router=useRouter(),[file,setFile]=useState<File|null>(null),[notes,setNotes]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!file||busy)return;setBusy(true);setError("");
  try{
   const imageDataUrl=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(Error("Invalid image"));reader.onerror=()=>reject(Error("Cannot read image"));reader.readAsDataURL(file);
   });
   const response=await fetch("/api/vision",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({imageDataUrl,instruction:notes})});
   const result=await response.json() as {projectId?:string;ui_tree?:unknown;error?:string};
   if(response.ok&&result.projectId&&Array.isArray(result.ui_tree)){router.push("/builder?project="+encodeURIComponent(result.projectId));return;}
   setError(result.error??"Vision service returned no editable project.");
  }catch{setError("Could not contact OpenAI Vision.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-9">
  <label htmlFor="vision-upload" className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-500/50 bg-slate-800 p-4 text-center"><ImagePlus size={32} className="text-orange-400"/><span className="text-sm font-semibold">{file?file.name:"Select a screenshot (PNG / JPG / WebP)"}</span><span className="text-xs text-slate-400">Max 3 MB · Only upload designs you may use</span><input id="vision-upload" type="file" accept="image/png,image/jpeg,image/webp" required className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
  <label className="block text-xs font-semibold text-slate-300">Instructions (optional)<textarea rows={3} maxLength={400} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recreate the visual design using editable blocks..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm text-white"/></label>
  <button disabled={!file||busy} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold disabled:opacity-50">{busy?<LoaderCircle size={18} className="animate-spin"/>:<ImagePlus size={18}/>} Generate editable project <ArrowRight size={16}/></button>
  {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
  <p className="text-xs leading-6 text-slate-400">The AI reconstructs a layout, not the original app's code, assets, functionality or ownership. You can edit the result in the existing Builder.</p>
 </form>;
}
