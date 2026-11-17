import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {addVercelProjectDomain,inspectVercelProjectDomain,normalizeDomain} from "@/lib/vercel-domains";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Invalid request origin"},{status:403});
 let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 const domainValue=(body as {domain?:unknown}|null)?.domain;
 if(typeof domainValue!=="string")return NextResponse.json({error:"Missing domain"},{status:400});
 let domain:string;try{domain=normalizeDomain(domainValue);}catch{return NextResponse.json({error:"Invalid domain name"},{status:400});}
 if(!process.env.VERCEL_TOKEN||!process.env.VERCEL_PROJECT_ID||!process.env.VERCEL_TEAM_ID)
  return NextResponse.json({error:"Vercel domain management has not been configured."},{status:503});
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const {data:profile}=await db.from("profiles").select("role,plan").eq("id",user.id).maybeSingle();
  if(!["pro","agency"].includes(profile?.plan??"")&&profile?.role!=="admin")
   return NextResponse.json({error:"Custom domains require approved Pro/Agency subscription."},{status:403});
  const {data:tenant}=await db.from("tenants").select("id,custom_domain,project_id").eq("owner_id",user.id).maybeSingle();
  if(!tenant?.project_id)return NextResponse.json({error:"Configure tenant and owned project first."},{status:400});
  if(tenant.custom_domain&&tenant.custom_domain!==domain)return NextResponse.json({error:"An existing domain is attached. Use domain settings to replace it."},{status:409});
  const {data:other}=await privilegedSupabase().from("tenants").select("owner_id").eq("custom_domain",domain).maybeSingle();
  if(other&&other.owner_id!==user.id)return NextResponse.json({error:"Domain already claimed."},{status:409});
  let result;
  try{result=await addVercelProjectDomain(domain);}catch(e){
   result=await inspectVercelProjectDomain(domain).catch(()=>{throw e});
  }
  const verified=result.verified===true&&result.misconfigured===false;
  const checks=(result.verification??[]).filter(x=>x.type&&x.domain&&x.value).map(x=>({type:x.type!,domain:x.domain!,value:x.value!}));
  const {error}=await privilegedSupabase().from("tenants").update({custom_domain:domain,domain_status:verified?"verified":"pending",domain_verification:checks})
   .eq("id",tenant.id).eq("owner_id",user.id);
  if(error)return NextResponse.json({error:"Cannot persist verification state."},{status:503});
  return NextResponse.json({domain,verified,verification:checks},{headers:{"cache-control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Domain setup failed."},{status:503});}
}
