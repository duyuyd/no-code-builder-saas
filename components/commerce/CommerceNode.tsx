"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ShoppingBag,ShoppingCart,CheckCircle2} from "lucide-react";
import {createClient} from "@/lib/supabase/browser";
import {safeUrl,type BuilderNode} from "@/lib/component-registry";
type Product={id:string;name:string;description:string;price_vnd:number;image_url:string};
function format(price:number){return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(price);}
function CartCheckout({projectId}:{projectId?:string}){
 const [count,setCount]=useState(0);
 useEffect(()=>{const db=createClient();void db.auth.getSession().then(()=>{try{setCount(Number(sessionStorage.getItem("studio-cart:"+projectId)??"0"));}catch{}});},[projectId]);
 return <div className="rounded-xl border border-slate-200 bg-white p-5"><ShoppingCart className="mb-2 text-orange-500"/><p className="font-semibold">Cart & checkout</p><p className="mt-2 text-sm text-slate-500">Items added on this device: {count}</p>{projectId?<Link className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white" href={"/store/"+projectId}>Open secure storefront</Link>:<p className="mt-3 text-xs">Publish the project to enable checkout.</p>}</div>;
}
export default function CommerceNode({node,projectId}:{node:BuilderNode;projectId?:string}){
 const [products,setProducts]=useState<Product[]>([]);
 useEffect(()=>{
  if(node.type!=="product-grid"||!projectId)return;
  let alive=true;const db=createClient();
  void db.from("products").select("id,name,description,price_vnd,image_url").eq("project_id",projectId).eq("active",true).limit(24)
   .then(({data})=>{if(alive)setProducts(data??[]);});
  return()=>{alive=false;};
 },[node.type,projectId]);
 if(node.type==="cart"||node.type==="checkout-form")return <CartCheckout projectId={projectId}/>;
 const placeholder={id:node.id,name:node.props.productName??"",description:node.props.description??"",
  price_vnd:Number(node.props.priceVnd)||1000,image_url:node.props.imageUrl??""};
 const entries=node.type==="product-grid"?products:[placeholder];
 if(!entries.length)return <div className="rounded-xl border-2 border-dashed border-orange-300 p-6 text-sm text-slate-500">Your product grid is empty. Add items in Builder → Commerce.</div>;
 return <div className={node.type==="product-grid"?"grid gap-4 sm:grid-cols-2 lg:grid-cols-3":"max-w-sm"}>
  {entries.map(p=><article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   {safeUrl(p.image_url)&&p.image_url.startsWith("https://")?<img src={p.image_url} alt={p.name} loading="lazy" className="h-40 w-full object-cover"/>:<div className="flex h-40 items-center justify-center bg-orange-50 text-orange-400"><ShoppingBag size={32}/></div>}
   <div className="space-y-3 p-4"><h3 className="font-bold">{p.name||"Name your product"}</h3><p className="line-clamp-3 text-xs text-slate-500">{p.description}</p><p className="font-bold text-orange-700">{format(p.price_vnd)}</p>
   {projectId?<Link href={"/store/"+projectId} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white"><ShoppingCart size={14}/> View & buy</Link>:<span className="inline-flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={14}/> Save & publish to sell</span>}
   </div>
  </article>)}
 </div>;
}
