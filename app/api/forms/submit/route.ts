import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Invalid request origin"},{status:403});
 const length=Number(request.headers.get("content-length")??0);
 if(length>13000)return Response.json({error:"Form payload too large"},{status:413});
 let body:unknown;
 try{body=await request.json();}catch{return Response.json({error:"Malformed JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"Invalid payload"},{status:400});
 const input=body as Record<string,unknown>;
 if(typeof input.projectId!=="string"||!uuid.test(input.projectId)||typeof input.nodeId!=="string"||!/^[-_a-z0-9]{1,100}$/i.test(input.nodeId)||
    !input.values||typeof input.values!=="object"||Array.isArray(input.values)||JSON.stringify(input.values).length>12000)
  return Response.json({error:"Invalid form input"},{status:400});
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(!user||auth)return Response.json({error:"Sign in required to submit a form"},{status:401});
  const {data,error}=await db.rpc("submit_nuvora_form",{p_project_id:input.projectId,p_node_id:input.nodeId,p_values:input.values});
  if(error)return Response.json({error:error.message},{status:400});
  return Response.json({ok:true,submissionId:data},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Form service temporarily unavailable"},{status:503});}
}
