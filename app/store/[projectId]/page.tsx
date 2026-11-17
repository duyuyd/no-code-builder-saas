import Link from "next/link";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
import StorePurchaseButton from "@/components/commerce/StorePurchaseButton";
export const dynamic="force-dynamic";
const uuid=/^[a-f0-9-]{36}$/i;
async function catalogue(projectId:string){
 if(!uuid.test(projectId))return null;
 const db=await createClient();
 const {data:site}=await db.from("published_pages").select("project_id,site_title").eq("project_id",projectId).eq("is_live",true).limit(1).maybeSingle();
 if(!site)return null;
 const {data:products}=await db.from("products").select("id,name,description,price_vnd,image_url").eq("project_id",projectId).eq("active",true).order("created_at",{ascending:false}).limit(50);
 return {...site,products:products??[]};
}
export async function generateMetadata({params}:{params:Promise<{projectId:string}>}):Promise<Metadata>{
 const store=await catalogue((await params).projectId);
 return {title:store?.site_title?store.site_title+" · Store":"Store unavailable",description:"Secure catalogue and checkout",robots:{index:!!store,follow:!!store}};
}
export default async function Store({params}:{params:Promise<{projectId:string}>}){
 const p=await params;const store=await catalogue(p.projectId);if(!store)notFound();
 return <main className="min-h-dvh bg-slate-50 p-5 text-slate-900"><div className="mx-auto max-w-5xl"><Link href={"/s/"+p.projectId} className="text-xs text-orange-600">← Back to site</Link><h1 className="my-7 text-3xl font-black">{store.site_title} · Store</h1><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{store.products.map(product=><article key={product.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
  {product.image_url?.startsWith("https://")?<img src={product.image_url} alt={product.name} className="h-44 w-full object-cover" loading="lazy"/>:null}
  <div className="space-y-3 p-5"><h2 className="font-bold">{product.name}</h2><p className="text-sm text-slate-600">{product.description}</p><p className="text-lg font-black text-orange-600">{Number(product.price_vnd).toLocaleString("vi-VN")} ₫</p><StorePurchaseButton productId={product.id}/></div></article>)}</div>{!store.products.length&&<p>No active products yet.</p>}</div></main>;
}
