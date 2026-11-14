import Link from "next/link";
import {Gamepad2,ArrowLeft,ExternalLink,Map,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene,type GameScene} from "@/lib/game-scene";
import {validateArenaMap,type ArenaMap} from "@/lib/moba-arena";
export const dynamic="force-dynamic";
export const metadata={title:"Kho bản đồ và game chơi thử"};
export default async function GameMaps(){
 const db=await createClient();
 const [legacy,moba]=await Promise.all([
  db.from("game_scene_templates").select("code,name,genre,description,scene").eq("is_active",true).order("genre").order("name").limit(150),
  db.from("moba_maps").select("code,name,description,config").eq("is_active",true).order("name").limit(30)
 ]);
 const {data,error}=legacy;
 if(error||moba.error)throw new Error(error?.message??moba.error?.message);
 const arenas=(moba.data??[]).filter(row=>validateArenaMap(row.config));
 const scenes=(data??[]).filter(row=>validateGameScene(row.scene));
 return <main className="min-h-dvh bg-[#0b1323] px-4 py-9 text-slate-100">
  <div className="mx-auto max-w-7xl">
   <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={17}/> Trang chủ Studio</Link><Link href="/resources" className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200">Kho 3D / 2D / âm thanh</Link></div>
   <div className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Game Builder 2D · Thư viện bản đồ</p>
    <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Map size={33} className="text-orange-300"/> Chọn bản đồ và chơi thử</h1>
    <p className="mt-4 text-sm leading-7 text-slate-400">Mọi bản đồ dưới đây lấy từ Supabase, cho phép chơi thử mà không phải đăng nhập. Chọn bản đồ khi tạo game trong Studio và chỉnh từng vật thể, hình ảnh, sức mạnh đối thủ.</p>
    <p className="mt-3 text-xs text-amber-200">Có hai sân 5v5 MOBA PvE với hero AI, lính, rừng, trụ, minimap và kỹ năng thật chạy trên trình duyệt. Chưa có multiplayer server, đồ họa 3D AAA hoặc matchmaking.</p>
   </div>
   <section id="five-v-five" className="mb-10 scroll-mt-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-black sm:text-2xl">Chiến trường MOBA 5v5</h2><p className="mt-2 text-xs text-slate-400">Hai bản đồ xây riêng • 3 đường • AI đồng đội và đối phương • dùng joystick, kỹ năng và phá nhà chính</p></div><span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-200">{arenas.length} bản đồ MOBA</span></div>
    <div className="grid gap-5 md:grid-cols-2">{arenas.map(row=>{
     const map=row.config as ArenaMap;
     return <article key={row.code} className="overflow-hidden rounded-2xl border border-orange-500/30 bg-[#1b293d]">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#101b2a]">
       <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-label={"Bản đồ ba đường "+row.name}>
        <rect x="0" y="0" width="100" height="100" fill={map.palette.ground}/>
        <polyline points={map.river.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={map.palette.river} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
        {map.lanes.map(lane=><g key={lane.id}><polyline points={lane.points.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={map.palette.laneEdge} strokeWidth="11" strokeLinejoin="round" strokeLinecap="round"/><polyline points={lane.points.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={map.palette.lane} strokeWidth="7.5" strokeLinejoin="round" strokeLinecap="round"/></g>)}
        {map.bushes.map((p,i)=><circle key={"b"+i} cx={p.x} cy={p.y} r="2.8" fill={map.palette.bush}/>)}
        {map.camps.map((p,i)=><g key={"c"+i}><rect x={p.x-2} y={p.y-2} width="4" height="4" fill={map.palette.stone} stroke="#fcd34d" strokeWidth=".65"/></g>)}
        {map.lanes.map(lane=>[.23,.43,.57,.77].map((t,i)=>{const n=Math.max(1,Math.floor((lane.points.length-1)*t)),p=lane.points[n];return <circle key={lane.id+i} cx={p.x} cy={p.y} r="2.4" fill={i<2?map.palette.blue:map.palette.red} stroke="#fff" strokeWidth=".5"/>;}))}
        <circle cx={map.lanes[1].points[0].x} cy={map.lanes[1].points[0].y} r="5" fill={map.palette.blue} stroke="#e2e8f0" strokeWidth="1"/>
        <circle cx={map.lanes[1].points[map.lanes[1].points.length-1].x} cy={map.lanes[1].points[map.lanes[1].points.length-1].y} r="5" fill={map.palette.red} stroke="#e2e8f0" strokeWidth="1"/>
       </svg>
       <div className="absolute left-3 top-3 rounded-lg border border-white/20 bg-slate-950/85 px-3 py-2 text-[11px] font-black text-orange-200">5v5 PvE · {map.biome==="forest"?"Rừng":"Núi lửa"}</div>
      </div>
      <div className="p-5"><h3 className="text-lg font-black text-white">{row.name}</h3><p className="mt-2 min-h-12 text-xs leading-6 text-slate-400">{row.description}</p>
       <Link href={"/moba/"+row.code} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white"><Gamepad2 size={19}/> Vào trận đấu 5v5 <ExternalLink size={15}/></Link>
      </div>
     </article>;
    })}</div>
   </section>
   <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{scenes.length} bản đồ khởi tạo 2D · Kho dữ liệu thật</span><Link href="/dashboard?kind=game#start" className="font-bold text-orange-300">Tạo game từ mẫu</Link></div>
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
