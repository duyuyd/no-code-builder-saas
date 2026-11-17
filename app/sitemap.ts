import type {MetadataRoute} from "next";
import {createClient} from "@supabase/supabase-js";
import {siteUrl} from "@/lib/site-url";
export const revalidate=1800;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const root=siteUrl();
 const visible=["/","/pricing","/resources","/game-maps","/terms","/privacy","/blog","/marketplace","/screenshot-to-app"];
 const entries:MetadataRoute.Sitemap=visible.map((url,i)=>({url:new URL(url,root).href,changeFrequency:i===0?"daily":"monthly",priority:i===0?1:0.6}));
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!u||!k)return entries;
 try{
  const db=createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("published_pages").select("project_id,path").eq("is_live",true).limit(500);
  if(error)return entries;
  const seen=new Set(entries.map(e=>e.url));
  for(const row of data??[]){
   if(typeof row.project_id!=="string"||typeof row.path!=="string"||!/^\/[a-z0-9/_-]*$/i.test(row.path))continue;
   const full=new URL("/s/"+row.project_id+(row.path==="/"? "":row.path),root).href;
   if(!seen.has(full)){entries.push({url:full,changeFrequency:"weekly",priority:0.4});seen.add(full);}
  }
  const {data:posts}=await db.from("blog_posts").select("slug,published_at").eq("published",true).order("published_at",{ascending:false}).limit(400);
  for(const post of posts??[]){
   if(typeof post.slug!=="string"||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug))continue;
   const url=new URL("/blog/"+post.slug,root).href;
   if(!seen.has(url)){entries.push({url,lastModified:post.published_at?new Date(post.published_at):undefined,changeFrequency:"monthly",priority:0.6});seen.add(url);}
  }
 }catch{/* Main sitemap remains available if optional public catalogue is unreachable. */}
 return entries;
}
