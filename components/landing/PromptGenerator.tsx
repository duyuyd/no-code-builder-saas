"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ArrowUpRight,LoaderCircle,Sparkles} from "lucide-react";
import {generateWebsiteFromPrompt} from "@/app/generate/actions";
export default function PromptGenerator({placeholder}:{placeholder:string}){
 const router=useRouter(),[prompt,setPrompt]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy||prompt.trim().length<12)return;setBusy(true);setError("");
  try{
   const result=await generateWebsiteFromPrompt(prompt.trim());
   if(result.ok){router.push("/builder?project="+encodeURIComponent(result.projectId));return;}
   if(result.reason==="signin"){router.push("/login?mode=register");return;}
   setError(result.error);
  }catch{setError("Unable to generate your website right now.");}
  finally{setBusy(false);}
 };
 return <form onSubmit={submit} className="relative mt-8 max-w-xl">
  <label htmlFor="landing-prompt" className="mb-2 block text-xs font-bold uppercase tracking-[.18em] text-orange-300"><Sparkles size={14} className="mr-1 inline"/> AI website generator</label>
  <div className="flex flex-col gap-2 rounded-2xl border border-orange-400/35 bg-slate-900/90 p-2 shadow-[0_12px_60px_rgba(249,115,22,.1)] sm:flex-row sm:items-end">
   <textarea id="landing-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} minLength={12} maxLength={850} rows={2} required
    placeholder={placeholder} className="min-h-20 min-w-0 flex-1 resize-y rounded-xl bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 sm:min-h-14"/>
   <button disabled={busy} type="submit" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-60">
    {busy?<LoaderCircle size={17} className="animate-spin"/>:<Sparkles size={17}/>} Generate <ArrowUpRight size={17}/>
   </button>
  </div>
  <p className="mt-2 text-xs text-slate-500">Requires an account and an AI provider enabled by the administrator. No demo-generated content is passed off as real AI.</p>
  {error&&<p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
 </form>;
}
