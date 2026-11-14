import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,Landmark} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import CheckoutPanel from "@/components/CheckoutPanel";
export const dynamic="force-dynamic";
export const metadata={title:"Thanh toán chuyển khoản",robots:{index:false,follow:false}};
type Plan={code:string;name:string;priceVnd?:number};
export default async function Checkout({searchParams}:{searchParams:Promise<{plan?:string}>}){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const [{data:config},{data:prices},{data:orders,error:ordersError},{data:profile}]=await Promise.all([
  db.from("platform_settings").select("value").eq("key","saas_billing").maybeSingle(),
  db.from("platform_settings").select("value").eq("key","saas_pricing").maybeSingle(),
  db.from("billing_orders").select("id,plan_code,amount_vnd,bank_code,account_number,account_name,transfer_code,status,created_at,reviewed_at,decision_note").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
  db.from("profiles").select("plan").eq("id",user.id).maybeSingle()
 ]);
 if(ordersError)throw new Error(ordersError.message);
 const params=await searchParams;
 const plan=params.plan==="agency"?"agency":"pro";
 const tiers=Array.isArray(prices?.value)?prices.value as Plan[]:[];
 const tier=tiers.find(p=>p.code===plan);
 const price=typeof tier?.priceVnd==="number"&&Number.isSafeInteger(tier.priceVnd)?tier.priceVnd:0;
 const billing=config?.value as {enabled?:boolean}|null;
 const enabled=billing?.enabled===true;
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100">
  <div className="mx-auto max-w-3xl">
   <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Trở về bảng giá</Link>
   <div className="my-8"><div className="flex items-center gap-3"><Landmark className="text-orange-400" size={32}/><h1 className="text-3xl font-black">Thanh toán thủ công</h1></div><p className="mt-3 text-sm text-slate-400">Gói hiện tại: <strong className="uppercase text-orange-200">{profile?.plan??"free"}</strong>. Hệ thống lưu đơn riêng theo tài khoản và mã đối soát độc nhất.</p></div>
   <CheckoutPanel plan={plan} enabled={enabled} price={price} orders={orders??[]}/>
   <p className="mt-5 text-xs leading-6 text-slate-500">Không lưu số thẻ, OTP hoặc mật khẩu ngân hàng. Không có webhook xác nhận tự động. Việc ghi nhận thanh toán do Admin đối soát với sao kê ngân hàng.</p>
  </div>
 </main>;
}
