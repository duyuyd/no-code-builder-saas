import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type SiteSettings={siteTitle:string;primaryColor:string};
const getPublicSettings=unstable_cache(async():Promise<SiteSettings>=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("Missing Supabase environment");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("platform_settings").select("key,value").in("key",["site_title","primary_color"]);
 if(error)throw new Error("Settings query failed: "+error.message);
 const values=new Map((data??[]).map(item=>[item.key,item.value]));
 const siteTitle=values.get("site_title");
 const primaryColor=values.get("primary_color");
 if(typeof siteTitle!=="string"||!siteTitle.trim()||typeof primaryColor!=="string"||!/^#[0-9a-fA-F]{6}$/.test(primaryColor))throw new Error("Invalid public platform settings");
 return {siteTitle,primaryColor};
},["platform-settings-v2"],{tags:["platform-settings"],revalidate:300});
export const getSiteSettings=cache(async()=>getPublicSettings());
