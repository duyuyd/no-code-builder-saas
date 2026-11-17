"use client";
import Link from "next/link";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Sparkles,ArrowUpRight,LoaderCircle,Code2,Blocks,ShieldCheck} from "lucide-react";
import {generateWebsiteFromPrompt} from "@/app/generate/actions";
export default function AiAppBuilderWorkspace({initialPrompt=""}:{initialPrompt?:string}){
 const router=useRouter(),[prompt,setPrompt]=useState(initialPrompt),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy||prompt.trim().length<12)return;
  setBusy(true);setError("");
  try{
   const result=await generateWebsiteFromPrompt(prompt.trim());
   if(result.ok){router.push("/builder?project="+encodeURIComponent(result.projectId));return;}
   setError(result.reason==="signin"?"Hãy đăng nhập trước khi tạo dự án.":result.error);
  }catch{setError("Máy chủ tạo ứng dụng chưa phản hồi.")}
  finally{setBusy(false);}
 };
 return <main className="min-h-dvh bg-[#080f20] px-4 py-10 text-slate-100 sm:px-6">
  <div className="mx-auto max-w-6xl">
   <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/" className="text-sm font-semibold text-orange-300">← NuvoraCraft</Link><Link href="/dashboard" className="rounded-xl border border-slate-600 px-4 py-2 text-sm">My Projects</Link></div>
   <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
    <section><div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-orange-300"><Sparkles size={14}/> AI App Builder</div>
     <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Prompt → Editable App.</h1>
     <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">Mô tả website hoặc ứng dụng bằng tiếng Việt. OpenAI tạo cấu trúc UI theo JSON có kiểm tra, lưu vào dự án Supabase và mở trực tiếp Builder để tiếp tục kéo thả. Không tạo dữ liệu demo giả.</p>
     <form onSubmit={submit} className="mt-9 space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-8">
      <label htmlFor="ai-builder-prompt" className="block text-sm font-bold">Ý tưởng của bạn</label>
      <textarea id="ai-builder-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} minLength={12} maxLength={850} rows={7} required placeholder="Tạo cho tôi trang web bán cà phê với menu, giới thiệu, đặt hàng và phong cách màu nâu ấm..." className="w-full resize-y rounded-2xl border border-slate-600 bg-slate-950 p-5 text-base leading-7 outline-none focus:border-orange-400"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-400">{prompt.length}/850 · AI yêu cầu tài khoản và cấu hình nhà cung cấp.</p><button type="submit" disabled={busy||prompt.trim().length<12} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Sparkles size={18}/>} Tạo dự án <ArrowUpRight size={17}/></button></div>
      {error&&<p role="alert" className="rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</p>}
     </form>
    </section>
    <aside className="space-y-4 pt-2">
     {[{title:"AI prompt",description:"OpenAI tạo cấu trúc, không trả mã tùy ý để thực thi.",icon:Sparkles},
       {title:"Validated UI tree",description:"Chuẩn hóa thành block registry đang dùng; giới hạn số lượng và độ sâu.",icon:Blocks},
       {title:"Supabase project",description:"Lưu project/pages theo phiên đăng nhập và RLS.",icon:ShieldCheck},
       {title:"Edit and export",description:"Mở Builder hiện tại; chỉnh sửa, Undo/Redo và xuất mã nguồn.",icon:Code2}].map((x,i)=><div key={x.title} className="flex items-start gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><x.icon size={21}/></span><div><p className="text-[11px] text-orange-300">STEP {i+1}</p><h2 className="mt-1 font-bold">{x.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{x.description}</p></div></div>)}
     <p className="rounded-xl border border-slate-600 p-4 text-xs leading-6 text-slate-400">Inspired by the open-source architecture of Totalum Labs AI App Builder (MIT), but uses NuvoraCraft's own OpenAI + Supabase account rather than Totalum's hosted API. No third-party credentials required.</p>
    </aside>
   </div>
  </div>
 </main>;
}
