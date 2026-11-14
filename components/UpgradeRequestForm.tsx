"use client";
import {useActionState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {CheckCircle2,Send} from "lucide-react";
import {requestUpgrade,type UpgradeActionState} from "@/app/upgrade/actions";

const blank:UpgradeActionState={ok:false,message:""};
export default function UpgradeRequestForm({selected,plans}:{selected:string;plans:{code:string;name:string}[]}){
 const router=useRouter();
 const [state,action,pending]=useActionState(requestUpgrade,blank);
 useEffect(()=>{if(state.ok)router.refresh();},[state.ok,router]);
 return <form action={action} className="space-y-5 rounded-2xl border border-slate-700 bg-[#1e293b] p-5 sm:p-7">
  <h2 className="text-xl font-bold text-white">Gửi yêu cầu nâng cấp</h2>
  <label className="block text-sm text-slate-200">Gói mong muốn
   <select name="requested_plan" defaultValue={selected} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-white">
    {plans.filter(p=>["pro","agency"].includes(p.code)).map(p=><option key={p.code} value={p.code}>{p.name}</option>)}
   </select>
  </label>
  <label className="block text-sm text-slate-200">Lời nhắn cho quản trị viên (không bắt buộc)
   <textarea name="message" rows={4} maxLength={1000} placeholder="Bạn dự định tạo loại website, game hoặc ứng dụng nào?" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-white"/>
  </label>
  <p className="text-xs leading-5 text-amber-200">Gửi yêu cầu không đồng nghĩa với đã thanh toán. Admin kiểm tra và có thể cấp quyền thử nghiệm thủ công. Hệ thống chưa tự thu tiền.</p>
  <button disabled={pending} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50"><Send size={17}/>{pending?"Đang gửi...":"Gửi yêu cầu"}</button>
  {state.message&&<p role="status" className={"rounded-xl p-3 text-sm "+(state.ok?"bg-emerald-950 text-emerald-200":"bg-rose-950 text-rose-200")}>{state.ok&&<CheckCircle2 className="mr-2 inline" size={16}/>} {state.message}</p>}
 </form>;
}
