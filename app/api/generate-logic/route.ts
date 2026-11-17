import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getOpenAI,openAIHttpError} from "@/lib/openai";
import {readAiConfig} from "@/lib/studio-ai";
import {compileNpcBehavior,validateNpcBehavior} from "@/lib/npc-behavior";
export const runtime="nodejs";export const dynamic="force-dynamic";
const uuid=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function POST(req:NextRequest){
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin rejected"},{status:403});
 let raw:unknown;try{raw=await req.json();}catch{return NextResponse.json({error:"Malformed JSON"},{status:400});}
 const {projectId,prompt}=(raw??{}) as {projectId?:unknown;prompt?:unknown};
 if(typeof projectId!=="string"||!uuid.test(projectId)||typeof prompt!=="string"||prompt.trim().length<10||prompt.length>2000)
  return NextResponse.json({error:"Invalid project or prompt (10-2000 characters)"},{status:400});
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return NextResponse.json({error:"Project access denied"},{status:403});
  const {data:setting}=await db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle();
  const config=readAiConfig(setting?.value);
  if(!config.enabled||config.provider!=="openai"||!process.env.OPENAI_API_KEY)return NextResponse.json({error:"OpenAI is not enabled by Admin"},{status:503});
  const {data:allowed,error:quotaError}=await db.rpc("studio_ai_claim_slot");
  if(quotaError||allowed!==true)return NextResponse.json({error:"Daily AI quota reached"},{status:429});
  const {data:entry,error:insert}=await db.from("studio_ai_prompts").insert({project_id:projectId,created_by:user.id,prompt:prompt.trim(),status:"queued"}).select("id").single();
  if(insert||!entry)return NextResponse.json({error:"Could not save NPC request"},{status:503});
  try{
   const completion=await getOpenAI().chat.completions.create({
    model:"gpt-4o-mini",max_tokens:config.maxOutputTokens,response_format:{type:"json_object"},store:false,
    messages:[{role:"system",content:"Design safe NPC game logic as JSON only. schemaVersion must equal 1; initialState is a state ID; states is array of {id,action}; transitions is array of {from,to,event}. Allowed action: idle,patrol,attack,retreat. Allowed event: enemy_seen,enemy_lost,patrol_done,low_health,recover. IDs lowercase alphanumerics and underscore, max 16 states. Do not produce raw executable JavaScript."},{role:"user",content:prompt.trim()}]
   });
   const text=completion.choices[0]?.message?.content;
   if(!text)throw Error("OpenAI returned no NPC graph");
   let candidate:unknown;try{candidate=JSON.parse(text);}catch{throw Error("OpenAI returned invalid JSON");}
   if(!validateNpcBehavior(candidate))throw Error("NPC behavior graph invalid or unsupported");
   const source=compileNpcBehavior(candidate);
   const {error:update}=await db.from("studio_ai_prompts").update({proposal:{schemaVersion:1,behavior:candidate,source,provider:"openai"},status:"proposed",updated_at:new Date().toISOString()}).eq("id",entry.id).eq("created_by",user.id);
   if(update)throw Error("Unable to store generated NPC logic");
   return NextResponse.json({ok:true,id:entry.id,source,behavior:candidate,provider:"openai"},{headers:{"cache-control":"no-store"}});
  }catch(e){
   await db.from("studio_ai_prompts").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",entry.id);
   throw e;
  }
 }catch(e){const x=openAIHttpError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
