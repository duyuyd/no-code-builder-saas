"use client";
import {useCallback,useState} from "react";
import {LoaderCircle} from "lucide-react";
import type {FormSchema} from "@/lib/auto-database";
import StatusToast,{type ToastState} from "@/components/feedback/StatusToast";

type CreateResult={ok:boolean;schema?:string;table?:string;error?:string};
export default function FormDatabasePanel({projectId,pageId,forms}:{projectId:string;pageId:string;forms:FormSchema[]}){
 const [formId,setFormId]=useState(forms[0]?.nodeId??"");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [toast,setToast]=useState<ToastState|null>(null);
 const dismiss=useCallback(()=>setToast(null),[]);
 const current=forms.find(f=>f.nodeId===formId)??forms[0];
 async function create(){
  if(!current||busy)return;
  setBusy(true);setNotice("");setToast(null);
  try{
   const response=await fetch("/api/create-table",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({projectId,pageId,nodeId:current.nodeId,fields:current.fields})
   });
   const result=await response.json() as CreateResult;
   if(!response.ok||!result.ok){
    const message="Lỗi tạo bảng: "+(result.error??"Không thể tạo bảng Database");
    setNotice(message);setToast({id:Date.now(),kind:"error",message});return;
   }
   const table=[result.schema,result.table].filter(Boolean).join(".");
   const message="Tạo bảng thành công"+(table?": "+table:"");
   setNotice(message);setToast({id:Date.now(),kind:"success",message});
  }catch{
   const message="Không thể kết nối dịch vụ Auto-Database.";
   setNotice(message);setToast({id:Date.now(),kind:"error",message});
  }finally{setBusy(false);}
 }
 return <>
  <details className="relative">
   <summary className="cursor-pointer rounded-lg border border-orange-400/60 px-3 py-2 text-orange-200">Form Database</summary>
   <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[92vw] rounded-xl border border-slate-600 bg-slate-900 p-4 text-white shadow-2xl">
    <p className="mb-3 font-semibold">Tạo bảng từ Form đã lưu</p>
    {forms.length===0?<p className="text-xs text-slate-400">Chưa có Form với trường nhập liệu trên trang. Hãy thêm Form và lưu trong Editor.</p>:<>
     <label htmlFor="form-db-selector" className="block text-xs">Form</label>
     <select id="form-db-selector" value={current?.nodeId??""} onChange={e=>setFormId(e.target.value)}
      disabled={busy} className="mb-3 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-2 text-xs">
      {forms.map((form,i)=><option key={form.nodeId} value={form.nodeId}>Form {i+1} · {form.nodeId.slice(0,12)}</option>)}
     </select>
     <p className="mb-3 text-xs text-slate-400">{current?.fields.map(x=>x.name+" ("+x.kind+")").join(", ")}</p>
     <button type="button" disabled={busy} aria-busy={busy} data-testid="create-database-table"
      onClick={()=>void create()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold disabled:opacity-40">
      {busy&&<LoaderCircle aria-hidden="true" size={16} className="animate-spin"/>}
      {busy?"Đang tạo bảng...":"Tạo bảng Database"}
     </button>
    </>}
    {notice&&<p role="status" className="mt-3 break-all text-xs">{notice}</p>}
   </div>
  </details>
  <StatusToast toast={toast} onDismiss={dismiss}/>
 </>;
}
