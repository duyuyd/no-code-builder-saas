import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import NativeBuildPanel from "@/components/studio/NativeBuildPanel";
export const dynamic="force-dynamic";
export default async function NativeBuildPage({searchParams}:{searchParams:Promise<{project?:string}>}){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();if(error||!user)redirect("/login");
 const projectId=(await searchParams).project;if(!projectId||!/^[0-9a-f-]{36}$/i.test(projectId))notFound();
 const {data:project}=await db.from("projects").select("id,name").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)notFound();
 return <main className="min-h-dvh bg-[#0f172a] p-4 text-white sm:p-8"><div className="mx-auto max-w-3xl space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-2xl font-bold">Native Build Center</h1><p className="text-sm text-slate-400">{project.name}</p></div>
   <Link href={"/builder?project="+projectId} className="text-sm text-orange-300">Về Builder</Link></header>
  <NativeBuildPanel projectId={projectId}/>
 </div></main>;
}
