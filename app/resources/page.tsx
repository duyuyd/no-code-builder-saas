import Link from "next/link";
import {ArrowLeft,LibraryBig,ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import ResourceGallery from "@/components/ResourceGallery";
export const dynamic="force-dynamic";
export const metadata={title:"Nguồn tài nguyên thiết kế và game"};
export default async function ResourcePage(){
 const db=await createClient();
 const {data,error}=await db.from("asset_sources").select("id,category,title,provider,url,license_notes,description").order("category").order("title").limit(200);
 if(error)throw new Error(error.message);
 return <main className="min-h-dvh bg-[#0f172a] px-4 py-10 text-slate-100"><div className="mx-auto max-w-7xl">
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/builder" className="inline-flex items-center gap-2 text-sm text-orange-300"><ArrowLeft size={16}/> Trình Builder</Link><Link href="/assets" className="rounded-xl border border-orange-500/50 px-4 py-2 text-sm font-bold text-orange-300">Ảnh của tôi</Link></div>
  <div className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Tài nguyên sáng tạo</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><LibraryBig size={34}/> Game, 3D, thời trang, website và icon</h1><p className="mt-4 text-sm leading-7 text-slate-400">Danh mục nguồn có bản quyền rõ ràng do Admin quản lý trên Supabase. Mở trang nguồn để tải asset, sau đó dùng “Kho ảnh của tôi” để đưa vào dự án. Đây là danh mục liên kết, chưa phải bộ dữ liệu tải sẵn.</p></div>
  <div className="mb-7 flex items-start gap-2 rounded-xl border border-emerald-900 bg-emerald-950/20 p-4 text-xs leading-6 text-emerald-200"><ShieldCheck size={17} className="mt-1 shrink-0"/> Đọc điều kiện của từng tệp trước khi kinh doanh. Các bộ CC0 có thể dùng rộng rãi; ảnh thời trang, thương hiệu và con người có thể có quyền riêng cần kiểm tra. Không sử dụng logo hoặc nhân vật của game thương mại khác làm tài sản mặc định.</div>
  <ResourceGallery sources={data??[]}/>
 </div></main>;
}
