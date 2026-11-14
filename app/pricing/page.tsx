import Link from "next/link";
import {Check,ArrowLeft,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
type Plan={code:string;name:string;priceLabel:string;description:string;features:string[];available:boolean;visible?:boolean;priceVnd?:number};
function valid(value:unknown):value is Plan[] {
 return Array.isArray(value)&&value.length>0&&value.every(p=>p&&typeof p==="object"&&typeof p.code==="string"&&typeof p.name==="string"&&typeof p.priceLabel==="string"&&typeof p.description==="string"&&Array.isArray(p.features)&&p.features.every((f:unknown)=>typeof f==="string")&&typeof p.available==="boolean");
}
export default async function Pricing(){
 const db=await createClient();
 const {data,error}=await db.from("platform_settings").select("key,value").in("key",["saas_pricing","saas_billing"]);
 if(error)throw new Error(error.message);
 const tierData=data?.find(row=>row.key==="saas_pricing")?.value;
 const billingData=data?.find(row=>row.key==="saas_billing")?.value as {enabled?:boolean}|undefined;
 const billingEnabled=billingData?.enabled===true;
 const plans=valid(tierData)?tierData.filter(plan=>plan.visible!==false):[];
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100">
  <div className="mx-auto max-w-6xl">
   <Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/>Builder</Link>
   <div className="mx-auto my-12 max-w-2xl text-center"><p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-400">Các gói SaaS</p><h1 className="text-4xl font-extrabold">Chọn gói cho mục tiêu của bạn</h1><p className="mt-4 text-slate-400">Bạn có thể sử dụng Free, gửi yêu cầu cấp Pro/Agency hoặc thanh toán chuyển khoản nếu chủ nền tảng đã bật cấu hình ngân hàng thật.</p></div>
   <div className="grid gap-5 md:grid-cols-3">{plans.map(plan=><article key={plan.code} className={"flex flex-col rounded-3xl border p-7 "+(plan.code==="pro"?"border-orange-500 bg-[#1e293b] shadow-xl shadow-orange-900/10":"border-slate-700 bg-[#1e293b]")}>
    <p className="text-sm font-bold text-orange-300">{plan.name}</p><h2 className="mt-3 text-3xl font-extrabold">{plan.priceLabel}</h2><p className="mt-4 min-h-16 text-sm leading-6 text-slate-400">{plan.description}</p>
    <div className="my-5 h-px bg-slate-700"/>
    <div className="flex-1 space-y-3">{plan.features.map(feature=><p key={feature} className="flex items-start gap-2 text-sm"><Check size={17} className="mt-0.5 shrink-0 text-emerald-400"/>{feature}</p>)}</div>
    {plan.code==="free" && plan.available?<Link href="/builder" className="mt-8 rounded-xl bg-orange-500 p-3 text-center text-sm font-bold">Bắt đầu sử dụng</Link>:
      billingEnabled&&typeof plan.priceVnd==="number"&&plan.priceVnd>=1000?
       <Link href={plan.code==="agency"?"/checkout?plan=agency":"/checkout?plan=pro"} className="mt-8 rounded-xl bg-orange-500 p-3 text-center text-sm font-bold text-white">Đặt gói · Chuyển khoản</Link>:
       <Link href={plan.code==="agency"?"/upgrade?plan=agency":"/upgrade?plan=pro"} className="mt-8 rounded-xl border border-orange-500/50 bg-orange-500/10 p-3 text-center text-sm font-bold text-orange-300 transition hover:bg-orange-500/20">Gửi yêu cầu nâng cấp gói</Link>}
   </article>)}</div>
   <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-slate-500"><ShieldCheck size={16}/>Dữ liệu dự án và tài liệu ký được phân quyền theo tài khoản.</p>
  </div>
 </main>;
}
