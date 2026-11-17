import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {validatePluginManifest} from "@/lib/plugins/manifest";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 let raw:unknown;try{raw=await req.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 const uri=(raw as {manifestUrl?:unknown}|null)?.manifestUrl;
 if(typeof uri!=="string"||uri.length>500)return NextResponse.json({error:"Invalid manifest URL"},{status:400});
 let url:URL;try{url=new URL(uri);}catch{return NextResponse.json({error:"Malformed URL"},{status:400});}
 if(url.protocol!=="https:"||url.username||url.password||url.port||!["raw.githubusercontent.com","cdn.jsdelivr.net"].includes(url.hostname)||
 !url.pathname.toLowerCase().endsWith(".json")||url.search||url.hash)
  return NextResponse.json({error:"Use a pinned JSON manifest on raw.githubusercontent.com or jsDelivr."},{status:400});
 if(url.hostname==="raw.githubusercontent.com"&&!/^\/[^/]+\/[^/]+\/[a-f0-9]{40}\//i.test(url.pathname))
  return NextResponse.json({error:"GitHub source must be pinned to a 40-character commit SHA."},{status:400});
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Sign in first"},{status:401});
  const response=await fetch(url,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(9000),headers:{accept:"application/json"}});
  if(!response.ok)return NextResponse.json({error:"Manifest HTTP "+response.status},{status:422});
  if(Number(response.headers.get("content-length")??0)>100000)return NextResponse.json({error:"Manifest too large"},{status:413});
  const text=await response.text();
  if(text.length>100000)return NextResponse.json({error:"Manifest too large"},{status:413});
  let manifest:unknown;try{manifest=JSON.parse(text);}catch{return NextResponse.json({error:"Manifest must be JSON, not executable JS."},{status:422});}
  if(!validatePluginManifest(manifest))return NextResponse.json({error:"Manifest failed component validation"},{status:422});
  const {data,error}=await db.from("studio_plugins").insert({owner_id:user.id,name:manifest.name,version:manifest.version,manifest,enabled:false}).select("id").single();
  if(error||!data)return NextResponse.json({error:error?.message??"Cannot install plugin"},{status:503});
  return NextResponse.json({id:data.id,installed:true,enabled:false});
 }catch{return NextResponse.json({error:"Plugin registry unavailable"},{status:503});}
}
