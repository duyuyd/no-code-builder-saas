"use server";
import {createClient} from "@/lib/supabase/server";
import {readAiConfig,providerKey} from "@/lib/studio-ai";
import {parseAiWebsiteResponse} from "@/lib/ai-website-generator";
export type VisionResult={ok:true;projectId:string}|{ok:false;error:string};
function extractJsonOutput(raw:unknown,provider:"gemini"|"openai"):string{
 const r=raw as Record<string,unknown>;
 if(provider==="gemini"){
  const c=r.candidates as Array<{content?:{parts?:Array<{text?:string}>}}>|undefined;
  return c?.[0]?.content?.parts?.map(p=>p.text??"").join("")??"";
 }
 const output=r.output as Array<{type?:string;content?:Array<{type?:string;text?:string}>}>|undefined;
 return output?.filter(o=>o.type==="message").flatMap(o=>o.content??[]).filter(p=>p.type==="output_text").map(p=>p.text??"").join("")??"";
}
export async function screenshotToApp(form:FormData):Promise<VisionResult>{
 const value=form.get("screenshot");
 if(!(value instanceof File)||value.size<150||value.size>3_000_000)return {ok:false,error:"Upload one JPG, PNG or WebP screenshot (maximum 3 MB)."};
 const supported=["image/png","image/jpeg","image/webp"];
 if(!supported.includes(value.type))return {ok:false,error:"Only PNG, JPEG or WebP images are supported."};
 const data=Buffer.from(await value.arrayBuffer());
 const png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=data[0]===255&&data[1]===216&&data[2]===255;
 const webp=data.subarray(0,4).toString()==="RIFF"&&data.subarray(8,12).toString()==="WEBP";
 if(!((value.type==="image/png"&&png)||(value.type==="image/jpeg"&&jpg)||(value.type==="image/webp"&&webp)))
  return {ok:false,error:"Image file content does not match its media type."};
 const prompt=String(form.get("instruction")??"").slice(0,400);
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(auth||!user)return {ok:false,error:"Sign in before generating an editable app."};
  const {data:row}=await db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle();
  const config=readAiConfig(row?.value);
  if(!config.enabled||!(config.provider==="gemini"||config.provider==="openai")||!providerKey(config.provider))
   return {ok:false,error:"Vision requires an admin-enabled Gemini or OpenAI provider. No image is sent until configured."};
  const {data:quota,error:qerr}=await db.rpc("studio_ai_claim_slot");
  if(qerr||quota!==true)return {ok:false,error:"AI daily usage quota reached."};
  const spec=`Inspect the attached screenshot and create an EDITABLE page as JSON, no markdown: {"name":"Visual reconstruction","ui_tree":[{"type":"section","props":{"label":"Layout"},"style":{},"children":[{"type":"heading","props":{"text":"Heading"},"style":{},"children":[]}]}]}. Supported node types: section,container,hero,card,row,column,grid,heading,h1,h3,paragraph,text,button,link,image. Parent layout nodes may have children; text nodes only props.text; button/link props.text and optional href. All nodes include type,props,style,children. Use text from screenshot when legible, do not fabricate private data, passwords, testimonials or payment links. Avoid image src URLs unless present in screenshot as a safe HTTPS source. Approximate the visual hierarchy using colors as 6-digit hex, padding/borderRadius/fontSize as numeric strings. Max 60 nodes, 6 depth. User notes: ${prompt}.`;
  const base64=data.toString("base64");
  const provider=config.provider,endpoint=provider==="gemini"?
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent":
    "https://api.openai.com/v1/responses";
  const headers:Record<string,string>={"content-type":"application/json"};
  let body:unknown;
  if(provider==="gemini"){
   headers["x-goog-api-key"]=providerKey("gemini");
   body={contents:[{role:"user",parts:[{text:spec},{inline_data:{mime_type:value.type,data:base64}}]}],generationConfig:{maxOutputTokens:config.maxOutputTokens,temperature:0.2}};
  }else{
   headers.authorization="Bearer "+providerKey("openai");
   body={model:"gpt-4o",instructions:spec,input:[{role:"user",content:[{type:"input_text",text:"Reconstruct these layout blocks as valid JSON."},{type:"input_image",image_url:"data:"+value.type+";base64,"+base64}]}],max_output_tokens:config.maxOutputTokens,store:false};
  }
  const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(30000)});
  if(!response.ok)return {ok:false,error:"Vision provider responded HTTP "+response.status+". Check the configured model and quota."};
  const output=extractJsonOutput(await response.json() as unknown,provider);
  const site=parseAiWebsiteResponse(output);
  const {data:project,error:insert}=await db.from("projects").insert({owner_id:user.id,name:site.name,kind:"website"}).select("id").single();
  if(insert||!project)return {ok:false,error:"Cannot create screenshot project."};
  const {error:page}=await db.from("pages").insert({project_id:project.id,path:"/",ui_tree:site.tree});
  if(page){await db.from("projects").delete().eq("id",project.id);return {ok:false,error:"Cannot save generated page: "+page.message};}
  return {ok:true,projectId:project.id};
 }catch(e){return {ok:false,error:e instanceof Error?e.message:"Vision conversion unavailable"};}
}
