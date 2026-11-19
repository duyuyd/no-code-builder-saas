"use client";
import {useEffect} from "react";
import {AlertCircle,CheckCircle2,X} from "lucide-react";

export type ToastState={id:number;kind:"success"|"error";message:string};
export default function StatusToast({toast,onDismiss}:{toast:ToastState|null;onDismiss:()=>void}){
 useEffect(()=>{
  if(!toast)return;
  const timeout=window.setTimeout(onDismiss,6000);
  return ()=>window.clearTimeout(timeout);
 },[toast,onDismiss]);
 if(!toast)return null;
 return <aside data-testid="api-toast" role={toast.kind==="error"?"alert":"status"} aria-live={toast.kind==="error"?"assertive":"polite"}
  className={"fixed bottom-5 right-5 z-[9999] flex max-w-[min(92vw,380px)] items-start gap-3 rounded-xl border bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl "+(toast.kind==="error"?"border-rose-500":"border-emerald-500")}>
  {toast.kind==="success"?<CheckCircle2 aria-hidden="true" size={20} className="shrink-0 text-emerald-400"/>:<AlertCircle aria-hidden="true" size={20} className="shrink-0 text-rose-400"/>}
  <span className="min-w-0 flex-1 break-words">{toast.message}</span>
  <button type="button" aria-label="Đóng thông báo" onClick={onDismiss} className="rounded p-1 text-slate-300 hover:bg-slate-700"><X size={16}/></button>
 </aside>;
}
