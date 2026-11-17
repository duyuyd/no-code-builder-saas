import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import NpcLogicPanel from "@/components/studio/NpcLogicPanel";
export default async function AiLogicPage({searchParams}:{searchParams:Promise<{project?:string}>}){
 const db=await createClient();
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect("/login");
 const {project:requested}=await searchParams;
 const {data:projects,error:projectError}=await db.from("projects").select("id,name").eq("owner_id",user.id).is("archived_at",null).order("created_at",{ascending:false});
 if(projectError)throw new Error("Không thể tải dự án.");
 if(requested&&!projects?.some(p=>p.id===requested))notFound();
 const project=requested?projects?.find(p=>p.id===requested):projects?.[0];
 return <main className="min-h-dvh bg-[#0f172a] p-4 text-slate-100 sm:p-8">
  <div className="mx-auto max-w-4xl space-y-6">
   <header className="flex flex-wrap items-center justify-between gap-4">
    <div><h1 className="text-2xl font-bold">AI Logic · NPC Studio</h1><p className="mt-1 text-sm text-slate-400">{project?.name??"Chưa có dự án"}</p></div>
    <Link className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-orange-300" href={project?"/builder?project="+project.id:"/dashboard"}>Về Builder</Link>
   </header>
   {project?<NpcLogicPanel projectId={project.id}/>:<p className="text-sm">Hãy tạo dự án trước trong <Link href="/dashboard" className="text-orange-300">Dashboard</Link>.</p>}
  </div>
 </main>;
}
