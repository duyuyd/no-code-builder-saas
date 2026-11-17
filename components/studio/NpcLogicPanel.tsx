"use client";
import {useState,type FormEvent} from "react";
import {Bot,Code2,Download,LoaderCircle} from "lucide-react";
import {generateNpcLogic,approveNpcLogic,type LogicResult} from "@/app/ai-logic/actions";
export default function NpcLogicPanel({projectId}:{projectId:string}){
 const [prompt,setPrompt]=useState("");
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<LogicResult|null>(null);
 const [approved,setApproved]=useState(false);
 const [approvalError,setApprovalError]=useState("");
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy)return;
  setBusy(true);setResult(null);setApproved(false);setApprovalError("");
  try{setResult(await generateNpcLogic(projectId,prompt));}
  catch{setResult({ok:false,error:"Kết nối thất bại. Hãy kiểm tra mạng."});}
  finally{setBusy(false);}
 };
 const download=()=>{
  if(!result?.ok)return;
  const url=URL.createObjectURL(new Blob([result.source],{type:"text/javascript"}));
  const link=document.createElement("a");link.href=url;link.download="npc-logic.mjs";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
 };
 return <section className="space-y-4">
  <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-4">
   <label className="block text-sm font-semibold" htmlFor="npc-prompt">Mô tả hành vi NPC</label>
   <textarea id="npc-prompt" minLength={10} maxLength={2000} required rows={5}
    placeholder="Tạo NPC đi tuần và tấn công khi phát hiện kẻ địch. Khi mất dấu thì quay lại tuần tra."
    value={prompt} onChange={e=>setPrompt(e.target.value)}
    className="w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm text-white outline-none focus:border-orange-400"/>
   <p className="text-xs text-slate-400">Yêu cầu được xử lý bởi AI thật khi Admin đã bật provider và hạn mức. Kết quả là state machine có kiểm tra cấu trúc, không chạy mã JavaScript trực tiếp từ model.</p>
   <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
    {busy?<LoaderCircle size={17} className="animate-spin"/>:<Bot size={17}/>} Tạo logic NPC</button>
  </form>
  {result&&!result.ok&&<p role="alert" className="rounded-xl border border-rose-700 bg-rose-900/30 p-4 text-sm text-rose-200">{result.error}</p>}
  {result?.ok&&<section className="space-y-3 rounded-2xl border border-emerald-700/40 bg-slate-800 p-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-bold"><Code2 size={17}/> NPC JavaScript — {result.provider}</h2>
    <div className="flex flex-wrap gap-2">
     <button onClick={async()=>{if(!result?.ok||approved)return;setApprovalError("");const r=await approveNpcLogic(result.id);if(r.ok)setApproved(true);else setApprovalError(r.error);}}
      disabled={approved} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{approved?"Đã phê duyệt":"Phê duyệt logic"}</button>
     <button onClick={download} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold"><Download size={15}/> Tải mã .mjs</button></div></div>
   <p className="text-xs text-slate-400">{approved?"Đã phê duyệt. Logic đủ điều kiện được đưa vào ZIP export.":"Đã lưu vào Supabase với trạng thái đề xuất. Cần phê duyệt trước khi đưa vào ZIP export."}</p>
   {approvalError&&<p role="alert" className="text-xs text-rose-300">{approvalError}</p>}
   <pre className="max-h-[460px] overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-emerald-200"><code>{result.source}</code></pre>
  </section>}
 </section>;
}
