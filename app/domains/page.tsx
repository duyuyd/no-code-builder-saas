import Link from "next/link";
import {redirect} from "next/navigation";
import {Globe2,ShieldCheck,ArrowLeft,Palette} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import TenantSettingsPanel from "@/components/TenantSettingsPanel";
export const dynamic="force-dynamic";
export default async function DomainsPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const [{data:tenant,error},{data:projects},{data:profile}]=await Promise.all([
   db.from("tenants").select("id,name,logo_url,primary_color,project_id,custom_domain,domain_status,domain_verification").eq("owner_id",user.id).maybeSingle(),
   db.from("projects").select("id,name").eq("owner_id",user.id).order("created_at",{ascending:false}),
   db.from("profiles").select("role,plan").eq("id",user.id).single()
 ]);
 if(error)throw new Error(error.message);
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-8 text-slate-100">
 <div className="mx-auto max-w-4xl">
   <Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300 hover:underline"><ArrowLeft size={16}/>Về Builder</Link>
   <div className="my-7 flex items-center gap-4"><div className="rounded-2xl bg-orange-500 p-4"><Globe2 size={27}/></div><div><h1 className="text-3xl font-bold">Thương hiệu & Tên miền</h1><p className="mt-1 text-sm text-slate-400">Kết nối website đã xuất bản với tên miền của khách hàng.</p></div></div>
   <div className="mb-6 grid gap-3 sm:grid-cols-2">
    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><Palette className="mb-2 text-orange-400"/><h2 className="font-semibold">White-label</h2><p className="mt-1 text-xs leading-5 text-slate-400">Thương hiệu, logo và màu sắc riêng cho mỗi tenant.</p></div>
    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><ShieldCheck className="mb-2 text-emerald-400"/><h2 className="font-semibold">Xác minh qua Vercel</h2><p className="mt-1 text-xs leading-5 text-slate-400">Chỉ sử dụng domain sau khi quyền sở hữu và DNS được xác minh.</p></div>
   </div>
   <TenantSettingsPanel tenant={tenant} projects={projects??[]} canDomain={profile?.role==="admin" || profile?.plan==="pro" || profile?.plan==="agency"}/>
 </div></main>;
}
