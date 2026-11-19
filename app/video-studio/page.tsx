import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {validateUiTree} from "@/lib/component-registry";
import NuvoraVideoStudio from "@/components/video/NuvoraVideoStudio";
export const dynamic="force-dynamic";
export const metadata={title:"Nuvora Video Studio",robots:{index:false,follow:false}};
export default async function VideoStudioPage({searchParams}:{searchParams:Promise<{project?:string;page?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {project:projectId,page:pageId}=await searchParams;
 const {data:projects,error:err}=await db.from("projects").select("id,name").eq("owner_id",user.id).is("archived_at",null).order("created_at",{ascending:false});
 if(err)throw Error(err.message);
 const project=projectId?(projects??[]).find(p=>p.id===projectId):projects?.[0];
 if(projectId&&!project)notFound();
 const {data:pages}=project?await db.from("pages").select("id,path,ui_tree").eq("project_id",project.id).order("path"):{data:[]};
 const page=pageId?pages?.find(p=>p.id===pageId):pages?.[0];if(pageId&&!page)notFound();
 return <main className="min-h-dvh bg-[#080f20] px-4 py-9 text-slate-100">
  <div className="mx-auto max-w-6xl"><div className="flex items-center justify-between gap-4"><Link href="/dashboard" className="text-sm font-semibold text-orange-300">← Dashboard</Link><Link href="/ai-builder" className="text-xs text-slate-400">AI App Builder</Link></div>
   <p className="mt-12 text-xs font-bold uppercase tracking-[.24em] text-orange-300">Remotion · NuvoraCraft</p><h1 className="mt-3 text-4xl font-black">Nuvora Video Studio</h1>
   <p className="mb-8 mt-4 text-sm text-slate-400">Chọn dự án để tạo bản giới thiệu MP4 từ giao diện thật đã lưu trong Supabase.</p>
   {!project||!page||!validateUiTree(page.ui_tree)?<p className="rounded-2xl border border-slate-700 bg-slate-900 p-8">Không có trang hợp lệ. <Link href="/builder" className="text-orange-300">Đến Builder</Link></p>:<>
    <div className="mb-6 flex flex-wrap items-center gap-2">
     <form method="GET" action="/video-studio"><select name="project" defaultValue={project.id} aria-label="Dự án" className="rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm">{(projects??[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="ml-2 rounded-xl border border-orange-500 px-3 py-3 text-sm text-orange-300">Đổi dự án</button></form>
     {(pages??[]).map(p=><Link key={p.id} href={"/video-studio?project="+project.id+"&page="+p.id} className={"rounded-lg px-3 py-2 text-xs "+(p.id===page.id?"bg-orange-500":"bg-slate-800")}>{p.path}</Link>)}
    </div>
    <NuvoraVideoStudio key={page.id} projectId={project.id} pageId={page.id} projectName={project.name} pagePath={page.path} nodes={page.ui_tree}/>
   </>}
  </div>
 </main>;
}
