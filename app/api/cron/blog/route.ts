import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {askProvider,aiIsAvailable,readAiConfig} from "@/lib/studio-ai";
import {privilegedSupabase} from "@/lib/supabase/admin";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(process.env.AUTO_BLOG_ENABLED!=="true")return NextResponse.json({disabled:true,reason:"Explicit automatic AI usage approval not configured."});
 try{
  const db=privilegedSupabase(),{data:admin}=await db.from("profiles").select("id").eq("role","admin").limit(1).maybeSingle();
  if(!admin)return NextResponse.json({error:"No admin author"},{status:503});
  const {data:settings}=await db.from("platform_settings").select("key,value").in("key",["studio_ai_config","blog_topics"]);
  const config=readAiConfig(settings?.find(x=>x.key==="studio_ai_config")?.value);
  const topics=settings?.find(x=>x.key==="blog_topics")?.value;
  if(!aiIsAvailable(config)||!Array.isArray(topics)||!topics.every(t=>typeof t==="string"&&t.length<180)||!topics.length)
   return NextResponse.json({disabled:true,reason:"AI provider or curated blog topics missing."});
  const today=new Date().toISOString().slice(0,10);
  const topic=topics[(Date.parse(today)/86400000)%topics.length];
  const slug=today+"-"+topic.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
  const {data:exists}=await db.from("blog_posts").select("id").eq("slug",slug).maybeSingle();
  if(exists)return NextResponse.json({ok:true,alreadyExists:true});
  const response=await askProvider(config,"Write one original SEO tutorial as Markdown (450–700 words), with an intro, clear practical steps, limitations and FAQ. Do not invent sources or stats. Return Markdown only.",[{role:"user",content:topic}]);
  const {error}=await db.from("blog_posts").insert({author_id:admin.id,slug,title:topic,excerpt:response.replace(/\s+/g," ").slice(0,220),body:response.slice(0,20000),published:false});
  if(error)return NextResponse.json({error:"Draft write failed"},{status:503});
  return NextResponse.json({ok:true,draft:slug,requiresAdminReview:true});
 }catch{return NextResponse.json({error:"Auto blog generation failed"},{status:503});}
}
