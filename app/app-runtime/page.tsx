import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {siteUrl} from "@/lib/site-url";
import MobileWebQr from "@/components/runtime/MobileWebQr";
export const dynamic="force-dynamic";
export const metadata={title:"Mobile App Runtime & QR",robots:{index:false,follow:false}};
export default async function AppRuntime({searchParams}:{searchParams:Promise<{project?:string}>}){
 const projectId=(await searchParams).project??"";
 if(!/^[a-f0-9-]{36}$/i.test(projectId))notFound();
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const [{data:project},{data:published}]=await Promise.all([
  db.from("projects").select("id,name").eq("id",projectId).eq("owner_id",user.id).maybeSingle(),
  db.from("published_pages").select("project_id").eq("project_id",projectId).eq("is_live",true).limit(1).maybeSingle()
 ]);
 if(!project)notFound();
 const url=new URL("/s/"+projectId,siteUrl()).href;
 return <main className="min-h-dvh bg-slate-950 p-5 text-white"><div className="mx-auto max-w-6xl space-y-6"><Link href={"/native-build?project="+projectId} className="text-sm text-orange-300">← Build Center</Link><h1 className="text-3xl font-black">{project.name} · Mobile runtime</h1>
 {published?<div className="grid gap-6 lg:grid-cols-[320px_1fr]"><MobileWebQr url={url}/><div className="mx-auto h-[650px] w-full max-w-[390px] overflow-hidden rounded-[32px] border-[8px] border-slate-700 bg-white"><iframe title="Published app preview" src={url} className="h-full w-full border-0" sandbox="allow-scripts allow-forms allow-same-origin"/></div></div>:
  <div className="rounded-xl border border-amber-600/40 bg-amber-500/10 p-5 text-sm">Publish your project before creating a working web preview QR. No fake runtime link is generated.</div>}
 <p className="text-xs text-slate-400">For installable Android APK / iOS IPA use GitHub Actions build jobs. Native/Expo QR distribution requires a published EAS Update and a compatible development build, which is separate from this web preview.</p>
 </div></main>;
}
