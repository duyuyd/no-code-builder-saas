"use server";
import {createClient} from "@/lib/supabase/server";
import {readAiConfig,aiIsAvailable,askProvider} from "@/lib/studio-ai";
import {compileNpcBehavior,validateNpcBehavior,type NpcBehavior} from "@/lib/npc-behavior";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type LogicResult={ok:true;id:string;source:string;behavior:NpcBehavior;provider:string}|{ok:false;error:string};
function decodeBehavior(response:string):NpcBehavior {
 let content=response.trim();
 const fenced=content.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
 if(fenced)content=fenced[1];
 let value:unknown;
 try{value=JSON.parse(content);}catch{throw new Error("Nhà cung cấp không trả JSON logic hợp lệ.");}
 if(!validateNpcBehavior(value))throw new Error("Logic NPC không đúng định dạng hoặc dùng hành động chưa được hỗ trợ.");
 return value;
}
export async function generateNpcLogic(projectId:string,prompt:string):Promise<LogicResult>{
 if(!uuid.test(projectId)||typeof prompt!=="string"||prompt.trim().length<10||prompt.length>2000)
  return {ok:false,error:"Prompt phải có từ 10 đến 2000 ký tự."};
 try{
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return {ok:false,error:"Cần đăng nhập lại."};
  const {data:project}=await db.from("projects").select("id,name").eq("id",projectId).eq("owner_id",user.id).maybeSingle();
  if(!project)return {ok:false,error:"Không có quyền với dự án này."};
  const {data:setting,error:settingError}=await db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle();
  if(settingError)return {ok:false,error:"Không thể tải cấu hình AI."};
  const config=readAiConfig(setting?.value);
  if(!aiIsAvailable(config))return {ok:false,error:"AI chưa được Admin kích hoạt hoặc chưa cấu hình API key. Không sử dụng nội dung giả lập."};
  const {data:allowed,error:quotaError}=await db.rpc("studio_ai_claim_slot");
  if(quotaError||allowed!==true)return {ok:false,error:"Đã hết hạn mức AI được Admin cho phép."};
  const {data:entry,error:insertError}=await db.from("studio_ai_prompts")
   .insert({project_id:projectId,created_by:user.id,prompt:prompt.trim(),status:"queued"})
   .select("id").single();
  if(insertError||!entry)return {ok:false,error:insertError?.message??"Không lưu được prompt."};
  try{
   const result=await askProvider(config,`Bạn tạo logic NPC cho ứng dụng game bằng một đồ thị trạng thái an toàn.
Chỉ trả JSON thuần KHÔNG markdown, đúng cấu trúc:
{"schemaVersion":1,"initialState":"patrol","states":[{"id":"patrol","action":"patrol"},{"id":"combat","action":"attack"}],"transitions":[{"from":"patrol","to":"combat","event":"enemy_seen"}]}
Các action hợp lệ: idle,patrol,attack,retreat. Các event hợp lệ: enemy_seen,enemy_lost,patrol_done,low_health,recover.
State ID chỉ dùng chữ a-z, số, dấu gạch dưới. Không trả mã JavaScript trực tiếp. Không tạo tính năng ngoài danh sách.`,
    [{role:"user",content:prompt.trim()}]);
   const behavior=decodeBehavior(result);
   const source=compileNpcBehavior(behavior);
   const {error:upErr}=await db.from("studio_ai_prompts")
     .update({proposal:{schemaVersion:1,behavior,source,provider:config.provider},status:"proposed",updated_at:new Date().toISOString()})
     .eq("id",entry.id).eq("created_by",user.id);
   if(upErr)throw new Error(upErr.message);
   return {ok:true,id:entry.id,source,behavior,provider:config.provider};
  }catch(error){
   await db.from("studio_ai_prompts").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",entry.id).eq("created_by",user.id);
   return {ok:false,error:error instanceof Error?error.message:"Không tạo được logic NPC."};
  }
 }catch{
  return {ok:false,error:"Không kết nối được Supabase hoặc dịch vụ AI."};
 }
}

export async function approveNpcLogic(id:string):Promise<{ok:true}|{ok:false;error:string}>{
 if(!uuid.test(id))return {ok:false,error:"Mã logic không hợp lệ."};
 try{
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return {ok:false,error:"Bạn cần đăng nhập."};
  const {data:entry,error}=await db.from("studio_ai_prompts").select("id,project_id,proposal,status").eq("id",id).single();
  if(error||!entry||entry.status!=="proposed")return {ok:false,error:"Logic không tồn tại hoặc chưa sẵn sàng."};
  const {data:project}=await db.from("projects").select("id").eq("id",entry.project_id).eq("owner_id",user.id).single();
  if(!project)return {ok:false,error:"Bạn không có quyền phê duyệt."};
  if(!entry.proposal||typeof entry.proposal!=="object"||Array.isArray(entry.proposal))
   return {ok:false,error:"Dữ liệu logic không hợp lệ."};
  const proposal=entry.proposal as {behavior?:unknown;source?:unknown};
  if(!validateNpcBehavior(proposal.behavior)||proposal.source!==compileNpcBehavior(proposal.behavior))
   return {ok:false,error:"Logic cần được tạo lại trước khi phê duyệt."};
  const {data, error:updateError}=await db.from("studio_ai_prompts").update({status:"approved",updated_at:new Date().toISOString()})
    .eq("id",id).eq("status","proposed").select("id").maybeSingle();
  if(updateError||!data)return {ok:false,error:updateError?.message??"Logic đã thay đổi trước khi phê duyệt."};
  return {ok:true};
 }catch{return {ok:false,error:"Không thể phê duyệt vì mất kết nối."};}
}
