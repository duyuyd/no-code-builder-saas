import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
export async function middleware(request: NextRequest) {
 const rawHost=request.headers.get("x-forwarded-host")||request.headers.get("host")||"";
 const host=rawHost.split(":")[0].toLowerCase();
 const path=request.nextUrl.pathname;
 // Public customer domains serve a verified published snapshot; never expose Builder/Auth routes here.
 const platformHost=(process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase():"no-code-builder-saas.vercel.app");
 const extra=(process.env.PLATFORM_DOMAINS??"").split(",").map(v=>v.trim().toLowerCase());
 const customerHost=host.includes(".") && host!==platformHost && !extra.includes(host) && !host.endsWith(".vercel.app") &&
    host!=="localhost" && !host.endsWith(".localhost") && !host.endsWith(".supabase.co") &&
    /^[a-z0-9.-]+$/.test(host);
 if(customerHost&&!path.startsWith("/host-site/")&&!path.startsWith("/.well-known/")){
   const url=request.nextUrl.clone();
   url.pathname="/host-site"+path;
   return NextResponse.rewrite(url);
 }
 // Public product pages never need to refresh a user session. This avoids an Auth network call per page view.
 if(path==="/"||path==="/pricing"||path==="/resources"||path==="/marketplace"||path.startsWith("/blog")||path==="/screenshot-to-app"||path.startsWith("/store/")||path==="/game-maps"||path.startsWith("/demo/game/")||path.startsWith("/s/")||path.startsWith("/play/")||
    path.startsWith("/host-site/")||path.startsWith("/_next/")||path.startsWith("/.well-known/"))return NextResponse.next();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.next({request});
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{
  getAll:()=>request.cookies.getAll(),
  setAll:(items)=>{
    for(const {name,value} of items)request.cookies.set(name,value);
    response=NextResponse.next({request});
    for(const {name,value,options} of items)response.cookies.set(name,value,options);
  }
 }});
 try{
  const {error}=await supabase.auth.getUser();
  if(error)response.headers.set("x-studio-auth-status","refresh-failed");
 }catch{
  // Network errors must not crash middleware. Protected Server Components enforce auth.
  response.headers.set("x-studio-auth-status","unavailable");
 }
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"]};
