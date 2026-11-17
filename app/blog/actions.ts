"use server";
import {createClient} from "@/lib/supabase/server";
import {askProvider,aiIsAvailable,readAiConfig} from "@/lib/studio-ai";
export type BlogResult={ok:true;id:string}|{ok:false;error:string};
function slugify(value:string):string{return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,95);}
export async function generateBlogDraft(topic:string):Promise<BlogResult>{
 if(typeof topic!=="string"||topic.trim().length<12||topic.length>180)return {ok:false,error:"Topic length must be 12–180 characters."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in."};
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return {ok:false,error:"Only Admin may generate blog posts."};
  const {data:row}=await db.from("platform_settings").select("value").eq("key","studio_ai_config").maybeSingle();
  const config=readAiConfig(row?.value);
  if(!aiIsAvailable(config))return {ok:false,error:"Admin must enable a configured AI provider before generating content."};
  const {data:quota,error:qerr}=await db.rpc("studio_ai_claim_slot");
  if(qerr||quota!==true)return {ok:false,error:"AI quota exhausted."};
  const text=await askProvider(config,"You are a technical SEO editor. Produce 500–850 words of original, accurate Markdown in English on the requested topic. Include an informative intro, 3–6 short sections, practical steps and an FAQ. Do not invent statistics, testimonials, pricing, product capabilities or external citations. Never include hidden HTML/script. Explain prerequisites and limitations accurately. Output Markdown only.",[{role:"user",content:topic}]);
  const slug=(slugify(topic)||"no-code-guide")+"-"+Date.now().toString(36);
  const excerpt=text.replace(/[#*_`>]/g,"").replace(/\s+/g," ").slice(0,220);
  const {data,error}=await db.from("blog_posts").insert({author_id:user.id,slug,title:topic.trim(),excerpt,body:text.slice(0,20000),published:false}).select("id").single();
  return error||!data?{ok:false,error:error?.message??"Unable to save article"}:{ok:true,id:data.id};
 }catch(e){return {ok:false,error:e instanceof Error?e.message:"Blog generation unavailable"};}
}
export async function publishBlogPost(id:string):Promise<{ok:boolean;error?:string}>{
 if(!/^[a-f0-9-]{36}$/i.test(id))return {ok:false,error:"Invalid article."};
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in."};
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")return {ok:false,error:"Admin review required."};
 const {error}=await db.from("blog_posts").update({published:true,published_at:new Date().toISOString()}).eq("id",id).eq("author_id",user.id);
 return error?{ok:false,error:error.message}:{ok:true};
}
