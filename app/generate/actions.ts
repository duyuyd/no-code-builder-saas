"use server";
import {createClient} from "@/lib/supabase/server";
import {askProvider,aiIsAvailable,readAiConfig} from "@/lib/studio-ai";
import {parseAiWebsiteResponse} from "@/lib/ai-website-generator";
export type GenerateResult={ok:true;projectId:string}|{ok:false;reason:"signin"|"configuration"|"generation"|"storage";error:string};
export async function generateWebsiteFromPrompt(prompt:string):Promise<GenerateResult>{
 if(typeof prompt!=="string"||prompt.trim().length<12||prompt.length>850)
  return {ok:false,reason:"generation",error:"Describe your website in 12–850 characters."};
 try{
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return {ok:false,reason:"signin",error:"Sign in to generate and save the website."};
  const {data:setting,error:configError}=await db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle();
  if(configError)return {ok:false,reason:"configuration",error:"AI configuration unavailable."};
  const config=readAiConfig(setting?.value);
  if(!aiIsAvailable(config))return {ok:false,reason:"configuration",error:"AI generation requires an administrator-enabled provider. No fabricated output will be created."};
  const {data:quota,error:quotaError}=await db.rpc("studio_ai_claim_slot");
  if(quotaError||quota!==true)return {ok:false,reason:"configuration",error:"Daily AI generation budget exhausted."};
  let site;
  try{
   const answer=await askProvider(config,`You are a no-code website designer. Produce ONLY compact valid JSON: {"name":"Site title","ui_tree":[{"type":"section","props":{},"style":{},"children":[{"type":"heading","props":{"text":"Headline"},"style":{},"children":[]}]}]}.
Allowed types: section,container,hero,card,row,column,grid,heading,h1,h3,paragraph,text,button,link,image.
Allowed props by type: heading/h1/h3/paragraph/text: text; button/link: text,href; image: src,alt; section/container/card/hero/row/column/grid: label.
Each node must have type, props, style, children. Children only for layout nodes. Make 5–12 useful content blocks relevant to user's business, a hero, features and contact CTA. Use only actual details supplied, no invented testimonials, client names, contact info, payment links or performance metrics. For styles use a small set of valid CSS-like fields: backgroundColor, color (6-digit hex), padding, fontSize, borderRadius (integer as string). Return JSON ONLY, without markdown.`,[{role:"user",content:prompt.trim()}]);
   site=parseAiWebsiteResponse(answer);
  }catch(e){return {ok:false,reason:"generation",error:e instanceof Error?e.message:"AI generation failed"};}
  const {data:project,error:projectError}=await db.from("projects").insert({owner_id:user.id,name:site.name,kind:"website"}).select("id").single();
  if(projectError||!project)return {ok:false,reason:"storage",error:projectError?.message??"Cannot save project"};
  const {error:pageError}=await db.from("pages").insert({project_id:project.id,path:"/",ui_tree:site.tree});
  if(pageError){
   await db.from("projects").delete().eq("id",project.id);
   return {ok:false,reason:"storage",error:"Could not save website layout: "+pageError.message};
  }
  return {ok:true,projectId:project.id};
 }catch{return {ok:false,reason:"storage",error:"Cannot access the current session or database."};}
}
