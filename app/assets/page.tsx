import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,Images,LibraryBig} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import AssetBrowser from "@/components/AssetBrowser";
export const dynamic="force-dynamic";
export const metadata={title:"Kho tài nguyên của tôi",robots:{index:false,follow:false}};
export default async function MyAssets(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 return <main className="min-h-dvh bg-[#0f172a] px-3 py-8 text-white sm:px-5"><div className="mx-auto max-w-6xl">
  <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><Link href="/builder" className="inline-flex items-center gap-2 text-xs text-orange-300"><ArrowLeft size={16}/> Trình Builder</Link><Link href="/resources" className="inline-flex items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm text-orange-200"><LibraryBig size={17}/> Kho tài nguyên miễn phí</Link></div>
  <div className="mb-7"><p className="text-sm font-bold uppercase tracking-[.2em] text-orange-400">Cá nhân hóa website / game</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black"><Images size={30}/> Thư viện ảnh của tôi</h1><p className="mt-3 text-sm leading-6 text-slate-400">Tải ảnh PNG/JPG/WebP/GIF; dùng lại ảnh trong nhiều trang qua URL Supabase. Giữ nguyên ảnh khi thay đổi bố cục, không tự xóa tệp của bạn.</p></div>
  <AssetBrowser userId={user.id}/>
 </div></main>;
}
