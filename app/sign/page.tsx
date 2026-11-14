import Link from "next/link";
import {redirect} from "next/navigation";
import {FileSignature,ArrowLeft,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import SignWorkspace from "@/components/SignWorkspace";
export const dynamic="force-dynamic";
export default async function SignPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const [{data:profile},{data:history,error}]=await Promise.all([
  db.from("profiles").select("role,plan").eq("id",user.id).single(),
  db.from("esign_documents").select("id,original_filename,signer_name,signed_sha256,signed_at,file_size").eq("owner_id",user.id).order("signed_at",{ascending:false}).limit(30)
 ]);
 if(error)throw new Error(error.message);
 const allowed=profile?.role==="admin"||["pro","agency"].includes(profile?.plan??"");
 const upstream=(process.env.HANZO_ESIGN_URL??"").trim();
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-8 text-slate-100">
  <div className="mx-auto max-w-6xl">
   <Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300 hover:underline"><ArrowLeft size={16}/>Về Builder</Link>
   <div className="my-8 flex flex-wrap items-center gap-4"><div className="rounded-2xl bg-orange-500 p-4"><FileSignature size={27}/></div><div><h1 className="text-3xl font-bold">Ký tài liệu PDF</h1><p className="mt-2 text-sm text-slate-400">Tải PDF, vẽ chữ ký, chọn vị trí và lưu bản PDF đã ký trong kho riêng tư.</p></div></div>
   <div className="mb-5 flex items-start gap-2 rounded-xl border border-slate-700 bg-[#1e293b] p-4 text-sm text-slate-300"><ShieldCheck className="shrink-0 text-orange-400" size={18}/><p>Đây là chữ ký điện tử dạng hình ảnh có nhật ký và SHA-256, <strong>không phải chữ ký số dùng chứng thư PKI</strong>. Người dùng cần tự xác minh tài liệu và sự đồng ý trước khi ký.</p></div>
   {allowed?<SignWorkspace documents={history??[]}/>:<div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6"><p>Tính năng ký PDF dành cho Pro/Agency. Gói thương mại chưa bật thanh toán.</p><Link href="/pricing" className="mt-3 inline-block rounded-xl bg-orange-500 px-4 py-2 font-semibold">Xem các gói</Link></div>}
   {upstream.startsWith("https://")&&<a href={upstream} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl border border-slate-600 px-4 py-3 text-sm hover:bg-slate-800">Mở Hanzo eSign tự lưu trữ ↗</a>}
  </div>
 </main>;
}
