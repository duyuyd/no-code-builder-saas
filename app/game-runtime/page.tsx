import Link from "next/link";
import dynamicImport from "next/dynamic";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {validateNpcBehavior,type NpcBehavior} from "@/lib/npc-behavior";
import {validateScene,type StudioScene} from "@/packages/engine-3d/src";
const NpcRuntime=dynamicImport(()=>import("@/components/studio/NpcRuntime"),{ssr:true});
export const dynamic="force-dynamic";
export default async function GameRuntimePage({searchParams}:{searchParams:Promise<{project?:string}>}){
 const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
 if(auth||!user)redirect("/login");
 const projectId=(await searchParams).project;
 if(!projectId||!/^[a-f0-9-]{36}$/i.test(projectId))notFound();
 const {data:project,error}=await db.from("projects").select("id,name").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(error||!project)notFound();
 const [logic,scenes]=await Promise.all([
  db.from("studio_ai_prompts").select("id,proposal").eq("project_id",projectId).eq("status","approved").order("created_at").limit(30),
  db.from("studio_scenes").select("scene").eq("project_id",projectId).order("created_at").limit(1)
 ]);
 if(logic.error||scenes.error)throw new Error("Không thể tải dữ liệu runtime.");
 const behaviors:( {id:string;behavior:NpcBehavior} )[]=[];
 for(const row of logic.data??[]){
  const proposal=row.proposal&&typeof row.proposal==="object"&&!Array.isArray(row.proposal)?row.proposal as {behavior?:unknown}:null;
  if(proposal&&validateNpcBehavior(proposal.behavior))behaviors.push({id:row.id,behavior:proposal.behavior});
 }
 const saved=scenes.data?.[0]?.scene;
 const scene:StudioScene|null=validateScene(saved)?saved:null;
 return <main className="min-h-dvh bg-[#0f172a] p-3 text-slate-100 sm:p-6"><div className="mx-auto max-w-6xl space-y-4">
  <header className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-2xl font-bold">Game Runtime · {project.name}</h1><p className="text-sm text-slate-400">NPC thực thi hành vi từ trạng thái đã duyệt. Game chạy trên thiết bị, không chạy JavaScript do LLM cung cấp.</p></div><Link href={"/game-builder?project="+projectId} className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-300">Về Game Builder</Link></header>
  {!behaviors.length?<div role="status" className="rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">Dự án chưa có NPC đã phê duyệt. Hãy tạo và phê duyệt tại <Link className="underline" href={"/ai-logic?project="+projectId}>AI Logic</Link>.</div>:null}
  <NpcRuntime behaviors={behaviors} scene={scene}/>
 </div></main>;
}
