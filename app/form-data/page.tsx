import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export const metadata={title:"Auto Database | NuvoraCraft",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{project?:string;form?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {project:projectId,form:formId}=await searchParams;
 const {data:projects,error:projectError}=await db.from("projects").select("id,name").eq("owner_id",user.id).is("archived_at",null).order("created_at",{ascending:false});
 if(projectError)throw Error(projectError.message);
 const project=projectId?projects?.find(p=>p.id===projectId):projects?.[0];if(projectId&&!project)notFound();
 const {data:forms,error:formsError}=project?await db.from("nuvora_forms").select("id,page_id,node_id,fields,created_at").eq("project_id",project.id).order("created_at",{ascending:false}):{data:[],error:null};
 if(formsError)throw Error(formsError.message);
 const form=formId?forms?.find(x=>x.id===formId):forms?.[0];if(formId&&!form)notFound();
 const {data:rows,error:rowsError}=form?await db.rpc("list_nuvora_form_submissions",{p_form_id:form.id,p_limit:50}):{data:[],error:null};
 const data=(rows??[]).filter((item:unknown):item is Record<string,unknown>=>Boolean(item&&typeof item==="object"&&!Array.isArray(item)));
 const keys=Array.isArray(form?.fields)?(form?.fields as Array<{name:string}>).map(f=>f.name).filter(x=>/^[a-z][a-z0-9_]{0,39}$/.test(x)): [];
 return <main className="min-h-dvh bg-[#080f20] px-4 py-12 text-white"><div className="mx-auto max-w-6xl">
  <Link href="/dashboard" className="text-sm text-orange-300">← Dashboard</Link><h1 className="mt-9 text-3xl font-black">Auto-Database · Form submissions</h1>
  <p className="mt-3 text-sm text-slate-400">Các bảng PostgreSQL được tạo riêng cho từng biểu mẫu; chỉ chủ sở hữu dự án được đọc kết quả.</p>
  {project?<><form method="GET" action="/form-data" className="mt-7"><select name="project" defaultValue={project.id} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm" aria-label="Project">{(projects??[]).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><button className="ml-2 rounded-lg border border-orange-500 px-3 py-3 text-sm">Mở</button></form>
   <nav className="my-5 flex flex-wrap gap-2" aria-label="Form tables">{(forms??[]).map((f,i)=><Link key={f.id} href={"/form-data?project="+project.id+"&form="+f.id} className={"rounded-lg px-4 py-2 text-sm "+(f.id===form?.id?"bg-orange-500":"bg-slate-800")}>Form {i+1} · {f.node_id.slice(0,8)}</Link>)}</nav>
   {form?<><p className="mb-3 text-sm text-slate-400">{data.length} submission(s), tối đa 50 bản gần nhất · {keys.length} field(s)</p>{rowsError?<p role="alert" className="text-rose-300">{rowsError.message}</p>:<div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full min-w-[650px] border-collapse text-left text-sm"><thead className="bg-slate-800 text-orange-300"><tr><th className="p-3">Thời gian</th>{keys.map(key=><th key={key} className="p-3">{key}</th>)}</tr></thead><tbody>{data.map((row:Record<string,unknown>,i:number)=><tr key={String(row.id??i)} className="border-t border-slate-700"><td className="p-3 text-slate-400">{String(row.created_at??"")}</td>{keys.map(key=><td key={key} className="max-w-64 break-words p-3">{String(row[key]??"")}</td>)}</tr>)}</tbody></table></div>}</>:<p className="rounded-xl border border-slate-700 p-5 text-slate-400">Chưa có Form nào được lưu ở dự án này. Thêm một Form và Input trong Builder, sau đó lưu lại.</p>}
  </>:<p className="mt-8 text-slate-400">Chưa có dự án.</p>}
 </div></main>;
}
