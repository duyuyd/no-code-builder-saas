import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ThreeStudio from "@/components/studio/ThreeStudio";
export const dynamic="force-dynamic";
export const metadata={title:"3D Timeline | NuvoraCraft",robots:{index:false,follow:false}};
export default async function Studio3d({searchParams}:{searchParams:Promise<{project?:string;page?:string;timeline?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {project:projectId,page:pageId,timeline}=await searchParams;
 const {data:project}=await db.from("projects").select("id,name").eq("id",projectId??"").eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)notFound();
 const {data:page}=await db.from("pages").select("id").eq("id",pageId??"").eq("project_id",project.id).maybeSingle();if(!page)notFound();
 return <main className="flex min-h-dvh flex-col bg-slate-950 text-white"><header className="flex items-center justify-between border-b border-slate-700 p-4"><Link href={"/builder?project="+project.id+"&page="+page.id} className="text-orange-300">← ChaiBuilder</Link><div className="flex gap-3 text-xs"><Link href={"?project="+project.id+"&page="+page.id} className="text-white">3D</Link><Link href={"?project="+project.id+"&page="+page.id+"&timeline=1"} className="text-white">Timeline</Link></div></header><ThreeStudio projectId={project.id} pageId={page.id} showTimeline={timeline==="1"}/></main>;
}
