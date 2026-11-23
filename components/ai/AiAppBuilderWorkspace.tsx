"use client";
import Link from "next/link";
import Script from "next/script";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Sparkles,ArrowUpRight,LoaderCircle,Code2,Blocks,ShieldCheck} from "lucide-react";
import {saveKeylessGeneratedWebsite} from "@/app/generate/actions";
type AIResponse=string|{message?:{content?:string|Array<{text?:string}>};text?:string};
declare global{interface Window{puter?:{auth:{isSignedIn:()=>boolean;signIn:()=>Promise<unknown>};ai:{chat:(messages:Array<{role:string;content:string}>,options:{model:string;max_tokens:number})=>Promise<AIResponse>}}}}
function textFromResponse(response:AIResponse):string{
 if(typeof response==="string")return response.trim();
 const content=response.message?.content??response.text;
 return typeof content==="string"?content.trim():Array.isArray(content)?content.map(x=>x.text??"").join("\n").trim():"";
}
export default function AiAppBuilderWorkspace({initialPrompt=""}:{initialPrompt?:string}){
 const router=useRouter(),[prompt,setPrompt]=useState(initialPrompt),[busy,setBusy]=useState(false),[error,setError]=useState(""),[ready,setReady]=useState(false);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy||prompt.trim().length<12)return;
  setBusy(true);setError("");
  try{
   const p=window.puter;if(!p)throw new Error("Puter chưa tải xong.");
   if(!p.auth.isSignedIn())await p.auth.signIn();
   const response=await p.ai.chat([
    {role:"system",content:'You generate real editable no-code website JSON. Return ONLY compact JSON with {"name":"Website name","ui_tree":[{"type":"section","props":{"label":"Main"},"style":{},"children":[{"type":"heading","props":{"text":"Headline based on user request"},"style":{},"children":[]}]}]}. Allowed types: section,container,hero,card,row,column,grid,heading,h1,h3,paragraph,text,button,link,image. Each node must include type,props,style,children. Only layout nodes have nested children. Use 5-12 useful real content blocks based on the users business description. No invented testimonials, customer names, addresses, prices or payment links. Output JSON only without markdown.'},
    {role:"user",content:prompt.trim()}
   ],{model:"liquid/lfm-2.5-1.2b-instruct:free",max_tokens:1800});
   const answer=textFromResponse(response);
   if(!answer)throw new Error("Puter chưa trả về JSON.");
   const result=await saveKeylessGeneratedWebsite(answer);
   if(result.ok){router.push("/builder?project="+encodeURIComponent(result.projectId));return;}
   setError(result.reason==="signin"?"Hãy đăng nhập trước khi tạo dự án.":result.error);
  }catch{setError("Máy chủ tạo ứng dụng chưa phản hồi.")}
  finally{setBusy(false);}
 };
 return <main className="min-h-dvh bg-[#080f20] px-4 py-10 text-slate-100 sm:px-6"><Script src="https://js.puter.com/v2/" strategy="afterInteractive" onLoad={()=>setReady(!!window.puter)} onError={()=>setError("Puter.js không tải được.")}/>
  <div className="mx-auto max-w-6xl">
   <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/" className="text-sm font-semibold text-orange-300">← NuvoraCraft</Link><Link href="/dashboard" className="rounded-xl border border-slate-600 px-4 py-2 text-sm">My Projects</Link></div>
   <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
    <section><div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-orange-300"><Sparkles size={14}/> AI App Builder</div>
     <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Prompt → Editable App.</h1>
     <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">Mô tả website bằng tiếng Việt. Mô hình AI miễn phí của Puter tạo JSON, máy chủ xác thực và kiểm tra cấu trúc trước khi lưu dự án vào Supabase. Không yêu cầu API key của chủ website.</p>
     <form onSubmit={submit} className="mt-9 space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-8">
      <label htmlFor="ai-builder-prompt" className="block text-sm font-bold">Ý tưởng của bạn</label>
      <textarea id="ai-builder-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} minLength={12} maxLength={850} rows={7} required placeholder="Tạo cho tôi trang web bán cà phê với menu, giới thiệu, đặt hàng và phong cách màu nâu ấm..." className="w-full resize-y rounded-2xl border border-slate-600 bg-slate-950 p-5 text-base leading-7 outline-none focus:border-orange-400"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-400">{prompt.length}/850 · AI qua Puter (hạn mức tài khoản người dùng), cần đăng nhập NuvoraCraft để lưu.</p><button type="submit" disabled={!ready||busy||prompt.trim().length<12} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Sparkles size={18}/>} Tạo dự án <ArrowUpRight size={17}/></button></div>
      {error&&<p role="alert" className="rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</p>}
     </form>
    </section>
    <aside className="space-y-4 pt-2">
     {[{title:"AI prompt",description:"Puter tạo cấu trúc bằng mô hình FREE, không chạy code tùy ý.",icon:Sparkles},
       {title:"Validated UI tree",description:"Chuẩn hóa thành block registry đang dùng; giới hạn số lượng và độ sâu.",icon:Blocks},
       {title:"Supabase project",description:"Lưu project/pages theo phiên đăng nhập và RLS.",icon:ShieldCheck},
       {title:"Edit and export",description:"Mở Builder hiện tại; chỉnh sửa, Undo/Redo và xuất mã nguồn.",icon:Code2}].map((x,i)=><div key={x.title} className="flex items-start gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><x.icon size={21}/></span><div><p className="text-[11px] text-orange-300">STEP {i+1}</p><h2 className="mt-1 font-bold">{x.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{x.description}</p></div></div>)}
     <p className="rounded-xl border border-slate-600 p-4 text-xs leading-6 text-slate-400">Kết quả sinh trực tiếp bằng AI Puter, sau đó được máy chủ kiểm tra, xác thực chủ sở hữu và lưu Supabase. Puter có hạn mức miễn phí cho từng tài khoản; không tự tính phí chủ website.</p>
    </aside>
   </div>
  </div>
 </main>;
}
