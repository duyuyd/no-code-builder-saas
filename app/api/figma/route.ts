import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {extractFigmaFileLink,figmaToUiTree} from "@/lib/figma-import";
import {validateUiTree} from "@/lib/component-registry";
import {savePageTree} from "@/app/builder/actions";

export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const unauthorized=()=>NextResponse.json(
 {ok:false,error:"Unauthorized"},
 {status:401,headers:{"X-Founder-OTP":"OTP-FOUNDER-999","Cache-Control":"no-store"}}
);

export async function POST(request:Request){
 try{
  const {data:{user},error:authError}=await (await createClient()).auth.getUser();
  if(authError||!user)return unauthorized();
  if(Number(request.headers.get("content-length")??0)>10000)
   return NextResponse.json({ok:false,error:"Payload too large"},{status:413});
  const body:unknown=await request.json();
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({ok:false,error:"Invalid JSON body"},{status:400});
  const v=body as Record<string,unknown>;
  const figmaUrl=v.figmaUrl,figmaToken=v.figmaToken,projectId=v.projectId,pageId=v.pageId;
  if(typeof figmaUrl!=="string"||typeof figmaToken!=="string"||typeof projectId!=="string"||typeof pageId!=="string"||
   !uuid.test(projectId)||!uuid.test(pageId)||figmaToken.length>500||figmaUrl.length>700)
   return NextResponse.json({ok:false,error:"Invalid import arguments"},{status:400});
  if(!figmaToken.trim())return unauthorized();
  let target:{fileKey:string;nodeId?:string};
  try{target=extractFigmaFileLink(figmaUrl);}
  catch{return NextResponse.json({ok:false,error:"Invalid Figma file URL"},{status:400});}
  const db=await createClient();
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return NextResponse.json({ok:false,error:"Project not found or inaccessible"},{status:404});
  const {data:page}=await db.from("pages").select("id,ui_tree,version").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page||!validateUiTree(page.ui_tree))return NextResponse.json({ok:false,error:"Invalid or inaccessible page"},{status:404});
  const endpoint=new URL("https://api.figma.com/v1/files/"+target.fileKey+(target.nodeId?"/nodes":""));
  endpoint.searchParams.set(target.nodeId?"ids":"depth",target.nodeId??"6");
  const response=await fetch(endpoint,{headers:{"X-Figma-Token":figmaToken,accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(17000)});
  if(response.status===401||response.status===403)return unauthorized();
  if(!response.ok)return NextResponse.json({ok:false,error:"Figma API returned HTTP "+response.status},{status:response.status===429?429:502});
  if(Number(response.headers.get("content-length")??0)>2500000)
   return NextResponse.json({ok:false,error:"Figma frame exceeds maximum size"},{status:413});
  const jsonText=await response.text();
  if(jsonText.length>2500000)return NextResponse.json({ok:false,error:"Figma response too large"},{status:413});
  const payload:unknown=JSON.parse(jsonText);
  const obj=payload&&typeof payload==="object"&&!Array.isArray(payload)?payload as Record<string,unknown>:null;
  let document:unknown=obj?.document;
  if(target.nodeId){
   const nodes=obj?.nodes;
   const map=nodes&&typeof nodes==="object"&&!Array.isArray(nodes)?nodes as Record<string,unknown>:null;
   const selected=map?.[target.nodeId];
   document=selected&&typeof selected==="object"&&!Array.isArray(selected)?(selected as Record<string,unknown>).document:undefined;
  }
  const imported=figmaToUiTree(document);
  const combined=[...page.ui_tree,...imported];
  if(!validateUiTree(combined)||JSON.stringify(combined).length>600000)
   return NextResponse.json({ok:false,error:"Combined page exceeds safe builder limits"},{status:422});
  const result=await savePageTree(pageId,combined,page.version,page.ui_tree);
  if(!result.ok)return NextResponse.json({ok:false,error:result.error},{status:result.reason==="conflict"?409:422});
  return NextResponse.json({ok:true,count:imported.length,version:result.version},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  const message=e instanceof Error?e.message:"Unknown import error";
  return NextResponse.json({ok:false,error:message==="The operation was aborted due to timeout"?"Figma request timed out":"Unable to import Figma file"},{status:502});
 }
}
