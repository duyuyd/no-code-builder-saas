import {cache} from "react";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
export type GrowthFeature={dimension:string;title:string;detail:string};
export type GrowthPlan={code:string;name:string;price:string;period:string;summary:string;features:string[];cta:string;href:string};
export type GrowthSettings={eyebrow:string;headline:string;subtitle:string;primaryCta:string;secondaryCta:string;aiPlaceholder:string;features:GrowthFeature[];pricing:GrowthPlan[];footerNote:string};
function valid(v:unknown):v is GrowthSettings{
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const d=v as Partial<GrowthSettings>;
 return ["eyebrow","headline","subtitle","primaryCta","secondaryCta","aiPlaceholder","footerNote"].every(k=>typeof (d as Record<string,unknown>)[k]==="string")&&
  Array.isArray(d.features)&&d.features.every(f=>typeof f.dimension==="string"&&typeof f.title==="string"&&typeof f.detail==="string")&&
  Array.isArray(d.pricing)&&d.pricing.every(p=>typeof p.code==="string"&&typeof p.name==="string"&&typeof p.price==="string"&&typeof p.period==="string"&&typeof p.summary==="string"&&Array.isArray(p.features)&&p.features.every(f=>typeof f==="string")&&typeof p.cta==="string"&&typeof p.href==="string");
}
const retrieve=unstable_cache(async()=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("Supabase public environment not configured");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("platform_settings").select("value").eq("key","landing_content").single();
 if(error||!valid(data?.value))throw new Error("landing_content is missing or malformed in platform_settings");
 return data.value;
},["growth-settings-v1"],{revalidate:300,tags:["platform-settings","growth-settings"]});
export const getGrowthSettings=cache(retrieve);
