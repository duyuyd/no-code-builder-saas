import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,Gamepad2,Map,Plus} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene} from "@/lib/game-scene";
import GameStage from "@/components/GameStage";
export const dynamic="force-dynamic";
export const metadata={title:"Chơi thử game 2D · No-Code Studio"};
export default async function DemoGame({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-z0-9-]{3,80}$/.test(code))notFound();
 const db=await createClient();
 const {data:template,error}=await db.from("game_scene_templates").select("code,name,genre,description,scene").eq("code",code).eq("is_active",true).maybeSingle();
 if(error||!template||!validateGameScene(template.scene))notFound();
 return <main className="min-h-dvh bg-[#0b1323] px-3 py-6 text-white sm:px-6">
  <div className="mx-auto max-w-5xl">
   <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/game-maps" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={17}/> Kho bản đồ</Link><Link href="/dashboard?kind=game#start" className="flex items-center gap-2 rounded-xl border border-orange-500/60 px-4 py-2.5 text-xs font-bold text-orange-200"><Plus size={16}/> Tạo game của tôi</Link></div>
   <div className="mb-6"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300"><Map size={17}/>{template.genre} · {template.scene.mode==="combat"?"Core PvE":"Core thu thập"}</p>
    <h1 className="mt-2 flex items-center gap-3 text-2xl font-black sm:text-3xl"><Gamepad2 size={28}/>{template.name}</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{template.description}</p>
   </div>
   <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-3 sm:p-6"><GameStage scene={template.scene} mode="play"/></section>
   <p className="mt-4 text-center text-xs text-slate-400">Bản demo chạy trong trình duyệt. Không yêu cầu tải app hoặc đăng nhập. Chơi được bằng phím và cảm ứng.</p>
  </div>
 </main>;
}
