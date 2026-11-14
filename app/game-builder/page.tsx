import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {ArrowLeft,Gamepad2} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene,type GameScene,type GameSceneTemplate} from "@/lib/game-scene";
import GameWorkspace from "@/components/GameWorkspace";
export const dynamic="force-dynamic";
export const metadata={title:"Game Builder 2D",robots:{index:false,follow:false}};
export default async function GameBuilderPage({searchParams}:{searchParams:Promise<{project?:string}>}){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {data:projects,error}=await db.from("projects").select("id,name").eq("owner_id",user.id).eq("kind","game").is("archived_at",null).order("created_at",{ascending:false});
 if(error)throw new Error(error.message);
 const requested=(await searchParams).project;
 const project=requested?(projects??[]).find(p=>p.id===requested):(projects??[])[0];
 if(requested&&!project)notFound();
 if(!project)return <main className="min-h-dvh bg-[#0f172a] px-5 py-12 text-slate-100"><div className="mx-auto max-w-lg rounded-3xl border border-slate-700 bg-[#1e293b] p-8">
  <Gamepad2 className="mb-5 text-orange-400" size={42}/><h1 className="text-3xl font-bold">Game Builder 2D</h1><p className="my-4 text-sm text-slate-300">Tạo một dự án loại Game trong Builder, sau đó trở lại đây để xây dựng màn chơi 2D.</p>
  <Link href="/builder" className="inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold">Đến Builder để tạo game</Link>
 </div></main>;
 const [{data:game,error:gameError},{data:starter,error:starterError},{data:publication},templateResult]=await Promise.all([
  db.from("game_projects").select("scene,version").eq("project_id",project.id).maybeSingle(),
  db.from("platform_settings").select("value").eq("key","game_starter_scene").maybeSingle(),
  db.from("game_publications").select("is_live").eq("project_id",project.id).maybeSingle(),
  db.from("game_scene_templates").select("code,name,genre,description,scene").eq("is_active",true).order("name")
 ]);
 if(gameError)throw new Error(gameError.message);
 if(starterError)throw new Error(starterError.message);
 if(templateResult.error)throw new Error(templateResult.error.message);
 const scene=game?.scene??starter?.value;
 if(!validateGameScene(scene))throw new Error("Mẫu màn chơi không hợp lệ; Admin cần cập nhật game_starter_scene trong platform_settings.");
 return <div className="min-h-dvh bg-[#0f172a]">
  <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-5">
   <div className="flex flex-wrap items-center gap-3"><Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-orange-300"><ArrowLeft size={14}/> Trang chủ Studio</Link>
    <form method="GET" action="/game-builder" className="ml-auto">
     <select name="project" defaultValue={project.id} aria-label="Đổi dự án game" className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white">{(projects??[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
     <button className="ml-2 rounded-lg border border-orange-600 px-3 py-2 text-xs text-orange-300">Mở</button>
    </form>
   </div>
  </div>
  <GameWorkspace key={project.id} userId={user.id} templates={(templateResult.data??[]).filter(t=>validateGameScene(t.scene)) as GameSceneTemplate[]} projectId={project.id} projectName={project.name} initialScene={scene as GameScene} initialVersion={game?.version??0} initialPublished={publication?.is_live===true}/>
 </div>;
}
