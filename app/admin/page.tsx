import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ShieldCheck,Users,FolderKanban,Gamepad2,Settings2,Clock3,LibraryBig} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import AdminDashboard,{type Member,type ManagedProject,type PriceTier,type AuditItem} from "@/components/AdminDashboard";
export const dynamic="force-dynamic";
export const metadata={title:"Quản trị nền tảng",robots:{index:false,follow:false}};
export default async function AdminPage(){
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(!user||authError)redirect("/login");
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")notFound();
 const [members,projects,setting,audit]=await Promise.all([
  db.rpc("admin_list_members"),
  db.from("projects").select("id,name,owner_id,kind,created_at,archived_at").order("created_at",{ascending:false}).limit(1000),
  db.from("platform_settings").select("value").eq("key","saas_pricing").maybeSingle(),
  db.from("admin_audit_logs").select("id,actor_id,target_user_id,action,details,created_at").order("created_at",{ascending:false}).limit(25)
 ]);
 if(members.error)throw new Error("Không tải được tài khoản: "+members.error.message);
 if(projects.error)throw new Error("Không tải được dự án: "+projects.error.message);
 if(setting.error)throw new Error("Không tải được bảng giá: "+setting.error.message);
 if(audit.error)throw new Error("Không tải được nhật ký: "+audit.error.message);
 const plans=Array.isArray(setting.data?.value)?setting.data.value as PriceTier[]:[];
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-7 text-slate-100 sm:px-6">
  <div className="mx-auto max-w-7xl">
   <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-orange-300 hover:underline"><ArrowLeft size={16}/> Trang chủ Studio</Link>
     <div className="flex flex-wrap gap-2"><Link href="/admin/ai" className="rounded-xl border border-orange-500/60 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/20">🤖 Quản lý trợ lý AI</Link><Link href="/settings" className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800">Cấu hình hệ thống</Link></div></div>
   <div className="mb-6 flex items-center gap-4">
    <div className="rounded-2xl bg-orange-500 p-3"><ShieldCheck size={28}/></div>
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trung tâm Quản trị</h1><p className="mt-1 text-sm text-slate-400">Tài khoản thật · Dự án · Gói nâng cấp · Nhật ký</p></div>
   </div>
   <section aria-label="Tổng quan quản trị" className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[[Users,"Thành viên đã đăng ký",members.data?.length??0],[FolderKanban,"Tổng dự án",projects.data?.length??0],[Gamepad2,"Dự án game",(projects.data??[]).filter(p=>p.kind==="game").length],[Clock3,"Dự án đang lưu trữ",(projects.data??[]).filter(p=>p.archived_at!==null).length]].map(([Icon,label,value],i)=>{const I=Icon as typeof Users;return <div key={String(i)} className="rounded-2xl border border-slate-700 bg-[#1e293b] p-4 sm:p-5"><I size={23} className="mb-3 text-orange-300"/><p className="text-xs text-slate-400">{String(label)}</p><p className="mt-2 text-2xl font-black">{String(value)}</p></div>})}
   </section>
   <div className="mb-7 flex flex-wrap gap-2"><Link href="/settings" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-xs font-bold text-slate-200"><Settings2 size={16}/> Cấu hình giao diện</Link><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-xs font-bold text-slate-200"><FolderKanban size={16}/> Dashboard người dùng</Link><Link href="/resources" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-xs font-bold text-slate-200"><LibraryBig size={16}/> Kho tài nguyên</Link></div>
   <nav aria-label="Điều hướng quản trị" className="mb-8 flex flex-wrap gap-2">{[
    ["#members","Thành viên"],["#projects","Dự án / Xóa"],["#plans","Quản lý gói"],["#billing","Thanh toán"]
   ].map(([href,label])=><a key={href} href={href} className="rounded-xl border border-slate-600 bg-[#1e293b] px-4 py-2.5 text-xs font-semibold hover:border-orange-500">{label}</a>)}</nav>
   <div className="mb-6 flex flex-wrap gap-3">
   <Link href="/admin/requests" className="inline-flex rounded-xl border border-orange-500 bg-orange-500/10 px-5 py-3 text-sm font-bold text-orange-200 transition hover:bg-orange-500/20">📬 Yêu cầu nâng cấp Pro / Agency</Link>
   <Link href="/admin/billing" className="inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white">🏦 Cấu hình ngân hàng · Đối soát đơn</Link>
   </div>
   <AdminDashboard members={(members.data??[]) as Member[]} projects={(projects.data??[]) as ManagedProject[]} plans={plans} audit={(audit.data??[]) as AuditItem[]}/>
   <p className="mt-10 flex items-center gap-2 text-xs text-slate-500"><Users size={14}/> Thông tin đăng ký chỉ hiển thị cho Admin. Không chứa mật khẩu hay khóa xác thực.</p>
  </div>
 </main>;
}
