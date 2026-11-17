import type {MetadataRoute} from "next";
import {siteUrl} from "@/lib/site-url";
export default function robots():MetadataRoute.Robots{
 const root=siteUrl();
 return {rules:[{userAgent:"*",allow:["/","/s/","/play/"],disallow:["/api/","/admin","/builder","/dashboard","/login","/auth/","/native-build","/ai-logic","/auth-diagnostics","/game-runtime"]}],sitemap:new URL("/sitemap.xml",root).href,host:root.origin};
}
