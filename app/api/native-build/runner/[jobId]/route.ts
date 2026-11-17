import "server-only";
import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import JSZip from "jszip";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {generateReactNativeSource} from "@/lib/native-generator";
import {validateUiTree} from "@/lib/component-registry";
import {createR2Client,r2ObjectKey,r2Bucket} from "@/lib/native-build-r2";
import {HeadObjectCommand,PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{jobId:string}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function authenticate(req:NextRequest,ctx:Ctx){
 const {jobId}=await ctx.params;
 const token=process.env.STUDIO_RUNNER_TOKEN??"";
 const supplied=req.headers.get("authorization")?.replace(/^Bearer /i,"")??"";
 if(!uuid.test(jobId)||token.length<32||supplied.length!==token.length||
  !timingSafeEqual(Buffer.from(supplied),Buffer.from(token)))return null;
 const db=privilegedSupabase();
 const {data:job,error}=await db.from("build_jobs").select("id,project_id,status,platform").eq("id",jobId).maybeSingle();
 return error||!job?null:{db,job};
}
export async function GET(req:NextRequest,ctx:Ctx){
 const auth=await authenticate(req,ctx);
 if(!auth)return new Response("Unauthorized",{status:401});
 const {db,job}=auth;
 if(!["queued","running"].includes(job.status))return new Response("Inactive build",{status:409});
 const [{data:project},{data:pages,error}]=await Promise.all([
  db.from("projects").select("id,name,archived_at").eq("id",job.project_id).single(),
  db.from("pages").select("path,ui_tree").eq("project_id",job.project_id).order("path").limit(50)
 ]);
 if(!project||project.archived_at||error||!pages?.length||pages.some(p=>!validateUiTree(p.ui_tree)))
  return new Response("Invalid project snapshot",{status:422});
 const slug="npt"+project.id.replace(/-/g,"").slice(0,12);
 const zip=new JSZip();
 zip.file("App.tsx",generateReactNativeSource(pages));
 zip.file("index.js","import {registerRootComponent} from 'expo';\nimport App from './App';\nregisterRootComponent(App);\n");
 zip.file("package.json",JSON.stringify({name:slug,version:"1.0.0",private:true,main:"index.js",scripts:{start:"expo start"},dependencies:{expo:"58.0.25",react:"19.3.0","react-native":"0.88.0"},devDependencies:{typescript:"5.9.3","@types/react":"19.3.0"}},null,2));
 zip.file("app.json",JSON.stringify({expo:{name:project.name.slice(0,60),slug,version:"1.0.0",android:{package:"vn.nptduy."+slug},ios:{bundleIdentifier:"vn.nptduy."+slug}}},null,2));
 zip.file("tsconfig.json",JSON.stringify({extends:"expo/tsconfig.base",compilerOptions:{strict:true}},null,2));
 const bytes=await zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
 return new Response(Uint8Array.from(bytes).buffer,{headers:{"content-type":"application/zip","cache-control":"no-store,private"}});
}
export async function POST(req:NextRequest,ctx:Ctx){
 const auth=await authenticate(req,ctx);
 if(!auth)return Response.json({error:"Unauthorized"},{status:401});
 const {db,job}=auth;
 const payload=await req.json().catch(()=>null) as {kind?:string;message?:string}|null;
 if(!payload)return Response.json({error:"Invalid payload"},{status:400});
 if(payload.kind==="start"){
  const {data}=await db.from("build_jobs").update({status:"running",error_message:null}).eq("id",job.id).eq("status","queued").select("id").maybeSingle();
  return data?Response.json({ok:true}):Response.json({error:"Already claimed"},{status:409});
 }
 if(payload.kind==="failed"){
  if(!["queued","running"].includes(job.status))return Response.json({error:"Inactive"},{status:409});
  const message=String(payload.message??"Native build failed").replace(/[\r\n]/g," ").slice(0,250);
  await db.from("build_jobs").update({status:"failed",error_message:message}).eq("id",job.id).in("status",["queued","running"]);
  return Response.json({ok:true});
 }
 if(job.status!=="running")return Response.json({error:"Not running"},{status:409});
 const key=r2ObjectKey(job.project_id,job.id,job.platform);
 if(payload.kind==="upload_url"){
  const contentType=job.platform==="ios"?"application/octet-stream":"application/vnd.android.package-archive";
  const url=await getSignedUrl(createR2Client(),new PutObjectCommand({Bucket:r2Bucket(),Key:key,ContentType:contentType}),{expiresIn:600});
  return Response.json({url,contentType},{headers:{"cache-control":"no-store"}});
 }
 if(payload.kind==="completed"){
  try{await createR2Client().send(new HeadObjectCommand({Bucket:r2Bucket(),Key:key}));}
  catch{return Response.json({error:"Artifact missing from R2"},{status:422});}
  const {error}=await db.from("build_jobs").update({status:"completed",artifact_key:key,error_message:null}).eq("id",job.id).eq("status","running");
  return error?Response.json({error:"Status write failed"},{status:500}):Response.json({ok:true});
 }
 return Response.json({error:"Unknown operation"},{status:400});
}
