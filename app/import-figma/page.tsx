import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import FigmaPageImporter from "@/components/studio/FigmaPageImporter";
export const dynamic="force-dynamic";
export const metadata={title:"Import Figma | NuvoraCraft",robots:{index:false,follow:false}};
export default async function ImportFigmaPage({searchParams}:{searchParams:Promise<{project?:string;page?:string}>}){
 const db=await createClient();const {data:{user},error:authError}=await db.auth.getUser();
 if(!user||authError)redirect("/login");
 const {project:projectId,page:pageId}=await searchParams;
 const {data:projects,error:projectsError}=await db.from("projects").select("id,name,kind").eq("owner_id",user.id).is("archived_at",null).neq("kind","game").order("created_at",{ascending:false});
 if(projectsError)throw new Error(projectsError.message);
 const chosen=projectId?(projects??[]).find(p=>p.id===projectId):projects?.[0];
 if(projectId&&!chosen)notFound();
 const {data:pages,error:pagesError}=chosen?await db.from("pages").select("id,path").eq("project_id",chosen.id).order("path"):{data:[],error:null};
 if(pagesError)throw new Error(pagesError.message);
 const page=pageId?pages?.find(p=>p.id===pageId):pages?.[0];
 if(pageId&&!page)notFound();
 return <main className="min-h-dvh bg-[#0b1323] px-4 py-12 text-white"><div className="mx-auto max-w-3xl">
   <Link href="/dashboard" className="text-sm text-orange-300">← Dashboard</Link>
   <h1 className="mt-9 text-4xl font-black">Import từ Figma</h1>
   <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Chọn dự án và dán liên kết tệp hoặc frame Figma. Layer được chuyển thành các component có thể chỉnh sửa trong Builder, không ghi đè nội dung cũ.</p>
   {!chosen||!page?<div className="mt-8 rounded-2xl border border-slate-700 p-6"><p>Chưa có trang web nào để nhập thiết kế.</p><Link href="/builder" className="mt-4 inline-block text-orange-300">Tạo dự án →</Link></div>:<>
    <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5">
     <p className="mb-4 text-sm font-semibold">Đích nhập dữ liệu</p>
     <form method="GET" action="/import-figma" className="flex flex-wrap gap-3">
      <select name="project" defaultValue={chosen.id} aria-label="Chọn dự án" className="min-w-44 flex-1 rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm">{(projects??[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <button className="rounded-xl border border-orange-400 px-4 py-3 text-sm">Đổi dự án</button>
     </form>
     <div className="mt-3 flex flex-wrap gap-2">{(pages??[]).map(p=><Link key={p.id} href={"/import-figma?project="+chosen.id+"&page="+p.id} className={"rounded-lg px-4 py-2 text-sm "+(p.id===page.id?"bg-orange-500":"bg-slate-800")}>{p.path}</Link>)}</div>
    </div>
    <FigmaPageImporter projectId={chosen.id} pageId={page.id}/>
   </>}
   <p className="mt-5 text-xs leading-6 text-slate-500">Figma REST API yêu cầu token được cấu hình ở máy chủ, kể cả khi URL có thể xem công khai. Tài nguyên vector/hiệu ứng không được tái tạo chính xác sẽ cần chỉnh sửa sau khi nhập.</p>
  </div></main>;
}
