import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ChaiImportPanel from "@/components/chaibuilder/ChaiImportPanel";
export const metadata={title:"Chai Builder Import | NuvoraCraft",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{project?:string;page?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {project:projectId,page:pageId}=await searchParams;
 const {data:project}=await db.from("projects").select("id,name").eq("id",projectId??"").eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)notFound();
 const {data:pages}=await db.from("pages").select("id,path").eq("project_id",project.id).order("path");
 const page=pageId?pages?.find(p=>p.id===pageId):pages?.[0];
 if(!page)notFound();
 return <main className="min-h-dvh bg-[#080f20] px-4 py-12 text-white"><div className="mx-auto max-w-3xl">
  <Link className="text-sm text-orange-300" href={"/builder?project="+project.id+"&page="+page.id}>← Builder</Link>
  <h1 className="mt-12 text-3xl font-black">Chai Builder ↔ NuvoraCraft</h1>
  <p className="my-5 text-sm text-slate-400">Project: {project.name} · Page: {page.path}</p>
  <ChaiImportPanel projectId={project.id} pageId={page.id}/>
  <p className="mt-6 text-xs leading-6 text-slate-400">The older chaibuilder/sdk is archived. ChaiBuilder Core stores its pages in a different schema; a full editor swap is held behind compatibility validation to protect existing Supabase JSONB projects.</p>
 </div></main>;
}
