import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,FolderKanban} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import ProjectLifecycleControls from "@/components/ProjectLifecycleControls";
export const dynamic="force-dynamic";
export const metadata={title:"Quản lý dự án",robots:{index:false,follow:false}};
export default async function ProjectManagementPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {data:projects,error}=await db.from("projects").select("id,name,kind,created_at,archived_at")
  .eq("owner_id",user.id).order("created_at",{ascending:false}).limit(500);
 if(error)throw new Error(error.message);
 const rows=projects??[];
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-8 text-slate-100">
  <div className="mx-auto max-w-4xl">
   <Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Builder</Link>
   <h1 className="mt-8 flex items-center gap-3 text-2xl font-bold"><FolderKanban className="text-orange-400" size={28}/> Quản lý dự án của tôi</h1>
   <p className="mt-2 text-sm text-slate-400">Dự án chuyển vào Thùng rác không còn được công khai. Có thể khôi phục trước khi xóa vĩnh viễn.</p>
   <div className="mt-6 space-y-3">{rows.map(p=><article key={p.id} className="grid gap-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
    <div><strong className="break-all">{p.name}</strong><p className="mt-1 text-xs text-slate-400">{p.kind} · {new Date(p.created_at).toLocaleString("vi-VN")}</p><p className={"mt-1 text-xs "+(p.archived_at?"text-amber-300":"text-emerald-300")}>{p.archived_at?"Trong Thùng rác":"Đang dùng"}</p>
     {!p.archived_at&&<Link href={"/builder?project="+p.id} className="mt-2 inline-block text-xs text-orange-300 underline">Mở trình thiết kế</Link>}</div>
    <ProjectLifecycleControls project={p}/>
   </article>)}{rows.length===0&&<p className="rounded-xl border border-slate-700 p-6 text-slate-400">Chưa có dự án.</p>}</div>
  </div>
 </main>;
}
