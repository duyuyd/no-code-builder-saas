"use client";
import {useCallback,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {FileInput,LoaderCircle} from "lucide-react";
import StatusToast,{type ToastState} from "@/components/feedback/StatusToast";

type ImportResponse={ok:boolean;count?:number;error?:string};
export default function FigmaPageImporter({projectId,pageId,compact=false}:{projectId:string;pageId:string;compact?:boolean}){
 const router=useRouter();
 const [figmaUrl,setFigmaUrl]=useState("");
 const [figmaToken,setFigmaToken]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [toast,setToast]=useState<ToastState|null>(null);
 const dismiss=useCallback(()=>setToast(null),[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending)return;
  setPending(true);setError("");setToast(null);
  try{
   const response=await fetch("/api/figma",{
    method:"POST",cache:"no-store",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({figmaUrl:figmaUrl.trim(),figmaToken,projectId,pageId})
   });
   const data=await response.json() as ImportResponse;
   if(!response.ok||!data.ok){
    const message=response.status===401?"Lỗi: Token không hợp lệ hoặc phiên đăng nhập hết hạn.":"Lỗi Import Figma: "+(data.error??"Không thể nhập thiết kế.");
    setError(message);setToast({id:Date.now(),kind:"error",message});return;
   }
   setFigmaToken("");
   const message="Import Figma thành công: "+(data.count??0)+" thành phần.";
   setToast({id:Date.now(),kind:"success",message});
   // Keep the success toast visible before moving into the updated Builder.
   await new Promise<void>(resolve=>window.setTimeout(resolve,1100));
   router.push("/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId));
   router.refresh();
  }catch{
   const message="Không thể kết nối Figma. Kiểm tra mạng và thử lại.";
   setError(message);setToast({id:Date.now(),kind:"error",message});
  }finally{setPending(false);}
 }
 return <>
  <form onSubmit={submit} data-testid="figma-import-form" className={compact?"space-y-3 rounded-xl bg-slate-900 p-3":"mt-5 space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6"}>
   <label htmlFor={compact?"figma-url-toolbar":"figma-url"} className="block text-sm font-bold">Liên kết Figma</label>
   <input id={compact?"figma-url-toolbar":"figma-url"} type="url" required maxLength={700} value={figmaUrl}
    onChange={e=>setFigmaUrl(e.target.value)} autoComplete="off"
    placeholder="https://www.figma.com/design/..."
    className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm outline-none focus:border-orange-400"/>
   <label htmlFor={compact?"figma-token-toolbar":"figma-token"} className="block text-sm font-bold">Figma Personal Access Token</label>
   <input id={compact?"figma-token-toolbar":"figma-token"} type="password" required maxLength={500} value={figmaToken}
    onChange={e=>setFigmaToken(e.target.value)} autoComplete="off" spellCheck={false}
    placeholder="Token có quyền file_content:read"
    className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm outline-none focus:border-orange-400"/>
   <p className="text-xs text-slate-400">Token chỉ dùng cho yêu cầu HTTPS hiện tại; không lưu trong Supabase hoặc localStorage.</p>
   {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
   <button type="submit" disabled={pending} aria-busy={pending} data-testid="figma-import-submit"
    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold disabled:opacity-60">
    {pending?<LoaderCircle size={18} className="animate-spin" aria-hidden="true"/>:<FileInput size={18} aria-hidden="true"/>}
    {pending?"Đang nhập từ Figma...":"Import và mở Builder"}
   </button>
  </form>
  <StatusToast toast={toast} onDismiss={dismiss}/>
 </>;
}
