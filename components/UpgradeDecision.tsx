"use client";
import {useActionState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {decideUpgradeRequest,type UpgradeActionState} from "@/app/upgrade/actions";
const blank:UpgradeActionState={ok:false,message:""};
export default function UpgradeDecision({id}:{id:string}){
 const router=useRouter();
 const [state,action,pending]=useActionState(decideUpgradeRequest,blank);
 useEffect(()=>{if(state.ok)router.refresh();},[state.ok,router]);
 return <form action={action} className="space-y-2">
  <input type="hidden" name="request_id" value={id}/>
  <label className="block text-xs text-slate-300">Ghi chú nội bộ (không bắt buộc)
    <input type="text" name="note" maxLength={500} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm text-white" placeholder="Lý do duyệt, thời hạn thử nghiệm..."/>
  </label>
  <div className="flex flex-wrap gap-2">
   <button disabled={pending} name="decision" value="approve" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Cấp quyền gói</button>
   <button disabled={pending} name="decision" value="reject" className="rounded-lg border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-300 disabled:opacity-50">Từ chối</button>
  </div>
  {state.message&&<p role="status" className={"text-xs "+(state.ok?"text-emerald-300":"text-rose-300")}>{state.message}</p>}
 </form>;
}
