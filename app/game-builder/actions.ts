"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {validateGameScene,type GameScene} from "@/lib/game-scene";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type GameSaveResult={ok:true;version:number}|{ok:false;message:string};
export type GamePublishResult={ok:true;url:string;live:boolean}|{ok:false;message:string};
async function owner(projectId:string){
 if(!uuid.test(projectId))throw new Error("Mã dự án không hợp lệ.");
 const db=await createClient();
 const {data:{user},error:auth}=await db.auth.getUser();
 if(!user||auth)throw new Error("Vui lòng đăng nhập.");
 const {data:project,error}=await db.from("projects").select("id,name,owner_id,kind,archived_at").eq("id",projectId).maybeSingle();
 if(error||!project||project.owner_id!==user.id||project.kind!=="game"||project.archived_at)
  throw new Error("Bạn không sở hữu dự án game đang hoạt động.");
 return {db,project};
}
export async function saveGameScene(projectId:string,scene:GameScene,expectedVersion:number):Promise<GameSaveResult>{
 try{
  if(!validateGameScene(scene))throw new Error("Màn chơi không hợp lệ: cần ít nhất 1 ngôi sao và 1 đích đến.");
  if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0)throw new Error("Phiên bản không hợp lệ.");
  const {db}=await owner(projectId);
  if(expectedVersion===0){
   const {data,error}=await db.from("game_projects").insert({project_id:projectId,scene}).select("version").maybeSingle();
   if(error||!data)throw new Error(error?.code==="23505"?"Màn chơi đã được lưu ở phiên khác. Tải lại trang để tránh ghi đè.":error?.message??"Không thể lưu.");
   revalidatePath("/game-builder");
   return {ok:true,version:data.version};
  }
  const {data,error}=await db.from("game_projects").update({scene}).eq("project_id",projectId).eq("version",expectedVersion).select("version").maybeSingle();
  if(error)throw new Error(error.message);
  if(!data)throw new Error("Màn chơi đã thay đổi ở phiên khác. Dữ liệu của bạn chưa bị ghi đè. Hãy tải lại.");
  revalidatePath("/game-builder");
  return {ok:true,version:data.version};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Không thể lưu màn chơi."};}
}
export async function publishGameScene(projectId:string):Promise<GamePublishResult>{
 try{
  const {db,project}=await owner(projectId);
  const {data:game,error:loadError}=await db.from("game_projects").select("scene").eq("project_id",projectId).maybeSingle();
  if(loadError||!game||!validateGameScene(game.scene))throw new Error("Hãy lưu màn chơi hợp lệ trước khi xuất bản.");
  const {error}=await db.from("game_publications").upsert({
   project_id:projectId,scene:game.scene,title:project.name,is_live:true,published_at:new Date().toISOString()
  },{onConflict:"project_id"});
  if(error)throw new Error(error.message);
  revalidatePath("/play/"+projectId);revalidatePath("/game-builder");
  return {ok:true,live:true,url:"/play/"+projectId};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Không thể xuất bản game."};}
}
export async function unpublishGameScene(projectId:string):Promise<GamePublishResult>{
 try{
  const {db}=await owner(projectId);
  const {error}=await db.from("game_publications").update({is_live:false}).eq("project_id",projectId);
  if(error)throw new Error(error.message);
  revalidatePath("/play/"+projectId);revalidatePath("/game-builder");
  return {ok:true,live:false,url:"/play/"+projectId};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Không thể ẩn game."};}
}
