import Link from "next/link";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import type {CSSProperties} from "react";
import {createClient} from "@/lib/supabase/server";
import {validateUiTree} from "@/lib/component-registry";
import LivePage from "@/components/LivePage";
export const dynamic="force-dynamic";
type Params={slug?:string[]};
async function lookup(path:string){
 const h=await headers();
 const hostname=(h.get("x-forwarded-host")||h.get("host")||"").split(":")[0].toLowerCase();
 if(!/^[a-z0-9.-]{4,253}$/.test(hostname))return null;
 const db=await createClient();
 const {data:tenant,error}=await db.from("tenants").select("name,logo_url,primary_color,project_id").eq("custom_domain",hostname).eq("domain_status","verified").maybeSingle();
 if(error||!tenant?.project_id)return null;
 const {data:page}=await db.from("published_pages").select("ui_tree,site_title").eq("project_id",tenant.project_id).eq("path",path).eq("is_live",true).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))return null;
 return {tenant,page};
}
function requested(slug?:string[]){
 if((slug??[]).some(s=>!/^[a-z0-9_-]+$/i.test(s)))return null;
 return "/"+(slug??[]).join("/");
}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
 const path=requested((await params).slug);
 const item=path?await lookup(path):null;
 return {title:item?.tenant.name??"Trang không tồn tại",robots:item?"index,follow":"noindex,nofollow"};
}
export default async function TenantSite({params}:{params:Promise<Params>}){
 const path=requested((await params).slug);
 const item=path?await lookup(path):null;
 if(!item)notFound();
 const {tenant,page}=item;
 const branding={"--brand-primary":tenant.primary_color} as CSSProperties;
 return <div style={branding} className="min-h-dvh bg-white text-slate-900">
  <header className="border-b border-slate-200 bg-white px-4 py-3"><div className="mx-auto flex max-w-6xl items-center gap-3">
   {tenant.logo_url?<img src={tenant.logo_url} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain"/>:null}
   <Link href="/" className="font-bold">{tenant.name}</Link>{path!=="/"&&<Link href="/" className="ml-auto text-sm text-orange-600">Trang chủ</Link>}
  </div></header>
  <LivePage nodes={page.ui_tree}/>
 </div>;
}
