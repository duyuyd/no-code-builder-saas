"use client";
import {useEffect,useRef,useState} from "react";
import {syncProductNode} from "@/app/commerce/actions";
import type {BuilderNode} from "@/lib/component-registry";
export default function ProductSync({node,projectId}:{node:BuilderNode;projectId:string}){
 const [message,setMessage]=useState(""),[saving,setSaving]=useState(false);
 const serial=JSON.stringify(node.props);
 const latest=useRef(node);latest.current=node;
 async function persist(){
  setSaving(true);
  try{const r=await syncProductNode(projectId,latest.current);setMessage(r.ok?"Product synced to Supabase":r.error);}
  catch{setMessage("Product sync unavailable");}finally{setSaving(false);}
 }
 useEffect(()=>{
  if(!node.props.productName?.trim())return;
  const id=window.setTimeout(()=>void persist(),2200);return()=>window.clearTimeout(id);
 // stable node ID, project and serialized properties govern auto-save.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[projectId,node.id,serial]);
 return <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
  <p className="mb-2 text-xs font-bold">Commerce catalogue</p>
  <p className="mb-2 text-[11px] leading-5 text-slate-300">Name, price and image above auto-save to the product catalogue after 2 seconds. Storefront checkout needs payOS configuration.</p>
  <button disabled={saving} onClick={()=>void persist()} className="rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-bold disabled:opacity-50">Save product now</button>
  {message&&<p role="status" className="mt-2 text-[11px] text-orange-200">{message}</p>}
 </div>;
}
