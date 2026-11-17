"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {setPluginEnabled} from "@/app/plugins/actions";
type Plugin={id:string;name:string;version:string;enabled:boolean};
export default function PluginSettings({plugins}:{plugins:Plugin[]}){
 const router=useRouter(),[url,setUrl]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const install=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setMessage("");
  try{const res=await fetch("/api/plugins/install",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({manifestUrl:url})});
   const data=await res.json() as {error?:string;id?:string};
   setMessage(res.ok?"Manifest installed. Review and enable before using: "+data.id:(data.error??"Install failed"));
   if(res.ok){setUrl("");router.refresh();}
  }catch{setMessage("Plugin registry unavailable");}finally{setBusy(false);}
 };
 return <div className="space-y-6"><form onSubmit={install} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5"><label className="block text-xs font-bold">Pinned JSON manifest URL<input type="url" required maxLength={500} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/creator/plugin/COMMIT/plugin.json" className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-sm"/></label><button disabled={busy} className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold disabled:opacity-60">Install manifest</button>{message&&<p role="status" className="text-xs text-orange-200">{message}</p>}</form>
  <div className="space-y-3">{plugins.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4"><div><p className="font-bold">{p.name} · {p.version}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{p.id}</p></div><button onClick={async()=>{const res=await setPluginEnabled(p.id,!p.enabled);if(res.ok)router.refresh();else setMessage(res.error??"Cannot change plugin status");}} className="rounded-lg border border-orange-500/40 px-3 py-2 text-xs">{p.enabled?"Disable":"Enable"}</button></div>)}</div>
 </div>;
}
