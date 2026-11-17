import Link from "next/link";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
import {MarketBuy,PublishListing,DeliverOrder} from "@/components/marketplace/MarketControls";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Marketplace · Templates and Components",description:"Discover and publish no-code website, app and game templates with verified creator listings and buyer reviews.",robots:{index:true,follow:true}};
export default async function Marketplace({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
 const {q="",category=""}=await searchParams,query=q.trim().slice(0,80);
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 let catalog=db.from("marketplace_items").select("id,title,summary,item_type,price_vnd,creator_id,created_at")
 .eq("status","published").order("created_at",{ascending:false}).limit(40);
 if(query)catalog=catalog.ilike("title","%"+query.replace(/[%_]/g,"")+"%");
 if(["website","app","game","component"].includes(category))catalog=catalog.eq("item_type",category);
 const {data:items}=await catalog;
 const [{data:projects},{data:orders},{data:reviews}]=await Promise.all([
  user?db.from("projects").select("id,name").eq("owner_id",user.id).is("archived_at",null).limit(30):Promise.resolve({data:[]}),
  user?db.from("marketplace_orders").select("id,status,item_id").eq("buyer_id",user.id).eq("status","paid").limit(20):Promise.resolve({data:[]}),
  db.from("marketplace_reviews").select("item_id,rating").in("item_id",(items??[]).map(i=>i.id).length?(items??[]).map(i=>i.id):["00000000-0000-0000-0000-000000000000"])
 ]);
 const rating=new Map<string,{sum:number;count:number}>();
 for(const review of reviews??[]){const prev=rating.get(review.item_id)??{sum:0,count:0};rating.set(review.item_id,{sum:prev.sum+review.rating,count:prev.count+1});}
 return <main className="min-h-dvh bg-[#0b1425] p-5 text-slate-100"><div className="mx-auto max-w-6xl space-y-9"><header><Link href="/" className="text-sm text-orange-300">← Home</Link><p className="mt-9 text-xs font-black uppercase tracking-[.2em] text-orange-400">CREATOR ECONOMY</p><h1 className="mt-2 text-4xl font-black">Marketplace</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Find real templates published by creators, copy free designs into your private workspace and review delivered purchases.</p></header>
 <form className="flex flex-wrap gap-3"><input name="q" defaultValue={query} maxLength={80} placeholder="Search templates..." className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm"/><select name="category" defaultValue={category} className="rounded-xl bg-slate-900 px-3"><option value="">All types</option>{["website","app","game","component"].map(x=><option key={x} value={x}>{x}</option>)}</select><button className="rounded-xl bg-orange-500 px-5 text-sm font-semibold">Search</button></form>
 <div className="grid gap-4 md:grid-cols-3">{(items??[]).map(item=>{const rate=rating.get(item.id);return <article key={item.id} className="flex flex-col rounded-2xl border border-slate-700 bg-slate-900 p-6"><p className="text-xs uppercase tracking-widest text-orange-300">{item.item_type}</p><h2 className="mt-3 text-xl font-bold">{item.title}</h2><p className="mt-3 min-h-20 flex-1 text-sm leading-7 text-slate-400">{item.summary}</p><p className="mt-3 text-sm">★ {rate?((rate.sum/rate.count).toFixed(1)+" · "+rate.count+" verified reviews"):"No reviews yet"}</p><p className="mt-3 text-lg font-bold">{Number(item.price_vnd)===0?"Free":Number(item.price_vnd).toLocaleString("vi-VN")+" ₫"}</p><MarketBuy itemId={item.id} price={Number(item.price_vnd)}/></article>})}</div>
 {!items?.length&&<p className="rounded-xl border border-slate-700 p-8 text-center text-sm text-slate-400">No matching listings yet. Publish a template below.</p>}
 {user&&orders&&orders.length>0&&<section><h2 className="mb-3 text-xl font-bold">Paid purchases ready for delivery</h2><div className="flex flex-wrap gap-3">{orders.map(o=><DeliverOrder key={o.id} id={o.id}/>)}</div></section>}
 {user?<PublishListing projects={projects??[]}/>:<p className="text-sm text-slate-400"><Link href="/login" className="text-orange-300">Sign in</Link> to publish or download templates.</p>}
 <p className="text-xs leading-6 text-slate-500">Paid orders use payOS only if a merchant is configured. Accounting ledger entries are not a bank escrow account; creator payouts require a separate verified settlement provider.</p>
 </div></main>;
}
