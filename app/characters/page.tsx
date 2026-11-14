import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,Boxes,Gamepad2,Plus,Shirt,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {isCharacterModel,type CharacterModel} from "@/lib/character-model";
import CharacterStudio from "@/components/CharacterStudio";
export const dynamic="force-dynamic";
export const metadata={title:"Character Studio 3D",robots:{index:false,follow:false}};
export default async function CharactersPage({searchParams}:{searchParams:Promise<{selected?:string;saved?:string}>}){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const query=await searchParams;
 const [designResult,configResult]=await Promise.all([
  db.from("character_designs").select("id,name,model,created_at").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(100),
  db.from("platform_settings").select("value").eq("key","character_studio_defaults").maybeSingle()
 ]);
 if(designResult.error||configResult.error)throw new Error(designResult.error?.message??configResult.error?.message);
 const defaults=configResult.data?.value;
 if(!isCharacterModel(defaults))throw new Error("Admin cần cấu hình nhân vật mặc định trong platform_settings.");
 const list=(designResult.data??[]).filter(d=>isCharacterModel(d.model));
 const design=list.find(d=>d.id===query.selected);
 return <main className="min-h-dvh bg-[#0b1323] px-3 py-6 text-slate-100 sm:px-6">
  <div className="mx-auto max-w-7xl">
   <nav className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-orange-300"><ArrowLeft size={17}/> Trang chủ Studio</Link><Link href="/game-builder" className="inline-flex items-center gap-2 rounded-xl border border-orange-500/50 px-4 py-2 text-xs font-bold text-orange-300"><Gamepad2 size={16}/> Game Builder 2D</Link></nav>
   <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.17em] text-orange-400">Character creator</p><h1 className="mt-2 flex items-center gap-3 text-2xl font-black sm:text-3xl"><Boxes size={29} className="text-orange-400"/> Xưởng nhân vật 3D</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Tạo mô hình 3D cơ bản bằng khối hình học, xoay camera, chỉnh tỷ lệ, đổi trang phục, chạy animation và xuất ảnh PNG. Thiết kế được lưu thật theo tài khoản. Chưa hỗ trợ rig/skeletal animation, mô hình glTF/FBX, hay engine 4D–6D.</p></div>
   <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
    <aside className="h-max rounded-2xl border border-slate-700 bg-[#1b293d] p-4"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><Users size={17}/> Nhân vật của tôi</h2><Link href="/characters" className="mb-2 flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-xs font-bold"><Plus size={17}/> Tạo nhân vật mới</Link>
     <div className="editor-scroll max-h-[450px] space-y-2 overflow-y-auto">{list.map(d=><Link key={d.id} href={"/characters?selected="+d.id} className={"block truncate rounded-xl border px-3 py-3 text-xs "+(design?.id===d.id?"border-orange-400 bg-orange-500/10 text-orange-200":"border-slate-700 bg-slate-900 text-slate-200 hover:border-orange-400")}>{d.name}</Link>)}</div>
     {!list.length&&<p className="mt-4 text-xs leading-6 text-slate-400">Chưa có nhân vật. Điều chỉnh mẫu bên phải rồi nhấn Lưu nhân vật.</p>}
     <Link href="/resources" className="mt-5 flex items-center gap-2 text-xs font-bold text-orange-300"><Shirt size={16}/> Nguồn model, texture và icon</Link>
    </aside>
    <CharacterStudio key={design?.id??"new"} id={design?.id} initialName={design?.name??""} initialModel={(design?.model??defaults) as CharacterModel} saved={query.saved==="1"}/>
   </div>
  </div>
 </main>;
}
