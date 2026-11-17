"use client";
import {useState} from "react";
export default function StorePurchaseButton({productId}:{productId:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function buy(){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({productId,quantity:1})});
   const obj=await response.json() as {checkoutUrl?:string;error?:string};
   if(!response.ok||!obj.checkoutUrl){setError(obj.error??"Checkout unavailable");return;}
   if(!/^https:\/\/pay\.payos\.vn\//.test(obj.checkoutUrl)){setError("Payment service URL rejected.");return;}
   window.location.assign(obj.checkoutUrl);
  }catch{setError("Cannot connect to checkout.");}finally{setBusy(false);}
 }
 return <div><button disabled={busy} onClick={()=>void buy()} className="rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{busy?"Connecting...":"Checkout with payOS"}</button>{error&&<p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}</div>;
}
