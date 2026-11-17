import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {treeToChaiBlocks} from "@/lib/chaibuilder-adapter";
import {RenderChaiBlocks} from "@chaibuilder/core/nextjs/render";
import {loadWebBlocks} from "@chaibuilder/core/web-blocks";
import {validateUiTree} from "@/lib/component-registry";
export const dynamic="force-dynamic";
export const metadata={title:"ChaiBuilder Core Preview | NuvoraCraft",robots:{index:false,follow:false}};
export default async function ChaiPreview({searchParams}:{searchParams:Promise<{project?:string;page?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {project:projectId,page:pageId}=await searchParams;
 const {data:project}=await db.from("projects").select("id,name").eq("id",projectId??"").eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)notFound();
 const {data:page}=await db.from("pages").select("id,path,ui_tree").eq("id",pageId??"").eq("project_id",project.id).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))notFound();
 let blocks;
 try{blocks=treeToChaiBlocks(page.ui_tree);}
 catch(e){return <main className="min-h-dvh bg-slate-950 p-8 text-slate-100">
  <Link href={"/builder?project="+project.id+"&page="+page.id} className="text-orange-300">← Native Builder</Link>
  <h1 className="mt-7 text-2xl font-bold">ChaiBuilder Core compatibility preview</h1>
  <p className="mt-4 max-w-xl text-sm leading-7 text-amber-300">This page includes component types that cannot be converted to Chai without losing functionality. The original page and canvas were not changed.</p>
  <code className="mt-4 block break-words text-xs">{e instanceof Error?e.message:"Unsupported block"}</code>
  </main>;}
 loadWebBlocks();
 const payload={
  id:page.id,name:project.name,slug:page.path,lang:"en",fallbackLang:"en",
  primaryPage:true,seo:{},currentEditor:null,pageType:"page",lastSaved:new Date().toISOString(),
  dynamic:false,dynamicSlugCustom:null,parent:null,blocks,metadata:{},breadcrumb:[],alternatePages:[]
 } as unknown as Parameters<typeof RenderChaiBlocks>[0]["page"];
 return <main className="min-h-dvh bg-slate-50 text-slate-900">
  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-900 p-4 text-white">
   <div><p className="text-xs font-bold tracking-widest text-orange-300">ChaiBuilder Core · read-only preview</p><h1 className="text-lg font-bold">{project.name} · {page.path}</h1></div>
   <Link href={"/builder?project="+project.id+"&page="+page.id} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold">Back to editable Canvas</Link>
  </header>
  <section className="mx-auto min-h-[65dvh] max-w-6xl px-4 py-12">
   <RenderChaiBlocks page={payload} pageData={{}} settings={{}} pageProps={{slug:page.path}}/>
  </section>
  <p className="border-t border-slate-200 p-4 text-center text-xs text-slate-500">Preview rendered with @chaibuilder/core; edits remain in the Supabase-native Builder. Verify layout before publishing.</p>
 </main>;
}
