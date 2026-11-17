"use server";
import {createClient} from "@/lib/supabase/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type BuildRow={id:string;platform:string;status:string;error_message:string|null;artifact_key:string|null;created_at:string};
export async function listNativeBuilds(projectId:string):Promise<{ok:true;jobs:BuildRow[]}|{ok:false;error:string}>{
 if(!UUID.test(projectId))return {ok:false,error:"Dự án không hợp lệ."};
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(auth||!user)return {ok:false,error:"Hãy đăng nhập lại."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).maybeSingle();
  if(!project)return {ok:false,error:"Không có quyền xem build."};
  const {data,error}=await db.from("build_jobs").select("id,platform,status,error_message,artifact_key,created_at")
    .eq("project_id",projectId).order("created_at",{ascending:false}).limit(20);
  return error?{ok:false,error:error.message}:{ok:true,jobs:(data??[]) as BuildRow[]};
 }catch{return {ok:false,error:"Không thể tải lịch sử build."};}
}
export async function requestNativeBuild(projectId:string,platform:"android"|"ios"):Promise<{ok:true;id:string}|{ok:false;error:string}>{
 if(!UUID.test(projectId)||!["android","ios"].includes(platform))return {ok:false,error:"Yêu cầu không hợp lệ."};
 if(!process.env.GITHUB_BUILD_TOKEN||!process.env.STUDIO_RUNNER_TOKEN||!process.env.SUPABASE_SERVICE_ROLE_KEY||
  !process.env.R2_ACCOUNT_ID||!process.env.R2_BUCKET||!process.env.R2_ACCESS_KEY_ID||!process.env.R2_SECRET_ACCESS_KEY)
  return {ok:false,error:"Pipeline chưa được cấu hình GitHub, Supabase service role và R2. Không có build ảo được tạo."};
 if(platform==="ios"&&process.env.ENABLE_IOS_BUILDS!=="true")
  return {ok:false,error:"iOS chưa bật do thiếu cấu hình chứng chỉ Apple/Expo hoặc chưa cho phép sử dụng runner iOS."};
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(auth||!user)return {ok:false,error:"Phiên đăng nhập đã hết hạn."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"Không sở hữu dự án này."};
  const {data:pages}=await db.from("pages").select("id").eq("project_id",projectId).limit(1);
  if(!pages?.length)return {ok:false,error:"Dự án chưa có trang để build."};
  const {count}=await db.from("build_jobs").select("id",{count:"exact",head:true}).eq("project_id",projectId).in("status",["queued","running"]);
  if((count??0)>=2)return {ok:false,error:"Đã có tối đa 2 build đang chờ hoặc đang chạy."};
  const {data:job,error:insert}=await db.from("build_jobs").insert({project_id:projectId,platform,status:"queued"}).select("id").single();
  if(insert||!job)return {ok:false,error:insert?.message??"Không tạo được job."};
  let status=503;
  try{
   const response=await fetch("https://api.github.com/repos/duyuyd/no-code-builder-saas/actions/workflows/native-build.yml/dispatches",{
    method:"POST",headers:{authorization:"Bearer "+process.env.GITHUB_BUILD_TOKEN,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28","content-type":"application/json"},
    body:JSON.stringify({ref:"main",inputs:{job_id:job.id,platform}}),cache:"no-store",signal:AbortSignal.timeout(10000)
   });status=response.status;
  }catch{/* failure recorded below */}
  const admin=privilegedSupabase();
  if(status!==204){
   await admin.from("build_jobs").update({status:"failed",error_message:"GitHub dispatch HTTP "+status}).eq("id",job.id).eq("status","queued");
   return {ok:false,error:"GitHub Actions không nhận yêu cầu (HTTP "+status+")."};
  }
  await admin.from("build_jobs").update({github_dispatch_at:new Date().toISOString()}).eq("id",job.id);
  return {ok:true,id:job.id};
 }catch{return {ok:false,error:"Không kết nối được GitHub/Supabase."};}
}
