"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {FileInput,LoaderCircle} from "lucide-react";

type ImportResponse={ok:boolean;count?:number;error?:string};

export default function FigmaPageImporter({projectId,pageId}:{projectId:string;pageId:string}){
 const router=useRouter();
 const [figmaUrl,setFigmaUrl]=useState("");
 const [figmaToken,setFigmaToken]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending)return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/figma",{
    method:"POST",cache:"no-store",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({figmaUrl:figmaUrl.trim(),figmaToken,projectId,pageId})
   });
   const data=await response.json() as ImportResponse;
   if(!response.ok||!data.ok){
    setError(response.status===401?"Figma token không hợp lệ hoặc phiên đăng nhập hết hạn.":data.error??"Không thể nhập thiết kế.");
    return;
   }
   setFigmaToken("");
   router.push("/builder?project="+encodeURIComponent(projectId)+"&page="+encodeURIComponent(pageId));
   router.refresh();
  }catch{
   setError("Không thể kết nối Figma. Kiểm tra mạng và thử lại.");
  }finally{
   setPending(false);
  }
 }
 return <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
  <label htmlFor="figma-url" className="block text-sm font-bold">Liên kết Figma</label>
  <input id="figma-url" type="url" required maxLength={700} value={figmaUrl}
   onChange={e=>setFigmaUrl(e.target.value)} autoComplete="off"
   placeholder="https://www.figma.com/design/..."
   className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-sm outline-none focus:border-orange-400"/>
  <label htmlFor="figma-token" className="block text-sm font-bold">Figma Personal Access Token</label>
  <input id="figma-token" type="password" required maxLength={500} value={figmaToken}
   onChange={e=>setFigmaToken(e.target.value)} autoComplete="off" spellCheck={false}
   placeholder="Dán token có quyền file_content:read"
   className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-sm outline-none focus:border-orange-400"/>
  <p className="text-xs text-slate-400">Token chỉ được gửi trong yêu cầu HTTPS tới server, không lưu trong Supabase hoặc localStorage.</p>
  {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
  <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold disabled:opacity-60">
   {pending?<LoaderCircle size={18} className="animate-spin"/>:<FileInput size={18}/>}
   {pending?"Đang nhập từ Figma...":"Import và mở Builder"}
  </button>
 </form>;
}
