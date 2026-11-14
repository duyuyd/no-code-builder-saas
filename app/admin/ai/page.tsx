import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,Activity,BrainCircuit,ExternalLink,KeyRound,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {providerKey,readAiConfig,type AiProvider} from "@/lib/studio-ai";
import AdminAiForm from "@/components/AdminAiForm";

export const dynamic="force-dynamic";
export const metadata={title:"Cấu hình trợ lý AI Studio",robots:{index:false,follow:false}};
export default async function AdminAiPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")notFound();
 const [setting,usage]=await Promise.all([
  db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle(),
  db.rpc("studio_ai_admin_usage")
 ]);
 if(setting.error)throw new Error(setting.error.message);
 const config=readAiConfig(setting.data?.value);
 const keys:Record<AiProvider,boolean>={gemini:!!providerKey("gemini"),deepseek:!!providerKey("deepseek"),openai:!!providerKey("openai"),orcarouter:!!providerKey("orcarouter")};
 const today=usage.data?.[0] as {usage_date?:string;global_requests?:number;total_users?:number}|undefined;
 const variables:[AiProvider,string,string,string][]=[
  ["gemini","GEMINI_API_KEY","https://aistudio.google.com/apikey","Google AI Studio"],
  ["deepseek","DEEPSEEK_API_KEY","https://platform.deepseek.com/api_keys","DeepSeek Platform"],
  ["openai","OPENAI_API_KEY","https://platform.openai.com/api-keys","OpenAI Platform"],\n  ["orcarouter","ORCAROUTER_API_KEY","https://www.orcarouter.ai/console","OrcaRouter (Free)"]
 ];
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-7 text-slate-100 sm:px-6">
  <div className="mx-auto max-w-5xl">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-orange-300"><ArrowLeft size={17}/> Trung tâm quản trị</Link>
    <Link href="/builder" className="text-xs text-slate-400 underline">Studio Builder</Link>
   </div>
   <header className="mt-8">
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-orange-400"><BrainCircuit size={19}/> Tính năng do Admin kiểm soát</p>
    <h1 className="mt-2 text-2xl font-black sm:text-4xl">Trợ lý AI đa nhà cung cấp</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Thay trả lời mẫu bằng hội thoại Gemini, DeepSeek, OpenAI hoặc OrcaRouter Free. AI đọc cấu trúc trang, khối đang chọn, bản đồ và các lượt chat gần đây từ dự án thật; không dùng dữ liệu giả và không tự sửa công trình.</p>
   </header>
   <div className="mt-6 grid gap-3 sm:grid-cols-3">
    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><Activity className="mb-3 text-orange-300" size={22}/><p className="text-xs text-slate-400">Lượt AI hôm nay (UTC)</p><p className="mt-2 text-2xl font-black">{usage.error?"—":today?.global_requests??0}</p></div>
    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><ShieldCheck className="mb-3 text-orange-300" size={22}/><p className="text-xs text-slate-400">Tài khoản đã dùng AI hôm nay</p><p className="mt-2 text-2xl font-black">{usage.error?"—":today?.total_users??0}</p></div>
    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><KeyRound className="mb-3 text-orange-300" size={22}/><p className="text-xs text-slate-400">Khóa API đã cấu hình</p><p className="mt-2 text-2xl font-black">{Object.values(keys).filter(Boolean).length}/4</p></div>
   </div>
   <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.75fr)]">
    <div><AdminAiForm initial={config} keys={keys}/></div>
    <aside className="h-max space-y-4 rounded-2xl border border-slate-700 bg-[#1a283e] p-5">
     <h2 className="text-base font-black">Lấy API key và cấu hình an toàn</h2>
     <p className="text-xs leading-6 text-slate-300">Chỉ cần chọn <strong>một</strong> nhà cung cấp. Bạn chủ động tạo khóa trong tài khoản nhà cung cấp và quản lý hạn mức thanh toán ở đó.</p>
     <div className="space-y-3">{variables.map(([provider,key,url,name])=><div key={provider} className="rounded-xl border border-slate-600 bg-[#0e1a2d] p-3">
      <div className="flex items-center justify-between gap-2 text-xs"><strong>{name}</strong><span className={keys[provider]?"text-emerald-300":"text-amber-300"}>{keys[provider]?"Đã cấu hình biến khóa":"Chưa có khóa"}</span></div>
      <code className="mt-2 block break-all text-[11px] text-orange-200">{key}</code>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 underline">Tạo khóa tại nhà cung cấp <ExternalLink size={13}/></a>
     </div>)}</div>
     <div className="space-y-3 border-t border-slate-700 pt-4 text-xs leading-6 text-slate-300">
      <p><strong>1.</strong> Vào <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-orange-300 underline">Vercel Dashboard</a> → dự án <code>no-code-builder-saas</code> → <strong>Settings → Environment Variables</strong>.</p>
      <p><strong>2.</strong> Thêm đúng tên biến ở trên, nhập khóa ở ô Value, đặt phạm vi Production (thêm Preview nếu cần), chọn lưu dạng secret.</p>
      <p><strong>3.</strong> Redeploy nhánh <code>main</code> để Production nhận biến mới, sau đó quay lại đây và bật nhà cung cấp tương ứng.</p>
      <p><strong>4.</strong> Mở Builder, chạm Trợ lý. Khi hoạt động sẽ hiện tên mô hình AI thay vì “Offline”.</p>
     </div>
     <p className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-xs leading-6 text-amber-200">Không đưa API key vào chat, GitHub, ảnh màn hình hoặc trường cấu hình công khai. Chỉ đặt khóa trong Vercel.</p>
    </aside>
   </div>
  </div>
 </main>;
}
