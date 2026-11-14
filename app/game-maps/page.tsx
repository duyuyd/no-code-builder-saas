import Link from "next/link";
import {Gamepad2,ArrowLeft,ExternalLink,Map,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene,type GameScene} from "@/lib/game-scene";
export const dynamic="force-dynamic";
export const metadata={title:"Kho bản đồ và game chơi thử"};
export default async function GameMaps(){
 const db=await createClient();
 const {data,error}=await db.from("game_scene_templates").select("code,name,genre,description,scene").eq("is_active",true).order("genre").order("name").limit(150);
 if(error)throw new Error(error.message);
 const scenes=(data??[]).filter(row=>validateGameScene(row.scene));
 return <main className="min-h-dvh bg-[#0b1323] px-4 py-9 text-slate-100">
  <div className="mx-auto max-w-7xl">
   <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={17}/> Trang chủ Studio</Link><Link href="/resources" className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200">Kho 3D / 2D / âm thanh</Link></div>
   <div className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Game Builder 2D · Thư viện bản đồ</p>
    <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Map size={33} className="text-orange-300"/> Chọn bản đồ và chơi thử</h1>
    <p className="mt-4 text-sm leading-7 text-slate-400">Mọi bản đồ dưới đây lấy từ Supabase, cho phép chơi thử mà không phải đăng nhập. Chọn bản đồ khi tạo game trong Studio và chỉnh từng vật thể, hình ảnh, sức mạnh đối thủ.</p>
    <p className="mt-3 text-xs text-amber-200">PvE là chiến đấu với AI trên thiết bị. Chưa có kết nối multiplayer server, vật lý bóng đá thật hay giao tranh MOBA nhiều người.</p>
   </div>
   <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{scenes.length} bản đồ có thể chơi · Kho dữ liệu thật</span><Link href="/dashboard?kind=game#start" className="font-bold text-orange-300">Tạo game từ mẫu</Link></div>
   <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{scenes.map(map=>{
    const scene:GameScene=map.scene;const enemies=scene.objects.filter(o=>o.kind==="enemy").length;
    return <article key={map.code} className="flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#1b293d]">
     <div className="relative h-36 overflow-hidden border-b border-slate-700" style={{backgroundColor:scene.background,backgroundImage:scene.backgroundImageUrl?"url("+JSON.stringify(scene.backgroundImageUrl)+")":undefined,backgroundSize:"cover"}}>
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{backgroundImage:"linear-gradient(#fff3 1px,transparent 1px),linear-gradient(90deg,#fff3 1px,transparent 1px)",backgroundSize:"10% 10%"}}/>
      {scene.objects.slice(0,12).map(o=><div key={o.id} className="absolute flex items-center justify-center" style={{left:o.x+"%",top:o.y+"%",width:o.w+"%",height:o.h+"%",fontSize:"clamp(15px,2.2vw,31px)"}}>{o.imageUrl?<img src={o.imageUrl} alt={o.label} loading="lazy" className="h-full w-full object-contain"/>:o.label}</div>)}
      <span className="absolute left-3 top-3 rounded-lg bg-slate-950/85 px-3 py-1.5 text-[10px] font-bold text-orange-300">{map.genre}</span>
     </div>
     <div className="flex flex-1 flex-col p-5"><h2 className="text-lg font-black">{map.name}</h2><p className="mt-3 flex-1 text-xs leading-6 text-slate-400">{map.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300"><span className="rounded-lg bg-slate-800 px-2 py-1">{scene.objects.length} vật thể</span><span className="rounded-lg bg-slate-800 px-2 py-1">{scene.mode==="combat"?"PvE • "+enemies+" đối thủ":"Thu thập"}</span></div>
      <Link href={"/demo/game/"+encodeURIComponent(map.code)} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white"><Gamepad2 size={17}/> Chơi demo miễn phí <ExternalLink size={15}/></Link>
     </div>
    </article>;
   })}</div>
   <p className="mt-8 flex items-center gap-2 text-xs leading-6 text-slate-400"><ShieldCheck size={16}/> Bản đồ mẫu do Studio tạo, không sử dụng nhân vật, logo hoặc dữ liệu độc quyền của game thương mại.</p>
  </div>
 </main>;
}
