"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {publishMarketplaceItem,acquireFreeTemplate,deliverPurchasedItem} from "@/app/marketplace/actions";
export function PublishListing({projects}:{projects:{id:string;name:string}[]}){
 const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");
  try{const res=await publishMarketplaceItem(new FormData(e.currentTarget));if(!res.ok)setError(res.error);else router.refresh();}
  catch{setError("Unable to publish");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:grid-cols-2"><h2 className="sm:col-span-2 text-lg font-bold">Publish a template</h2>
  <input required name="title" minLength={5} maxLength={120} placeholder="Template title" className="rounded-xl bg-slate-800 p-3 text-sm"/>
  <select required name="projectId" className="rounded-xl bg-slate-800 p-3 text-sm"><option value="">Choose your published project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
  <select name="type" className="rounded-xl bg-slate-800 p-3 text-sm"><option value="website">Website</option><option value="app">App</option><option value="game">Game</option><option value="component">Component</option></select>
  <label className="text-sm text-slate-300">Price in VND <input name="priceVnd" type="number" min={0} max={100000000} defaultValue={0} className="mt-1 w-full rounded-xl bg-slate-800 p-3"/></label>
  <textarea name="summary" maxLength={2000} rows={3} placeholder="Describe the template..." className="rounded-xl bg-slate-800 p-3 text-sm sm:col-span-2"/>
  {error&&<p role="alert" className="text-rose-300 sm:col-span-2">{error}</p>}
  <button disabled={busy||!projects.length} className="rounded-lg bg-orange-500 p-3 text-sm font-bold disabled:opacity-50">Publish listing</button>
 </form>;
}
export function MarketBuy({itemId,price}:{itemId:string;price:number}){
 const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function go(){
  setBusy(true);setError("");
  if(price===0){
   const result=await acquireFreeTemplate(itemId);
   if(result.ok){router.push("/builder?project="+result.id);return;}
   setError(result.error);
  }else{
   try{
    const response=await fetch("/api/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({itemId})});
    const json=await response.json() as {checkoutUrl?:string;error?:string};
    if(response.ok&&json.checkoutUrl?.startsWith("https://pay.payos.vn/")){window.location.assign(json.checkoutUrl);return;}
    setError(json.error??"Paid marketplace checkout unavailable");
   }catch{setError("Cannot start payment.");}
  }
  setBusy(false);
 }
 return <div><button disabled={busy} onClick={()=>void go()} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?"Processing...":price===0?"Get free template":"Buy · "+price.toLocaleString("vi-VN")+" ₫"}</button>{error&&<p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}</div>;
}
export function DeliverOrder({id}:{id:string}){
 const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 return <div><button disabled={busy} onClick={async()=>{setBusy(true);const result=await deliverPurchasedItem(id);if(result.ok)router.push("/builder?project="+result.id);else setError(result.error);setBusy(false);}} className="rounded bg-orange-500 px-3 py-2 text-xs font-bold">Claim purchased template</button>{error&&<p className="text-xs text-rose-300">{error}</p>}</div>;
}
