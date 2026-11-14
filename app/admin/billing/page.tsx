import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {ArrowLeft,Landmark,ReceiptText} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {BankSettings,ReviewOrder} from "@/components/AdminBillingPanel";
export const dynamic="force-dynamic";
export const metadata={title:"Quản trị thanh toán",robots:{index:false,follow:false}};
export default async function AdminBilling(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).single();
 if(profile?.role!=="admin")notFound();
 const [{data:settings,error:configError},{data:pricing,error:pricingError},orders,members]=await Promise.all([
  db.from("platform_settings").select("value").eq("key","saas_billing").maybeSingle(),
  db.from("platform_settings").select("value").eq("key","saas_pricing").maybeSingle(),
  db.from("billing_orders").select("id,user_id,plan_code,amount_vnd,bank_code,account_number,account_name,transfer_code,status,created_at,submitted_at,decision_note").order("created_at",{ascending:false}).limit(200),
  db.rpc("admin_list_members")
 ]);
 if(configError||pricingError||orders.error||members.error)throw new Error(configError?.message??pricingError?.message??orders.error?.message??members.error?.message??"Không tải được dữ liệu.");
 const tiers=Array.isArray(pricing?.value)?pricing.value:[];
 const amount=(code:string)=>{const v=tiers.find(p=>p.code===code)?.priceVnd;return typeof v==="number"&&Number.isSafeInteger(v)?v:0;};
 const emails=new Map((members.data??[]).map((m:{id:string;email:string|null})=>[m.id,m.email??m.id]));
 const rows=orders.data??[];
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100">
  <div className="mx-auto max-w-5xl">
   <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Trung tâm quản trị</Link>
   <div className="my-8 flex items-center gap-3"><Landmark size={32} className="text-orange-400"/><div><h1 className="text-3xl font-black">Đơn hàng và Ngân hàng</h1><p className="mt-2 text-sm text-slate-400">Cấu hình nguồn thu, giá Pro/Agency và xét duyệt tiền chuyển khoản sau đối soát.</p></div></div>
   <BankSettings settings={(settings?.value??{}) as {enabled?:boolean;bankCode?:string;accountNumber?:string;accountName?:string;notice?:string}} prices={{pro:amount("pro"),agency:amount("agency")}}/>
   <section className="mt-9"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><ReceiptText size={22}/> Đơn chờ đối soát ({rows.filter(x=>x.status==="submitted").length})</h2>
    <div className="space-y-3">{rows.filter(o=>o.status==="submitted").map(o=><ReviewOrder key={o.id} order={o} email={emails.get(o.user_id)??o.user_id}/>)}
     {!rows.some(x=>x.status==="submitted")&&<p className="rounded-xl border border-slate-700 p-6 text-sm text-slate-400">Chưa có đơn báo đã chuyển khoản.</p>}</div>
   </section>
   <section className="mt-9"><h2 className="mb-4 text-lg font-bold">Lịch sử đơn hàng</h2>
    <div className="space-y-3">{rows.filter(o=>o.status!=="submitted").map(o=><ReviewOrder key={o.id} order={o} email={emails.get(o.user_id)??o.user_id}/>)}
     {rows.length===0&&<p className="text-sm text-slate-400">Chưa có đơn hàng.</p>}</div>
   </section>
   <p className="mt-8 text-xs text-amber-200">Không xác nhận đơn theo ảnh biên lai khách hàng tự cung cấp. Luôn đối soát trực tiếp giao dịch nhận tiền trong ứng dụng ngân hàng của chủ tài khoản.</p>
  </div>
 </main>;
}
