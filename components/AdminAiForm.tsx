"use client";
import {useActionState,useState} from "react";
import {CheckCircle2,LockKeyhole,Save,ShieldAlert} from "lucide-react";
import {saveStudioAiConfig,type AiAdminState} from "@/app/admin/ai/actions";
import {AI_DEFAULT_MODELS,type AiConfig,type AiProvider} from "@/lib/studio-ai";

const input="mt-2 w-full rounded-xl border border-slate-600 bg-[#101d30] px-4 py-3 text-sm text-white outline-none focus:border-orange-500";
const init:AiAdminState={ok:false,message:""};
export default function AdminAiForm({initial,keys}:{initial:AiConfig;keys:Record<AiProvider,boolean>}){
 const [state,action,pending]=useActionState(saveStudioAiConfig,init);
 const [provider,setProvider]=useState<AiProvider>(initial.provider);
 const [model,setModel]=useState(initial.model);
 const [enabled,setEnabled]=useState(initial.enabled);
 return <form action={action} className="mt-6 space-y-5 rounded-2xl border border-slate-700 bg-[#1c293d] p-4 sm:p-6">
  <div className="flex items-start justify-between gap-3">
   <div><h2 className="text-base font-black">Nhà cung cấp AI</h2><p className="mt-2 text-xs leading-5 text-slate-400">Chỉ gọi API khi khóa tồn tại và bạn chủ động bật.</p></div>
   <span className={"rounded-full px-3 py-1 text-xs font-bold "+(enabled?"bg-emerald-950 text-emerald-300":"bg-slate-800 text-slate-300")}>{enabled?"Được yêu cầu bật":"Đang tắt"}</span>
  </div>
  <label className="block text-xs font-semibold text-slate-200">Chọn nhà cung cấp
   <select name="provider" value={provider} onChange={e=>{const next=e.target.value as AiProvider;setProvider(next);setModel(AI_DEFAULT_MODELS[next]);setEnabled(false);}} className={input}>
    <option value="gemini">Google Gemini</option>
    <option value="deepseek">DeepSeek</option>
    <option value="openai">OpenAI</option>
   </select>
  </label>
  <label className="block text-xs font-semibold text-slate-200">Mã model
   <input name="model" value={model} onChange={e=>setModel(e.target.value)} maxLength={80} required className={input}/>
   <span className="mt-1 block font-normal text-slate-400">Giá và quyền truy cập phụ thuộc tài khoản của bạn; kiểm tra trên trang nhà cung cấp trước khi bật.</span>
  </label>
  <div className={"flex items-start gap-3 rounded-xl border p-4 "+(keys[provider]?"border-emerald-800 bg-emerald-950/20":"border-amber-700/60 bg-amber-950/20")}>
   {keys[provider]?<CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20}/>:<ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={20}/>}
   <div className="text-xs leading-6 text-slate-200">
    <strong>{keys[provider]?"Đã tìm thấy khóa của nhà cung cấp này":"Chưa có API key trên Production"}</strong>
    <p className="text-slate-400">{keys[provider]?"Khóa đang nằm trong biến môi trường máy chủ, không hiển thị ở giao diện.":"Bạn cần thêm biến môi trường ở Vercel Project Settings và redeploy. Không dán khóa vào chat hoặc GitHub."}</p>
   </div>
  </div>
  <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs font-semibold text-white">
   <input name="enabled" type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} disabled={!keys[provider]} className="size-5 accent-orange-500"/>
   Bật AI trả lời trực tiếp bằng {provider==="gemini"?"Gemini":provider==="deepseek"?"DeepSeek":"OpenAI"}
  </label>
  <div className="grid gap-4 sm:grid-cols-3">
   <label className="block text-xs font-semibold text-slate-200">Lượt/người/ngày
    <input name="dailyUserLimit" type="number" min="1" max="20" required defaultValue={initial.dailyUserLimit} className={input}/>
   </label>
   <label className="block text-xs font-semibold text-slate-200">Lượt/toàn hệ thống/ngày
    <input name="dailyGlobalLimit" type="number" min="1" max="300" required defaultValue={initial.dailyGlobalLimit} className={input}/>
   </label>
   <label className="block text-xs font-semibold text-slate-200">Token trả lời tối đa
    <input name="maxOutputTokens" type="number" min="250" max="1500" required defaultValue={initial.maxOutputTokens} className={input}/>
   </label>
  </div>
  <div className="rounded-xl border border-slate-600/60 bg-[#0e192a] p-4 text-xs leading-6 text-slate-300">
   <p className="flex items-center gap-2 font-bold text-orange-200"><LockKeyhole size={16}/> Bảo vệ chi phí và dữ liệu</p>
   Không kích hoạt API tự động, không tự thử lại khi nhà cung cấp báo lỗi. Giới hạn theo người và toàn nền tảng được kiểm soát trong PostgreSQL. Hội thoại không lưu lâu dài trên máy chủ; các lượt gần đây được gửi cùng ngữ cảnh trang/game tới nhà cung cấp đang bật.
  </div>
  {state.message&&<p role="status" className={"rounded-xl border p-3 text-xs leading-6 "+(state.ok?"border-emerald-700 bg-emerald-950/20 text-emerald-300":"border-rose-700 bg-rose-950/20 text-rose-200")}>{state.message}</p>}
  <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white disabled:opacity-50"><Save size={18}/>{pending?"Đang lưu":"Lưu cấu hình AI"}</button>
 </form>;
}
