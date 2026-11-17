import "server-only";
import {cache} from "react";
import {headers} from "next/headers";
import {createClient} from "@supabase/supabase-js";
import {siteUrl} from "@/lib/site-url";
export type HostBrand={name:string;primaryColor:string;logoUrl:string|null;host:string};
function hostName(raw:string){return raw.split(",")[0].trim().toLowerCase().split(":")[0];}
export const getHostBrand=cache(async():Promise<HostBrand|null>=>{
 const h=await headers(),host=hostName(h.get("x-forwarded-host")||h.get("host")||"");
 const base=siteUrl();
 if(!/^[a-z0-9.-]{4,253}$/.test(host)||host===base.hostname||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".vercel.app"))return null;
 const allowed=(process.env.PLATFORM_DOMAINS??"").split(",").map(s=>s.trim().toLowerCase());
 if(allowed.includes(host))return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("tenants").select("name,primary_color,logo_url").eq("custom_domain",host).eq("domain_status","verified").maybeSingle();
 if(error||!data||typeof data.name!=="string"||!/^#[0-9a-f]{6}$/i.test(data.primary_color))return null;
 return {name:data.name.slice(0,120),primaryColor:data.primary_color,logoUrl:data.logo_url,host};
});
