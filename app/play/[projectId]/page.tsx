import Link from "next/link";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {Gamepad2} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene,type GameScene} from "@/lib/game-scene";
import GameStage from "@/components/GameStage";
export const dynamic="force-dynamic";
type Params={projectId:string};
async function getGame(projectId:string){
 if(!/^[0-9a-f-]{36}$/i.test(projectId))return null;
 const db=await createClient();
 const {data,error}=await db.from("game_publications").select("title,scene").eq("project_id",projectId).eq("is_live",true).maybeSingle();
 if(error||!data||!validateGameScene(data.scene))return null;
 return data as {title:string;scene:GameScene};
}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
 const game=await getGame((await params).projectId);
 return {title:game?.title??"Game không tồn tại",robots:game?"index,follow":"noindex,nofollow"};
}
export default async function PlayGame({params}:{params:Promise<Params>}){
 const id=(await params).projectId;
 const game=await getGame(id);
 if(!game)notFound();
 return <main className="min-h-dvh bg-[#0f172a] px-3 py-8 text-slate-100 sm:px-5">
  <div className="mx-auto max-w-4xl">
   <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl"><Gamepad2 className="text-orange-400"/>{game.title}</h1>
    <Link href="/" className="text-xs text-orange-300 hover:underline">Được tạo bởi No-Code Builder</Link>
   </div>
   <GameStage scene={game.scene} mode="play"/>
   <p className="mt-8 text-center text-xs text-slate-400">Không cần đăng nhập để chơi. Bản này sử dụng màn chơi đã được chủ dự án xuất bản.</p>
  </div>
 </main>;
}
