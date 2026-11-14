import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,Gamepad2,Layers3,Shield,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateArenaMap} from "@/lib/moba-arena";
import MobaStage from "@/components/MobaStage";
export const dynamic="force-dynamic";
export const metadata={title:"Chiến trường 5v5 PvE · Studio MOBA"};
export default async function MobaPage({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-z0-9-]{3,80}$/.test(code))notFound();
 const db=await createClient();
 const {data,error}=await db.from("moba_maps").select("code,name,description,config").eq("code",code).eq("is_active",true).maybeSingle();
 if(error||!data||!validateArenaMap(data.config))notFound();
 return <main className="min-h-dvh bg-[#080f1f] px-2 py-5 text-white sm:px-6 sm:py-8">
  <div className="mx-auto max-w-[1500px]">
   <header className="mb-6 flex flex-wrap items-center justify-between gap-3 px-2">
    <Link href="/game-maps" className="flex items-center gap-2 text-xs font-bold text-orange-300"><ArrowLeft size={17}/> Chọn bản đồ khác</Link>
    <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-orange-500/50 px-4 py-2.5 text-xs font-bold text-orange-300"><Gamepad2 size={16}/> Studio của tôi</Link>
   </header>
   <div className="mb-5 rounded-2xl border border-slate-700 bg-gradient-to-br from-[#172b3f] to-[#1c2237] p-5 sm:p-7">
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-400"><Users size={18}/> MOBA chiến thuật · 5v5 PvE • Không cần tài khoản</p>
    <h1 className="mt-3 text-2xl font-black sm:text-4xl">{data.name}</h1>
    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{data.description} Điều khiển nhân vật xanh, phối hợp 4 đồng đội AI chống 5 đối thủ AI. Tiêu diệt lính, phá trụ, tiến tới nhà chính đối phương.</p>
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300"><span className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2"><Layers3 size={16}/> 3 đường • rừng • sông</span><span className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2"><Shield size={16}/> 12 trụ + 2 nhà chính</span><span className="rounded-lg bg-slate-900 px-3 py-2">Joystick • kỹ năng • minimap</span></div>
   </div>
   <MobaStage key={data.code} map={data.config} name={data.name}/>
  </div>
 </main>;
}
