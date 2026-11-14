import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ShieldCheck,Users} from "lucide-react";
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
   <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300 hover:underline"><ArrowLeft size={16}/> Quay lại Builder</Link>
     <Link href="/settings" className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800">Cấu hình hệ thống</Link></div>
   <div className="mb-6 flex items-center gap-4">
    <div className="rounded-2xl bg-orange-500 p-3"><ShieldCheck size={28}/></div>
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trung tâm Quản trị</h1><p className="mt-1 text-sm text-slate-400">Tài khoản thật · Dự án · Gói nâng cấp · Nhật ký</p></div>
   </div>
   <nav aria-label="Điều hướng quản trị" className="mb-8 flex flex-wrap gap-2">{[
    ["#members","Thành viên"],["#projects","Dự án / Xóa"],["#plans","Quản lý gói"],["#billing","Thanh toán"]
   ].map(([href,label])=><a key={href} href={href} className="rounded-xl border border-slate-600 bg-[#1e293b] px-4 py-2.5 text-xs font-semibold hover:border-orange-500">{label}</a>)}</nav>
   <Link href="/admin/requests" className="mb-6 inline-flex rounded-xl border border-orange-500 bg-orange-500/10 px-5 py-3 text-sm font-bold text-orange-200 transition hover:bg-orange-500/20">📬 Xem và duyệt yêu cầu nâng cấp Pro / Agency</Link>
   <AdminDashboard members={(members.data??[]) as Member[]} projects={(projects.data??[]) as ManagedProject[]} plans={plans} audit={(audit.data??[]) as AuditItem[]}/>
   <p className="mt-10 flex items-center gap-2 text-xs text-slate-500"><Users size={14}/> Thông tin đăng ký chỉ hiển thị cho Admin. Không chứa mật khẩu hay khóa xác thực.</p>
  </div>
 </main>;
}
