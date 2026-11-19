import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createClient} from "@/lib/supabase/server";
import {validateUiTree} from "@/lib/component-registry";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;

const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)
  return Response.json({ok:false,error:"Cross-origin render denied"},{status:403});
 if(Number(request.headers.get("content-length")??0)>2048)
  return Response.json({ok:false,error:"Render request too large"},{status:413});
 let raw:unknown;
 try{raw=await request.json();}
 catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return Response.json({ok:false,error:"Invalid request"},{status:400});
 const {projectId,pageId}=raw as Record<string,unknown>;
 if(typeof projectId!=="string"||typeof pageId!=="string"||!uuid.test(projectId)||!uuid.test(pageId))
  return Response.json({ok:false,error:"Invalid project or page ID"},{status:400});
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return Response.json({ok:false,error:"Sign in required"},{status:401});
 const {data:project}=await db.from("projects").select("id,name").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)return Response.json({ok:false,error:"Project not found"},{status:404});
 const {data:page}=await db.from("pages").select("id,path,ui_tree").eq("id",pageId).eq("project_id",projectId).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))
  return Response.json({ok:false,error:"Page is invalid"},{status:404});
 let directory="";
 try{
  directory=await mkdtemp(join(tmpdir(),"nuvora-render-"));
  const output=join(directory,"video.mp4");
  const {bundle}=await import("@remotion/bundler");
  const {selectComposition,renderMedia}=await import("@remotion/renderer");
  const serveUrl=await bundle({entryPoint:join(process.cwd(),"scripts/remotion-entry.tsx")});
  const inputProps={projectName:project.name,pagePath:page.path,nodes:page.ui_tree};
  const composition=await selectComposition({serveUrl,id:"NuvoraDemo",inputProps});
  if(composition.durationInFrames!==450||composition.fps!==30)
   throw new Error("Composition must be exactly 15 seconds at 30 FPS");
  await renderMedia({composition,serveUrl,codec:"h264",outputLocation:output,inputProps,videoBitrate:"4M"});
  const bytes=await readFile(output);
  if(bytes.length<1024||bytes.toString("ascii",4,8)!=="ftyp")
   throw new Error("Renderer did not create a valid MP4 container");
  return new Response(new Uint8Array(bytes),{
   status:200,
   headers:{"Content-Type":"video/mp4","Content-Disposition":"attachment; filename=\"nuvoracraft-demo.mp4\"",
    "Content-Length":String(bytes.length),"Cache-Control":"private, no-store"}
  });
 }catch(e){
  const message=e instanceof Error?e.message:"Render failed";
  // Do not expose internal paths or environment values in API errors.
  return Response.json({ok:false,error:"MP4 rendering unavailable",detail:/ENOSPC|ENOENT|Chromium|browser/i.test(message)?"Renderer runtime is missing its browser or file dependencies":"Please verify self-hosted Node render support"},{status:503});
 }finally{
  if(directory)await rm(directory,{recursive:true,force:true}).catch(()=>undefined);
 }
}
