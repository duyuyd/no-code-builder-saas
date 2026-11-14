"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {BookOpen,LoaderCircle,MessageCircle,RotateCcw,Send,Sparkles,X} from "lucide-react";
import {askStudioAssistant,getStudioAssistantStatus,type AssistantResponse,type AssistantStatus} from "@/app/builder/assistant-actions";

type Message={from:"user"|"studio";text:string;mode?:"offline"|"gemini"|"deepseek"|"openai"|"orcarouter"};
export default function StudioAssistant({projectId,pageId,selectedId,selectedType,blockCount,contextKind="builder"}:{
 projectId:string;pageId:string;selectedId:string|null;selectedType:string|null;blockCount:number;contextKind?:"builder"|"game"
}){
 const [open,setOpen]=useState(false);
 const [question,setQuestion]=useState("");
 const [messages,setMessages]=useState<Message[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [status,setStatus]=useState<AssistantStatus|null>(null);
 const scrollRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  let alive=true;
  void getStudioAssistantStatus().then(data=>{if(alive)setStatus(data);}).catch(()=>{if(alive)setStatus(null);});
  return ()=>{alive=false;};
 },[open]);
 useEffect(()=>{if(open)scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:"smooth"});},[messages,busy,open]);
 const send=async(value:string)=>{
  const q=value.trim();
  if(q.length<2||q.length>1600||busy)return;
  setQuestion("");setError("");setBusy(true);
  setMessages(messages=>[...messages,{from:"user",text:q}]);
  try{
   const history=messages.slice(-10).map(m=>({role:m.from==="user"?"user" as const:"assistant" as const,content:m.text}));
   const result:AssistantResponse=await askStudioAssistant({projectId,pageId,question:q,selectedId,contextKind,history});
   if(result.ok){setMessages(messages=>[...messages,{from:"studio",text:result.answer,mode:result.mode}]);if(result.mode!=="offline")setStatus(prev=>prev?{...prev,active:true,provider:result.mode}:prev);}
   else setError(result.error);
  }catch{setError("Không thể kết nối máy chủ. Hãy thử lại.");}
  finally{setBusy(false);}
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();void send(question);};
 const suggestions=contextKind==="game"
  ?["Hướng dẫn đánh quái và thắng màn này?","Cách đổi sang bản đồ võ hiệp hoặc bóng đá?","Làm sao đặt và chỉnh máu đối thủ?","Tôi lấy ảnh sprite và bối cảnh ở đâu?"]
  :selectedType==="image"||selectedType==="fashion-photo"
   ?["Chèn ảnh từ kho vào thành phần này?","Làm sao chỉnh kích thước ảnh này?","Kho tài nguyên có nguồn nào phù hợp?","Xuất bản trang hiện tại thế nào?"]
   :["Sắp xếp khối Android bằng nút lên xuống?","Cách tạo website thời trang từ mẫu?","Chỉnh màu và bố cục khối đang chọn?","Xuất bản và tải ZIP ra sao?"];
 return <Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild><button type="button" title="Trợ lý hướng dẫn theo ngữ cảnh" className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-500/10 px-2 text-xs font-bold text-orange-200 hover:bg-orange-500/20 sm:h-10 sm:px-3"><MessageCircle size={17}/><span className="hidden sm:inline">Trợ lý</span></button></Dialog.Trigger>
  <Dialog.Portal>
   <Dialog.Overlay className="fixed inset-0 z-[85] bg-slate-950/70 backdrop-blur-[2px]"/>
   <Dialog.Content className="fixed inset-x-0 bottom-0 z-[86] flex h-[min(87dvh,810px)] flex-col overflow-hidden rounded-t-[26px] border border-slate-700 bg-[#111d2e] text-white shadow-2xl outline-none sm:bottom-5 sm:left-auto sm:right-5 sm:h-[min(82dvh,760px)] sm:w-[min(440px,calc(100vw-40px))] sm:rounded-3xl">
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-[#1b2a40] p-4">
     <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Sparkles size={24}/></div>
     <div className="min-w-0 flex-1"><Dialog.Title className="text-sm font-black">Trợ lý Studio</Dialog.Title><Dialog.Description className="mt-1 text-[11px] text-slate-400">{status?.active?
   "AI "+status.provider+" • hiểu trang và hội thoại nhiều lượt":
   "Offline • Admin có thể bật Gemini / DeepSeek / OpenAI"}</Dialog.Description></div>
     <button type="button" onClick={()=>{setMessages([]);setError("");}} className="rounded-lg border border-slate-600 p-2 text-slate-300 hover:bg-slate-700" title="Xóa hội thoại trong phiên" aria-label="Xóa đoạn chat"><RotateCcw size={18}/></button>
     <Dialog.Close className="rounded-lg border border-slate-600 p-2 text-slate-300 hover:bg-slate-700" aria-label="Đóng trợ lý"><X size={18}/></Dialog.Close>
    </header>
    <div className="shrink-0 border-b border-slate-700/60 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
     <span className="font-bold text-orange-200">Đang làm việc:</span> {blockCount} {contextKind==="game"?"vật thể trên bản đồ":"khối trên trang"} · {selectedType?"Chọn "+selectedType:"Chưa chọn khối"}
    </div>
    <section ref={scrollRef} aria-label="Nội dung trao đổi" aria-live="polite" className="editor-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
     {messages.length===0&&<div className="rounded-2xl border border-slate-700 bg-[#1b2a40] p-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-black"><BookOpen size={18} className="text-orange-300"/> Bắt đầu từ việc bạn đang làm</p>
      <p className="text-xs leading-6 text-slate-300">Trợ lý đọc trang, thành phần đang chọn và bản đồ từ Supabase. Khi Admin bật API, trợ lý có thể trò chuyện nhiều lượt, giải thích lỗi và hướng dẫn theo công việc thực tế. Không tự ý sửa dữ liệu.</p>
      <div className="mt-4 flex flex-wrap gap-2">{suggestions.map(s=><button key={s} type="button" disabled={busy} onClick={()=>void send(s)} className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-left text-xs leading-5 text-orange-100 hover:border-orange-400">{s}</button>)}</div>
     </div>}
     {messages.map((m,i)=><div key={i} className={"flex "+(m.from==="user"?"justify-end":"justify-start")}><div className={"max-w-[94%] rounded-2xl p-4 text-xs leading-6 "+(m.from==="user"?"rounded-br-sm bg-orange-500 text-white":"rounded-bl-sm border border-slate-700 bg-slate-800 text-slate-100")}>
      {m.from==="studio"&&<p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-300"><Sparkles size={13}/>{m.mode==="gemini"?"Google Gemini AI":m.mode==="deepseek"?"DeepSeek AI":m.mode==="openai"?"OpenAI AI":"Hướng dẫn offline (không dùng API)"}</p>}
      <p className="whitespace-pre-line">{m.text}</p>
     </div></div>)}
     {busy&&<p role="status" className="flex items-center gap-2 text-xs text-slate-300"><LoaderCircle size={16} className="animate-spin"/> Đang phân tích câu hỏi...</p>}
     {error&&<p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
    </section>
    <form onSubmit={submit} className="shrink-0 border-t border-slate-700 bg-[#1b2a40] p-3 sm:p-4">
     <div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Nhập câu hỏi cho trợ lý</span><input value={question} onChange={e=>setQuestion(e.target.value)} required minLength={2} maxLength={1600} placeholder="Hỏi về công cụ, game, giao diện..." className="w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3 text-sm text-white outline-none focus:border-orange-500"/></label><button type="submit" disabled={busy||question.trim().length<2||question.length>1600} className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white disabled:opacity-40" aria-label="Gửi câu hỏi">{busy?<LoaderCircle size={19} className="animate-spin"/>:<Send size={19}/>}</button></div>
     <p className="mt-2 text-[10px] leading-4 text-slate-400">{status?.notice??"Đang kiểm tra trạng thái AI..."}.
      {status?.active?" Nội dung câu hỏi, lịch sử chat gần đây và mô tả dự án sẽ được gửi tới nhà cung cấp AI; không gửi API key.":" Chỉ Admin được phép kích hoạt dịch vụ AI."}</p>
    </form>
   </Dialog.Content>
  </Dialog.Portal>
 </Dialog.Root>;
}
