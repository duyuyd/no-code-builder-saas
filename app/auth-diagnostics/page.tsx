import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import AuthDiagnosticsPanel from "@/components/studio/AuthDiagnosticsPanel";
export const dynamic="force-dynamic";
export default async function AuthDiagnosticsPage(){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect("/login");
 return <main className="min-h-dvh bg-[#0f172a] p-5 text-white"><div className="mx-auto max-w-xl space-y-5">
  <header><h1 className="text-2xl font-bold">Auth Diagnostics</h1><Link href="/dashboard" className="text-sm text-orange-300">Trang chủ</Link></header>
  <AuthDiagnosticsPanel/>
 </div></main>;
}
