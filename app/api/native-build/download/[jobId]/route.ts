import {NextRequest,NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {createClient} from "@/lib/supabase/server";
import {createR2Client,r2Bucket} from "@/lib/native-build-r2";
export const runtime="nodejs";
export async function GET(_request:NextRequest,{params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(jobId))return new Response("Invalid job",{status:400});
 const db=await createClient(),{data:{user},error:auth}=await db.auth.getUser();
 if(auth||!user)return new Response("Unauthorized",{status:401});
 const {data:job}=await db.from("build_jobs").select("id,project_id,status,artifact_key").eq("id",jobId).maybeSingle();
 if(!job||job.status!=="completed"||!job.artifact_key)return new Response("Not ready",{status:404});
 const {data:owner}=await db.from("projects").select("id").eq("id",job.project_id).eq("owner_id",user.id).maybeSingle();
 if(!owner)return new Response("Forbidden",{status:403});
 try{
  const url=await getSignedUrl(createR2Client(),new GetObjectCommand({Bucket:r2Bucket(),Key:job.artifact_key}),{expiresIn:300});
  const response=NextResponse.redirect(url,302);response.headers.set("Cache-Control","no-store, private");return response;
 }catch{return new Response("R2 not available",{status:503});}
}
