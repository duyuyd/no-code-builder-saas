import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,Clock3,ShieldCheck,CheckCircle2,AlertCircle} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import UpgradeRequestForm from "@/components/UpgradeRequestForm";
export const dynamic="force-dynamic";
export const metadata={title:"Yêu cầu nâng cấp gói",robots:{index:false,follow:false}};
export default async function UpgradePage({searchParams}:{searchParams:Promise<{plan?:string}>}){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const [{data:profile},{data:requests,error:reqError},{data:setting}]=await Promise.all([
  db.from("profiles").select("role,plan").eq("id",user.id).maybeSingle(),
  db.from("upgrade_requests").select("id,requested_plan,message,status,decision_note,created_at,decided_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(15),
  db.from("platform_settings").select("value").eq("key","saas_pricing").maybeSingle()
 ]);
 if(reqError)throw new Error(reqError.message);
 const parsed=Array.isArray(setting?.value)?setting.value.filter(p=>p&&typeof p.code==="string"&&typeof p.name==="string").map(p=>({code:String(p.code),name:String(p.name)})):[];
 const plan=(await searchParams).plan;
 const selected=plan==="agency"?"agency":"pro";
 const pending=requests?.find(r=>r.status==="pending");
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100">
 <div className="mx-auto max-w-3xl">
  <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Trở về bảng giá</Link>
  <div className="my-9"><p className="text-xs font-semibold uppercase tracking-[.2em] text-orange-400">Tài khoản SaaS</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Yêu cầu nâng cấp</h1><p className="mt-3 text-sm text-slate-400">Admin xét duyệt trực tiếp trên hệ thống; mọi yêu cầu được lưu vào Supabase với quyền truy cập riêng.</p></div>
  <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
   <ShieldCheck className="text-orange-400"/><span className="text-sm">Gói hiện tại của bạn:</span><strong className="rounded-full bg-slate-900 px-3 py-1 font-semibold uppercase text-orange-200">{profile?.plan??"free"}</strong>
   {profile?.role==="admin"&&<span className="text-xs text-emerald-300">Tài khoản Admin có quyền dùng thử tính năng nâng cao.</span>}
  </div>
  {pending?
   <div role="status" className="rounded-2xl border border-amber-600 bg-amber-950/20 p-6"><Clock3 className="mb-3 text-amber-400"/><h2 className="text-lg font-bold">Yêu cầu đang chờ duyệt</h2><p className="mt-2 text-sm">Gói {pending.requested_plan.toUpperCase()} · Gửi lúc {new Date(pending.created_at).toLocaleString("vi-VN")}</p><p className="mt-3 text-sm text-slate-300">Để tránh gửi trùng, bạn chỉ có thể tạo yêu cầu tiếp theo sau khi Admin xử lý yêu cầu hiện tại.</p></div>
   :profile?.role==="admin"||profile?.plan==="agency"?
   <div className="rounded-2xl border border-emerald-700 bg-emerald-950/20 p-6"><CheckCircle2 className="mb-2 text-emerald-400"/><p>Bạn đã có quyền truy cập các tính năng nâng cao.</p></div>:
   <UpgradeRequestForm selected={selected} plans={parsed.length?parsed:[{code:"pro",name:"Pro"},{code:"agency",name:"Agency"}]}/>
  }
  <section className="mt-8 rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><h2 className="mb-4 text-lg font-bold">Lịch sử yêu cầu</h2>
   <div className="space-y-3">{(requests??[]).map(r=><article key={r.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>{r.requested_plan.toUpperCase()}</strong><span className={"rounded-lg px-3 py-1 text-xs "+(r.status==="approved"?"bg-emerald-950 text-emerald-300":r.status==="rejected"?"bg-rose-950 text-rose-300":"bg-amber-950 text-amber-300")}>{r.status==="approved"?"Đã cấp quyền":r.status==="rejected"?"Bị từ chối":"Đang chờ"}</span></div>
    <p className="mt-2 text-xs text-slate-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
    {r.message&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{r.message}</p>}
    {r.decision_note&&<p className="mt-2 text-xs text-slate-400"><AlertCircle size={13} className="mr-1 inline"/>{r.decision_note}</p>}
   </article>)}{!requests?.length&&<p className="text-sm text-slate-400">Chưa có yêu cầu.</p>}</div>
  </section>
 </div></main>;
}
