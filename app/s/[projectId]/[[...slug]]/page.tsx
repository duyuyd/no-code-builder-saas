import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { validateUiTree } from "@/lib/component-registry";
import LivePage from "@/components/LivePage";

export const dynamic="force-dynamic";
type Params={projectId:string;slug?:string[]};
async function readSite(p:Params){
 if(!/^[a-f0-9-]{36}$/i.test(p.projectId)||(p.slug??[]).some(s=>!/^[a-z0-9_-]+$/.test(s)))return null;
 const path="/"+(p.slug??[]).join("/");
 const db=await createClient();
 const {data,error}=await db.from("published_pages").select("path,ui_tree,site_title").eq("project_id",p.projectId).eq("path",path).eq("is_live",true).maybeSingle();
 if(error||!data||!validateUiTree(data.ui_tree))return null;
 return data;
}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
 const s=await readSite(await params);
 return {title:s?.site_title??"Trang không tồn tại",robots:s?"index,follow":"noindex,nofollow"};
}
export default async function Published({params}:{params:Promise<Params>}){
 const p=await params;const site=await readSite(p);if(!site)notFound();
 return <div className="min-h-dvh bg-white text-slate-900">
   <header className="border-b border-slate-200 bg-white px-4 py-3"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Link href={"/s/"+p.projectId} className="truncate font-bold text-slate-900">{site.site_title}</Link>{p.slug?.length?<Link href={"/s/"+p.projectId} className="text-xs text-orange-600">← Trang chủ</Link>:null}</div></header>
   <LivePage key={site.path} nodes={site.ui_tree} projectId={p.projectId}/>
 </div>;
}
