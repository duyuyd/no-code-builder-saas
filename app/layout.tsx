import "./globals.css";
import type {CSSProperties,ReactNode} from "react";
import type {Metadata,Viewport} from "next";
import {getSiteSettings} from "@/lib/platform-settings";
import {siteUrl} from "@/lib/site-url";
export const dynamic="force-dynamic";
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#0b1020"};
export async function generateMetadata():Promise<Metadata>{
 const {siteTitle}=await getSiteSettings();
 const root=siteUrl();
 const description="No-code platform to create websites, apps and interactive 3D games. Visual editor, timeline animation, AI-assisted creation and immersive XR.";
 return {
  metadataBase:root,
  title:{default:siteTitle+" | No-code website, app & 3D game builder",template:"%s | "+siteTitle},
  description,
  applicationName:siteTitle,
  keywords:["no-code website builder","app builder","3D game creator","visual editor","AI website generator","timeline editor","WebXR","responsive websites"],
  alternates:{canonical:"/"},
  openGraph:{type:"website",locale:"en_US",siteName:siteTitle,url:root,images:[{url:"/opengraph-image",width:1200,height:630,alt:siteTitle+" visual creation studio"}],title:siteTitle+" — build websites, apps & 3D games",description},
  twitter:{card:"summary_large_image",title:siteTitle+" — Visual Creation Studio",description,images:["/opengraph-image"]},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}}
 };
}
export default async function RootLayout({children}:{children:ReactNode}){
 const {siteTitle,primaryColor}=await getSiteSettings();
 const root=siteUrl();
 const style={"--brand-primary":primaryColor} as CSSProperties;
 const data={"@context":"https://schema.org","@type":"SoftwareApplication",name:siteTitle,description:"No-code builder for web, mobile apps, 3D games and visual animations",url:root.href,applicationCategory:"DeveloperApplication",operatingSystem:"Web",offers:{"@type":"Offer",price:"0",priceCurrency:"USD",description:"Free plan available"}};
 return <html lang="en" style={style}><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/></body></html>;
}
