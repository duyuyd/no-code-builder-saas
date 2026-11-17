import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import PluginSettings from "@/components/plugins/PluginSettings";
export const dynamic="force-dynamic";
export default async function Plugins(){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {data,error}=await db.from("studio_plugins").select("id,name,version,enabled").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(40);
 if(error)throw new Error(error.message);
 return <main className="min-h-dvh bg-[#0c1525] p-5 text-white"><div className="mx-auto max-w-3xl"><Link href="/builder" className="text-sm text-orange-300">← Builder</Link><h1 className="my-6 text-3xl font-black">Plugin Studio</h1><p className="mb-6 text-sm leading-7 text-slate-400">Install validated, data-only component manifests. A dedicated Web Worker handles safe text transformations without loading remote JavaScript. External executable code remains disabled until isolated-origin security is configured.</p><PluginSettings plugins={data??[]}/></div></main>;
}
