"use server";
import { createClient } from "@/lib/supabase/server";
import { validateScene, type StudioScene } from "@/packages/engine-3d/src";
import { validateTimeline, type Timeline } from "@/packages/engine-4d/src";

type ReadResult = { ok:true;sceneId:string;sceneVersion:number;scene:StudioScene;timelineId:string;timelineVersion:number;timeline:Timeline } | {ok:false;error:string};
type WriteResult = {ok:true;version:number}|{ok:false;error:string};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function loadStudioScene(projectId:string,pageId:string):Promise<ReadResult>{
 if(!UUID.test(projectId)||!UUID.test(pageId))return {ok:false,error:"Mã dự án không hợp lệ."};
 try {
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return {ok:false,error:"Phiên đăng nhập không khả dụng."};
  const {data:page,error:pageError}=await db.from("pages").select("id,project_id").eq("id",pageId).eq("project_id",projectId).single();
  if(pageError||!page)return {ok:false,error:"Không có quyền truy cập trang."};
  const {data:owner,error:ownerError}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).single();
  if(ownerError||!owner)return {ok:false,error:"Không có quyền chỉnh sửa dự án."};
  let {data:scene,error:sceneError}=await db.from("studio_scenes").select("id,scene,version").eq("project_id",projectId).eq("page_id",pageId).order("created_at").limit(1).maybeSingle();
  if(sceneError)return {ok:false,error:sceneError.message};
  if(!scene){
   const initial:StudioScene={schemaVersion:1,objects:[{
    id:crypto.randomUUID(),primitive:"box",position:[0,0.65,0],rotation:[0,0,0],scale:[1.3,1.3,1.3],
    material:{color:"#ea580c",roughness:0.5,metalness:0.15}
   }]};
   const created=await db.from("studio_scenes").insert({project_id:projectId,page_id:pageId,scene:initial}).select("id,scene,version").single();
   if(created.error||!created.data)return {ok:false,error:created.error?.message??"Không tạo được scene."};
   scene=created.data;
  }
  if(!validateScene(scene.scene))return {ok:false,error:"Scene trong database không hợp lệ."};
  let {data:timeline,error:timelineError}=await db.from("studio_timelines").select("id,timeline,version").eq("scene_id",scene.id).order("created_at").limit(1).maybeSingle();
  if(timelineError)return {ok:false,error:timelineError.message};
  if(!timeline){
   const firstObject=scene.scene.objects[0];
   const fresh:Timeline={schemaVersion:1,durationMs:10000,keyframes:firstObject?[{
    id:crypto.randomUUID(),objectId:firstObject.id,path:"rotation.y",timeMs:0,value:0,interpolation:"linear"
   },{
    id:crypto.randomUUID(),objectId:firstObject.id,path:"rotation.y",timeMs:10000,value:Math.PI*2,interpolation:"linear"
   }]:[]};
   const created=await db.from("studio_timelines").insert({scene_id:scene.id,timeline:fresh}).select("id,timeline,version").single();
   if(created.error||!created.data)return {ok:false,error:created.error?.message??"Không tạo được Timeline."};
   timeline=created.data;
  }
  if(!validateTimeline(timeline.timeline))return {ok:false,error:"Timeline trong database không hợp lệ."};
  return {ok:true,sceneId:scene.id,sceneVersion:scene.version,scene:scene.scene, timelineId:timeline.id,timelineVersion:timeline.version,timeline:timeline.timeline};
 }catch{return {ok:false,error:"Không kết nối được Supabase. Hãy kiểm tra mạng và thử lại."};}
}
export async function saveStudioScene(id:string,scene:StudioScene,expectedVersion:number):Promise<WriteResult>{
 if(!UUID.test(id)||!validateScene(scene)||!Number.isSafeInteger(expectedVersion)||expectedVersion<1)return {ok:false,error:"Scene không hợp lệ."};
 try {
  const db=await createClient();
  const {data:{user},error:e}=await db.auth.getUser();if(e||!user)return {ok:false,error:"Phiên đăng nhập đã hết hạn."};
  const result=await db.from("studio_scenes").update({scene,version:expectedVersion+1,updated_at:new Date().toISOString()})
   .eq("id",id).eq("version",expectedVersion).select("version").maybeSingle();
  if(result.error)return {ok:false,error:result.error.message};
  if(!result.data)return {ok:false,error:"Scene đã được chỉnh sửa ở nơi khác. Tải lại để tránh ghi đè."};
  return {ok:true,version:result.data.version};
 }catch{return {ok:false,error:"Mất kết nối trong lúc lưu. Bản chỉnh sửa vẫn ở màn hình."};}
}
export async function saveStudioTimeline(id:string,timeline:Timeline,expectedVersion:number):Promise<WriteResult>{
 if(!UUID.test(id)||!validateTimeline(timeline)||!Number.isSafeInteger(expectedVersion)||expectedVersion<1)return {ok:false,error:"Timeline không hợp lệ."};
 try {
  const db=await createClient();const {data:{user},error:e}=await db.auth.getUser();
  if(e||!user)return {ok:false,error:"Phiên đăng nhập đã hết hạn."};
  const result=await db.from("studio_timelines").update({timeline,version:expectedVersion+1,updated_at:new Date().toISOString()})
   .eq("id",id).eq("version",expectedVersion).select("version").maybeSingle();
  if(result.error)return {ok:false,error:result.error.message};
  if(!result.data)return {ok:false,error:"Timeline đã thay đổi ở nơi khác. Tải lại để tránh ghi đè."};
  return {ok:true,version:result.data.version};
 }catch{return {ok:false,error:"Không thể lưu Timeline do mất kết nối."};}
}
