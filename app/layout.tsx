import "./globals.css";
import type {CSSProperties,ReactNode} from "react";
import type {Metadata,Viewport} from "next";
import {getSiteSettings} from "@/lib/platform-settings";
import {siteUrl} from "@/lib/site-url";
import {getHostBrand} from "@/lib/tenant-branding";
export const dynamic="force-dynamic";
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#0b1020"};
export async function generateMetadata():Promise<Metadata>{
 const [{siteTitle},tenant]=await Promise.all([getSiteSettings(),getHostBrand()]);
 const title=tenant?.name??siteTitle;
 const root=tenant?new URL("https://"+tenant.host):siteUrl();
 const description=tenant ? `${title} — websites, apps and visual experiences powered by NuvoraCraft.` : "NuvoraCraft by NPTduy — create websites, apps and interactive 3D experiences with a visual editor, AI tools and timeline animation.";
 return {
  metadataBase:root,
  title:{default:tenant?title:"NuvoraCraft by NPTduy | Web, App & 3D Studio",template:"%s | "+title},
  description,
  applicationName:title,
  keywords:["NuvoraCraft","NuvoraCraft by NPTduy","NPTduy","no-code website builder","app builder","3D game creator","visual editor","AI website generator","timeline editor","WebXR","responsive websites"],
  openGraph:{type:"website",locale:"en_US",siteName:title,url:root,images:tenant?(tenant.logoUrl?[{url:tenant.logoUrl,alt:title+" logo"}]:[]):[{url:"/opengraph-image",width:1200,height:630,alt:title+" visual creation studio"}],title:title+" — build websites, apps & 3D games",description},
  twitter:{card:"summary_large_image",title:title+" — Visual Creation Studio",description,images:tenant?(tenant.logoUrl?[tenant.logoUrl]:[]):["/opengraph-image"]},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}}
 };
}
export default async function RootLayout({children}:{children:ReactNode}){
 const [{siteTitle,primaryColor},tenant]=await Promise.all([getSiteSettings(),getHostBrand()]);
 const root=tenant?new URL("https://"+tenant.host):siteUrl();
 const style={"--brand-primary":tenant?.primaryColor??primaryColor} as CSSProperties;
 const data={"@context":"https://schema.org","@type":"SoftwareApplication",name:tenant?.name??siteTitle,description:"NuvoraCraft by NPTduy visual creation platform for web, mobile apps, 3D games and animations",url:root.href,applicationCategory:"DeveloperApplication",operatingSystem:"Web",creator:{"@type":"Person",name:"NPTduy"},offers:{"@type":"Offer",price:"0",priceCurrency:"USD",description:"Free plan available"}};
 return <html lang="en" style={style}><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/></body></html>;
}
