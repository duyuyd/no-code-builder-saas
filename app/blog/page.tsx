import Link from "next/link";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"No-Code Tutorials & Guides",description:"Practical guides to creating websites, mobile apps and 3D games with a visual builder.",robots:{index:true,follow:true}};
export default async function Blog({searchParams}:{searchParams:Promise<{q?:string}>}){
 const query=(await searchParams).q?.trim().slice(0,80)??"",db=await createClient();
 let request=db.from("blog_posts").select("id,slug,title,excerpt,published_at").eq("published",true).order("published_at",{ascending:false}).limit(50);
 if(query)request=request.ilike("title","%"+query.replace(/[%_]/g,"")+"%");
 const {data:posts}=await request;
 return <main className="min-h-dvh bg-[#0a1426] p-5 text-white"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm text-orange-300">← Home</Link><p className="mt-10 text-xs font-black uppercase tracking-[.2em] text-orange-400">CREATOR KNOWLEDGE</p><h1 className="mt-3 text-4xl font-black">No-code knowledge hub</h1><form className="my-7 flex gap-2"><input name="q" maxLength={80} defaultValue={query} placeholder="Search tutorials..." className="min-w-0 flex-1 rounded-xl bg-slate-800 p-3 text-sm"/><button className="rounded-xl bg-orange-500 px-5 text-sm font-bold">Search</button></form><div className="grid gap-5 sm:grid-cols-2">{(posts??[]).map(p=><article key={p.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><p className="text-xs text-orange-300">{p.published_at?new Date(p.published_at).toLocaleDateString("en-US"):"Guide"}</p><h2 className="mt-3 text-xl font-bold"><Link href={"/blog/"+p.slug}>{p.title}</Link></h2><p className="mt-4 text-sm leading-7 text-slate-400">{p.excerpt}</p><Link href={"/blog/"+p.slug} className="mt-4 inline-block text-sm font-semibold text-orange-300">Read guide →</Link></article>)}</div>{!posts?.length&&<p className="text-slate-400">No published articles match this search.</p>}</div></main>;
}
