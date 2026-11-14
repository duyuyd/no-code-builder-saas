import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ClipboardCheck,Clock3,CheckCircle2} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import UpgradeDecision from "@/components/UpgradeDecision";
export const dynamic="force-dynamic";
export const metadata={title:"Xét duyệt yêu cầu nâng cấp",robots:{index:false,follow:false}};
export default async function AdminUpgradeRequests(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")notFound();
 const [requests,members]=await Promise.all([
  db.from("upgrade_requests").select("id,user_id,requested_plan,message,status,decision_note,created_at,decided_at").order("created_at",{ascending:false}).limit(200),
  db.rpc("admin_list_members")
 ]);
 if(requests.error)throw new Error(requests.error.message);
 if(members.error)throw new Error(members.error.message);
 const emails=new Map((members.data??[]).map((m:{id:string;email:string|null})=>[m.id,m.email??m.id]));
 const list=requests.data??[];
 const pending=list.filter(r=>r.status==="pending");
 const history=list.filter(r=>r.status!=="pending");
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100">
  <div className="mx-auto max-w-5xl">
   <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Trung tâm quản trị</Link>
   <div className="my-8 flex items-center gap-3"><ClipboardCheck className="text-orange-400" size={30}/><div><h1 className="text-3xl font-black">Duyệt nâng cấp SaaS</h1><p className="mt-2 text-sm text-slate-400">Xử lý các yêu cầu Pro/Agency. Duyệt là cấp quyền thủ công, không có giao dịch tài chính tự động.</p></div></div>
   <div className="mb-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-amber-700 bg-amber-950/30 p-5"><Clock3 className="mb-2 text-amber-300"/><p className="text-3xl font-black">{pending.length}</p><p className="text-sm text-amber-200">Chờ xử lý</p></div><div className="rounded-xl border border-slate-700 bg-[#1e293b] p-5"><CheckCircle2 className="mb-2 text-emerald-300"/><p className="text-3xl font-black">{history.length}</p><p className="text-sm text-slate-400">Đã xử lý</p></div></div>
   <h2 className="mb-4 text-lg font-bold">Yêu cầu đang chờ</h2>
   <div className="space-y-4">{pending.map(r=><article key={r.id} className="grid gap-5 rounded-2xl border border-orange-700/40 bg-[#1e293b] p-5 md:grid-cols-2">
    <div><p className="break-all text-sm font-semibold text-orange-200">{emails.get(r.user_id)||r.user_id}</p><p className="mt-2 text-lg font-bold uppercase">{r.requested_plan}</p><p className="mt-2 text-xs text-slate-400">Gửi {new Date(r.created_at).toLocaleString("vi-VN")}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{r.message||"Không có lời nhắn."}</p></div>
    <UpgradeDecision id={r.id}/>
   </article>)}{pending.length===0&&<p className="rounded-xl border border-slate-700 bg-[#1e293b] p-6 text-sm text-slate-400">Không có yêu cầu chờ duyệt.</p>}</div>
   <h2 className="mb-4 mt-9 text-lg font-bold">Lịch sử quyết định</h2>
   <div className="space-y-2">{history.map(r=><div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
    <div><p className="break-all text-sm font-semibold">{emails.get(r.user_id)||r.user_id} · {r.requested_plan.toUpperCase()}</p><p className="mt-2 text-xs text-slate-400">{new Date(r.created_at).toLocaleString("vi-VN")}{r.decided_at?" → "+new Date(r.decided_at).toLocaleString("vi-VN"):""}</p>{r.decision_note&&<p className="mt-2 text-xs text-slate-400">{r.decision_note}</p>}</div>
    <span className={"rounded-lg px-2 py-1 text-xs "+(r.status==="approved"?"bg-emerald-950 text-emerald-300":"bg-rose-950 text-rose-300")}>{r.status==="approved"?"Đã cấp quyền":"Từ chối"}</span>
   </div>)}{history.length===0&&<p className="text-sm text-slate-400">Chưa có quyết định.</p>}</div>
  </div>
 </main>;
}
