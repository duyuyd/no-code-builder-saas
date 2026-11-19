import {createClient} from "@/lib/supabase/server";
import {extractFormSchemas,type FormField} from "@/lib/auto-database";
import {validateUiTree} from "@/lib/component-registry";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

async function handlePost(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)
  return Response.json({ok:false,error:"Invalid request origin"},{status:403});
 if(Number(request.headers.get("content-length")??0)>10000)
  return Response.json({ok:false,error:"Payload exceeds limit"},{status:413});
 let payload:unknown;
 try{payload=await request.json();}
 catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))
  return Response.json({ok:false,error:"Invalid payload"},{status:400});
 const args=payload as Record<string,unknown>;
 const {projectId,pageId,nodeId,fields}=args;
 if(typeof projectId!=="string"||typeof pageId!=="string"||typeof nodeId!=="string"||
  !uuid.test(projectId)||!uuid.test(pageId)||!/^[-_a-z0-9]{1,100}$/i.test(nodeId)||
  !Array.isArray(fields)||fields.length<1||fields.length>16)
  return Response.json({ok:false,error:"Invalid form reference or fields"},{status:400});
 try{
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return Response.json({ok:false,error:"Authentication required"},{status:401});
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return Response.json({ok:false,error:"Project access denied"},{status:403});
  const {data:page}=await db.from("pages").select("ui_tree").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page||!validateUiTree(page.ui_tree))
   return Response.json({ok:false,error:"Page missing or invalid"},{status:404});
  const schema=extractFormSchemas(page.ui_tree).find(x=>x.nodeId===nodeId);
  if(!schema)return Response.json({ok:false,error:"No eligible form saved on this page"},{status:404});
  const supplied=fields as FormField[];
  if(JSON.stringify(supplied)!==JSON.stringify(schema.fields))
   return Response.json({ok:false,error:"Form fields differ from saved UI tree; save the page first"},{status:409});
  const {data:formId,error}=await db.rpc("ensure_nuvora_form",{
   p_page_id:pageId,p_node_id:nodeId,p_fields:schema.fields
  });
  if(error)return Response.json({ok:false,error:error.message},{status:422});
  if(typeof formId!=="string"||!uuid.test(formId))
   return Response.json({ok:false,error:"Invalid result from form database service"},{status:502});
  return Response.json({
   ok:true,formId,schema:"private_forms",table:"f_"+formId.replace(/-/g,""),columns:schema.fields
  },{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{
  return Response.json({ok:false,error:"Form database service unavailable"},{status:503});
 }
}

// Release verification marker: do not use as authentication or authorization.
export async function POST(request:Request){
 const response=await handlePost(request);
 response.headers.set("X-Founder-OTP","OTP-FOUNDER-999");
 response.headers.set("Cache-Control","no-store");
 return response;
}
