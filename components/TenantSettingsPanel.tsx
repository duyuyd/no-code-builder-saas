"use client";
import {useActionState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {Globe2,CheckCircle2,AlertCircle} from "lucide-react";
import {saveTenantBranding,registerTenantDomain,verifyTenantDomain,type TenantActionState} from "@/app/domains/actions";
type Tenant={id:string;name:string;primary_color:string;logo_url:string|null;project_id:string|null;custom_domain:string|null;domain_status:string;domain_verification:unknown}|null;
const initial:TenantActionState={ok:false,message:""};
function Result({state}:{state:TenantActionState}){
 if(!state.message)return null;
 return <div role="status" className={"mt-3 rounded-xl border p-3 text-sm "+(state.ok?"border-emerald-700 bg-emerald-950/40 text-emerald-200":"border-rose-700 bg-rose-950/40 text-rose-200")}>{state.ok?<CheckCircle2 size={16} className="mr-2 inline"/>:<AlertCircle size={16} className="mr-2 inline"/>}{state.message}
 {state.checks?.map((v,i)=><div key={i} className="mt-2 break-all rounded bg-slate-900 p-2 font-mono text-xs">{v.type} · {v.domain}<div className="mt-1 select-all text-orange-200">{v.value}</div></div>)}
 </div>;
}
export default function TenantSettingsPanel({tenant,projects,canDomain}:{tenant:Tenant;projects:{id:string;name:string}[];canDomain:boolean}){
 const router=useRouter();
 const [brand,brandAction,brandPending]=useActionState(saveTenantBranding,initial);
 const [domain,domainAction,domainPending]=useActionState(registerTenantDomain,initial);
 const [verify,verifyAction,verifyPending]=useActionState(verifyTenantDomain,initial);
 useEffect(()=>{if(brand.ok||domain.ok||verify.ok)router.refresh();},[brand.ok,domain.ok,verify.ok,router]);
 const input="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-white outline-none focus:border-orange-500";
 return <div className="space-y-5">
  <form action={brandAction} className="space-y-4 rounded-2xl border border-slate-700 bg-[#1e293b] p-5 sm:p-7">
    <h2 className="text-lg font-semibold">Thông tin thương hiệu</h2>
    <label className="block text-sm text-slate-300">Tên thương hiệu<input required minLength={2} maxLength={120} name="name" defaultValue={tenant?.name??""} placeholder="Tên thương hiệu của bạn" className={input}/></label>
    <label className="block text-sm text-slate-300">Đường dẫn logo HTTPS<input name="logo_url" type="url" defaultValue={tenant?.logo_url??""} placeholder="https://example.com/logo.svg" className={input}/></label>
    <label className="block text-sm text-slate-300">Dự án đã xuất bản<select name="project_id" defaultValue={tenant?.project_id??""} className={input}><option value="">Chưa chọn dự án</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label className="flex items-center gap-3 text-sm text-slate-300">Màu chủ đạo<input name="primary_color" type="color" defaultValue={tenant?.primary_color??"#f97316"} className="h-12 w-24 cursor-pointer rounded-lg border border-slate-600 bg-transparent"/></label>
    <button disabled={brandPending} className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-50">{brandPending?"Đang lưu...":"Lưu thương hiệu"}</button><Result state={brand}/>
  </form>
  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5 sm:p-7">
    <div className="mb-3 flex items-center gap-2"><Globe2 size={22} className="text-orange-400"/><h2 className="text-lg font-semibold">Tên miền riêng</h2></div>
    {tenant?.custom_domain?<div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 p-4"><strong className="break-all">{tenant.custom_domain}</strong><span className={"rounded-full px-2 py-1 text-xs "+(tenant.domain_status==="verified"?"bg-emerald-950 text-emerald-300":"bg-amber-950 text-amber-300")}>{tenant.domain_status==="verified"?"Đã xác minh":"Chờ DNS"}</span></div>:<p className="mb-4 text-sm text-slate-400">Chưa có tên miền. Trước tiên hãy lưu thương hiệu và chọn dự án.</p>}
    {canDomain?<>
    {!tenant?.custom_domain&&<form action={domainAction} className="space-y-3"><label className="block text-sm text-slate-300">Tên miền đã sở hữu<input name="domain" required placeholder="shop.tenmiencuaban.vn" className={input}/></label><button disabled={domainPending||!tenant} className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-50">{domainPending?"Đang kết nối...":"Thêm tên miền vào Vercel"}</button><Result state={domain}/></form>}
    {tenant?.custom_domain&&<form action={verifyAction} className="mt-3"><button disabled={verifyPending} className="rounded-xl border border-orange-500 px-5 py-3 font-semibold text-orange-300 disabled:opacity-50">{verifyPending?"Đang kiểm tra...":"Kiểm tra DNS và xác minh"}</button><Result state={verify}/></form>}
    </>:<p className="rounded-xl bg-slate-900 p-4 text-sm text-amber-300">Tên miền riêng dành cho Pro/Agency. Gói trả phí hiện chưa mở thanh toán; không tự phát sinh phí.</p>}
    {Array.isArray(tenant?.domain_verification)&&tenant.domain_verification.map((v,i)=>{const x=v as {type?:string;domain?:string;value?:string};return <div key={i} className="mt-3 break-all rounded-lg border border-slate-600 bg-slate-900 p-3 text-xs"><div>Thêm bản ghi {x.type} cho <strong>{x.domain}</strong></div><code className="mt-1 block select-all text-orange-300">{x.value}</code></div>})}
    <p className="mt-4 text-xs leading-6 text-slate-400">DNS được cấu hình tại nhà cung cấp tên miền. Nếu Vercel yêu cầu TXT, thêm TXT chính xác như hiển thị. Tên miền chưa được xác minh sẽ không dùng để hiển thị website. Website cần được xuất bản trước trên Builder.</p>
  </section>
 </div>;
}
