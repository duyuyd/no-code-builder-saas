"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/browser";
export default function PluginPicker({value,onChange}:{value:string;onChange:(id:string)=>void}){
 const [plugins,setPlugins]=useState<Array<{id:string;name:string}>>([]);
 useEffect(()=>{let alive=true;const db=createClient();void db.from("studio_plugins").select("id,name").eq("enabled",true).order("name").limit(50).then(({data})=>{if(alive)setPlugins(data??[]);});return()=>{alive=false;};},[]);
 return <label className="block text-xs font-medium text-slate-300">Installed plugin<select value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="">Choose plugin</option>{plugins.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>;
}
