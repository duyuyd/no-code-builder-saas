import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowRight,ArrowUpRight,Blocks,BookOpen,ChevronRight,Clock3,FolderKanban,Gamepad2,Globe2,ImagePlus,LayoutGrid,LogOut,Plus,ShieldCheck,Sparkles,Store,UserRound,Workflow} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {getSiteSettings} from "@/lib/platform-settings";
import {createProject} from "@/app/builder/actions";
import {signOut} from "@/app/login/actions";
export const dynamic="force-dynamic";
export const metadata={title:"Trang chủ Studio",robots:{index:false,follow:false}};
export default async function Dashboard({searchParams}:{searchParams:Promise<{template?:string;kind?:string}>}){
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(!user||authError)redirect("/login");
 const query=await searchParams;
 const [settings,profileResult,projectResult,templateResult]=await Promise.all([
  getSiteSettings(),
  db.from("profiles").select("display_name,role,plan").eq("id",user.id).maybeSingle(),
  db.from("projects").select("id,name,kind,created_at",{count:"exact"}).eq("owner_id",user.id).is("archived_at",null).order("created_at",{ascending:false}).limit(30),
  db.from("starter_templates").select("id,name,kind,description").eq("is_active",true).order("name")
 ]);
 if(projectResult.error||templateResult.error)throw new Error(projectResult.error?.message??templateResult.error?.message??"Không tải được dữ liệu.");
 const profile=profileResult.data;
 const projects=projectResult.data??[];
 const templates=templateResult.data??[];
 const selected=templates.some(t=>t.id===query.template)?query.template:"";
 const firstName=(profile?.display_name?.trim()||user.email?.split("@")[0]||"người dùng").slice(0,80);
 const filtered=query.kind==="game"||query.kind==="app"||query.kind==="website"?query.kind:"all";
 const showTemplates=filtered==="all"?templates:templates.filter(t=>t.kind===filtered);
 const isAdmin=profile?.role==="admin";
 return <main className="min-h-dvh bg-[#0b1323] text-slate-100">
  <header className="sticky top-0 z-30 border-b border-slate-700/80 bg-[#101b2b]/95 px-4 py-3 backdrop-blur-md sm:px-7"><div className="mx-auto flex max-w-7xl items-center gap-3">
   <Link href="/" className="flex min-w-0 items-center gap-2.5 font-black"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-500"><Blocks size={21}/></span><span className="hidden truncate sm:block">{settings.siteTitle}</span></Link>
   <nav aria-label="Điều hướng Studio" className="ml-auto flex items-center gap-2"><Link href="/projects" className="rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-orange-400"><span className="hidden sm:inline">Dự án của tôi</span><FolderKanban size={17} className="sm:hidden"/></Link>{isAdmin&&<Link href="/admin" className="inline-flex items-center gap-1 rounded-xl border border-orange-500/50 bg-orange-500/10 px-3 py-2.5 text-xs font-bold text-orange-200"><ShieldCheck size={17}/> <span className="hidden sm:inline">Quản trị</span></Link>}<form action={signOut}><button title="Đăng xuất" aria-label="Đăng xuất" className="rounded-xl border border-slate-700 p-2.5 text-slate-300 hover:text-white"><LogOut size={17}/></button></form></nav>
  </div></header>
  <div className="mx-auto max-w-7xl space-y-9 px-4 pb-20 pt-9 sm:px-7 sm:pt-12">
   <section className="relative overflow-hidden rounded-[28px] border border-slate-700 bg-gradient-to-br from-[#1c2b43] via-[#1b2a43] to-[#32241e] p-6 sm:p-9">
    <div className="pointer-events-none absolute -right-12 -top-28 size-80 rounded-full bg-orange-500/10 blur-[60px]"/>
    <div className="relative flex flex-wrap items-center justify-between gap-5"><div className="max-w-2xl"><p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-orange-300"><Sparkles size={16}/> Trung tâm sáng tạo</p><h1 className="text-2xl font-black leading-tight sm:text-4xl">Chào mừng, {firstName}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Quản lý dự án, sử dụng mẫu hoàn chỉnh hoặc tiếp tục thiết kế. Không bắt buộc tạo dự án ngay khi đăng nhập.</p></div><div className="flex flex-wrap items-center gap-3"><Link href="#start" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-400"><Plus size={18}/> Tạo sản phẩm</Link>{isAdmin&&<Link href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-orange-400/50 px-5 py-3 text-sm font-bold text-orange-200"><ShieldCheck size={18}/> Trung tâm Admin</Link>}</div></div>
   </section>
   <section aria-label="Tổng quan tài khoản" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {[[FolderKanban,"Dự án của tôi",String(projectResult.count??projects.length)],[LayoutGrid,"Mẫu sẵn có",String(templates.length)],[UserRound,"Gói tài khoản",String(profile?.plan??"free").toUpperCase()],[ShieldCheck,"Vai trò",isAdmin?"Quản trị":"Thành viên"]].map(([Icon,label,value],i)=>{const I=Icon as typeof FolderKanban;return <div key={String(i)} className="rounded-2xl border border-slate-700 bg-[#1c293d] p-4 sm:p-5"><I size={21} className="mb-4 text-orange-300"/><p className="text-xs text-slate-400">{String(label)}</p><p className="mt-2 truncate text-xl font-black sm:text-2xl">{String(value)}</p></div>})}
   </section>
   <section aria-label="Truy cập nhanh"><h2 className="mb-4 text-lg font-black sm:text-xl">Công cụ và thư viện</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     {[[Gamepad2,"Thiết kế game","Bản đồ 2D và tài nguyên","/game-builder"],[Globe2,"Thiết kế website","Mở Studio kéo-thả","/builder"],[ImagePlus,"Kho ảnh","Tải và sử dụng ảnh của bạn","/assets"],[Gamepad2,"Nhân vật 3D","Xây, xoay và lưu nhân vật","/characters"],[BookOpen,"Kho tài nguyên","Game, 3D, ảnh và icon","/resources"],[Gamepad2,"Bản đồ game chơi thử","Thử core thu thập và chiến đấu PvE","/game-maps"]].map(([Icon,label,desc,href],i)=>{const I=Icon as typeof Gamepad2;return <Link key={String(i)} href={String(href)} className="group flex items-center gap-3 rounded-2xl border border-slate-700 bg-[#1b283c] p-4 transition hover:border-orange-400"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><I size={22}/></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{String(label)}</p><p className="mt-1 text-xs text-slate-400">{String(desc)}</p></div><ArrowUpRight size={16} className="text-slate-500 group-hover:text-orange-300"/></Link>})}
    </div>
   </section>
   <section aria-label="Dự án gần đây"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-black sm:text-xl">Tiếp tục dự án</h2><Link href="/projects" className="flex items-center gap-1 text-xs font-bold text-orange-300">Quản lý · Thùng rác <ChevronRight size={16}/></Link></div>
    {projects.length?<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projects.slice(0,6).map(p=><Link href={p.kind==="game"?"/game-builder?project="+p.id:"/builder?project="+p.id} key={p.id} className="group flex items-center gap-4 rounded-2xl border border-slate-700 bg-[#1b283c] p-5 hover:border-orange-400"><div className="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-orange-300">{p.kind==="game"?<Gamepad2 size={24}/>:p.kind==="app"?<Workflow size={24}/>:<Globe2 size={24}/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="mt-1 text-xs text-slate-400">{p.kind==="game"?"Game":p.kind==="app"?"Ứng dụng":"Website"} · {new Date(p.created_at).toLocaleDateString("vi-VN")}</p></div><ArrowRight size={17} className="text-slate-500 group-hover:text-orange-300"/></Link>)}</div>:<div className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 p-8 text-center"><FolderKanban size={32} className="mx-auto text-orange-300"/><p className="mt-3 text-sm font-bold">Bạn chưa có dự án nào</p><p className="mt-2 text-xs text-slate-400">Bắt đầu bằng một mẫu có sẵn hoặc trang trắng ở phía dưới.</p><a href="#start" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-300">Chọn mẫu <ArrowRight size={16}/></a></div>}
   </section>
   <section id="start" aria-label="Khởi tạo sản phẩm" className="scroll-mt-24">
    <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-400">Thư viện mẫu thật</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Bắt đầu bằng một mẫu phù hợp</h2><p className="mt-3 text-sm text-slate-400">Chọn mẫu, đặt tên rồi khởi tạo dự án nhiều trang của riêng bạn.</p></div>
    <nav aria-label="Lọc mẫu dự án" className="editor-scroll mb-5 flex flex-wrap gap-2">{[["all","Tất cả"],["website","Website"],["app","Ứng dụng"],["game","Game"]].map(([key,label])=><Link key={key} href={"/dashboard?kind="+key+"#start"} className={"rounded-xl px-4 py-2 text-xs font-bold "+(filtered===key?"bg-orange-500 text-white":"border border-slate-700 bg-slate-800 text-slate-300")}>{label}</Link>)}</nav>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
     <div className="grid content-start gap-3 sm:grid-cols-2">{showTemplates.map(t=><Link key={t.id} href={"/dashboard?kind="+filtered+"&template="+t.id+"#start"} className={"group flex min-h-36 flex-col justify-between rounded-2xl border p-5 transition "+(selected===t.id?"border-orange-400 bg-orange-500/10":"border-slate-700 bg-[#1b283c] hover:border-orange-400/70")}><span className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-300">{t.kind==="game"?"🎮 Game":t.kind==="app"?"📱 Ứng dụng":"🌐 Website"}</span><h3 className="text-base font-black">{t.name}</h3><p className="mt-2 flex-1 text-xs leading-6 text-slate-400">{t.description}</p><p className="mt-4 flex items-center gap-1 text-xs font-bold text-orange-200">{selected===t.id?"Đã chọn":"Dùng mẫu này"} <ChevronRight size={15}/></p></Link>)}{showTemplates.length===0&&<p className="text-sm text-slate-400">Chưa có mẫu phù hợp.</p>}</div>
     <aside className="h-max rounded-2xl border border-orange-500/30 bg-[#1c293d] p-6 lg:sticky lg:top-24">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold text-orange-300"><Sparkles size={17}/> Tạo sản phẩm</p><h3 className="mb-5 text-xl font-black">Dự án của bạn</h3>
      <form action={createProject} className="space-y-4">
       <label className="block text-xs font-semibold text-slate-200">Tên dự án<input name="name" required maxLength={120} placeholder="Tên website, game hoặc ứng dụng" className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3.5 text-sm text-white outline-none focus:border-orange-400"/></label>
       <label className="block text-xs font-semibold text-slate-200">Mẫu thiết kế<select key={selected??""} name="template_id" defaultValue={selected??""} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3.5 text-sm text-white"><option value="">Trang trắng</option>{templates.map(t=><option key={t.id} value={t.id}>{t.kind==="game"?"🎮":t.kind==="app"?"📱":"🌐"} {t.name}</option>)}</select></label>
       <p className="text-xs leading-5 text-slate-400">Dự án mới thuộc tài khoản của bạn. Không ghi đè dự án cũ.</p>
       <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black text-white hover:bg-orange-400"><Plus size={19}/> Tạo dự án ngay</button>
      </form>
     </aside>
    </div>
   </section>
  </div>
 </main>;
}
