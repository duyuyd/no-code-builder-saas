"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {generateBlogDraft,publishBlogPost} from "@/app/blog/actions";
type Draft={id:string;title:string;excerpt:string;published:boolean};
export default function BlogEditor({drafts}:{drafts:Draft[]}){
 const router=useRouter(),[topic,setTopic]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function make(e:FormEvent){e.preventDefault();setBusy(true);setError("");
  const res=await generateBlogDraft(topic);if(!res.ok)setError(res.error);else{setTopic("");router.refresh();}
  setBusy(false);
 }
 return <div className="space-y-7"><form onSubmit={make} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
  <label htmlFor="blog-topic" className="block text-xs font-bold">Article topic<input id="blog-topic" required minLength={12} maxLength={180} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="How to build a 3D game with a visual editor" className="mt-2 w-full rounded-xl bg-slate-800 p-3 text-sm"/></label>
  <button disabled={busy} className="rounded-lg bg-orange-500 px-4 py-3 text-xs font-bold disabled:opacity-50">{busy?"Generating...":"Generate SEO draft"}</button>{error&&<p role="alert" className="text-xs text-rose-300">{error}</p>}
 </form><section className="space-y-4"><h2 className="text-xl font-bold">Review before publishing</h2>{drafts.map(d=><div key={d.id} className="rounded-xl border border-slate-700 bg-slate-900 p-5"><p className="font-bold">{d.title}</p><p className="my-3 text-sm text-slate-400">{d.excerpt}</p><p className="text-xs">{d.published?"Published":"Draft · requires review"}</p>{!d.published&&<button onClick={async()=>{setBusy(true);const x=await publishBlogPost(d.id);if(x.ok)router.refresh();else setError(x.error??"Publish failed");setBusy(false);}} disabled={busy} className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold disabled:opacity-50">Publish reviewed article</button>}</div>)}</section></div>;
}
