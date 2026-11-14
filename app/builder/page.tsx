import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Blocks, ChevronRight, CircleHelp, FolderPlus, LayoutDashboard, LogOut, Plus, Settings2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/platform-settings";
import { validateUiTree } from "@/lib/component-registry";
import BuilderWorkspace from "@/components/BuilderWorkspace";
import { createPage, createProject } from "./actions";
import { signOut } from "@/app/login/actions";

export default async function BuilderPage({ searchParams }: {
  searchParams: Promise<{ project?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) redirect("/login");

  const query = await searchParams;
  const { siteTitle } = await getSiteSettings();
  const {data:templates,error:templatesError}=await supabase.from("starter_templates").select("id,name,kind,description").eq("is_active",true).order("name");
  if(templatesError)throw new Error(templatesError.message);
  const { data: projects, error: projectsError } = await supabase.from("projects")
    .select("id,name,kind").order("created_at", { ascending: false });
  if (projectsError) throw new Error(projectsError.message);
  const project = query.project ? projects?.find(p => p.id === query.project) : projects?.[0];
  if (query.project && !project) notFound();

  if (!project) return <main className="flex min-h-dvh items-center justify-center bg-[#0f172a] px-5 py-10 text-slate-100">
    <section className="w-full max-w-lg rounded-3xl border border-slate-700/80 bg-[#1e293b] p-7 shadow-2xl sm:p-10">
      <div className="mb-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20"><Blocks size={23}/></span><span className="font-semibold tracking-tight">{siteTitle}</span></div>
        <form action={signOut}><button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white" title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={19}/></button></form>
      </div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300"><Sparkles size={13}/> Không gian sáng tạo</div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Tạo dự án đầu tiên</h1>
      <p className="mb-8 text-sm leading-6 text-slate-400">Thiết kế trang web với thao tác kéo thả, tùy chỉnh mọi thành phần và lưu trực tiếp vào không gian của bạn.</p>
      <form action={createProject} className="space-y-4">
        <label className="block text-sm font-medium text-slate-200" htmlFor="project-name">Tên dự án
          <input id="project-name" name="name" required maxLength={120} autoFocus placeholder="Nhập tên dự án của bạn" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/75 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"/>
        </label>
        <label className="block text-xs font-bold text-slate-300">Mẫu sản phẩm
          <select name="template_id" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-white"><option value="">Trang trắng</option>{(templates??[]).map(t=><option key={t.id} value={t.id}>{t.kind==="game"?"🎮":t.kind==="app"?"📱":"🌐"} {t.name}</option>)}</select>
        </label>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"><FolderPlus size={18}/>Tạo dự án<ChevronRight size={17}/></button>
      </form>
    </section>
  </main>;

  const { data: pages, error: pagesError } = await supabase.from("pages")
    .select("id,path,ui_tree,version").eq("project_id", project.id).order("path");
  if (pagesError) throw new Error(pagesError.message);
  const page = query.page ? pages?.find(p => p.id === query.page) : pages?.[0];
  if (query.page && !page) notFound();
  if (!page) throw new Error("Dự án chưa có trang. Hãy kiểm tra dữ liệu hoặc tạo trang đầu tiên.");
  if (!validateUiTree(page.ui_tree)) throw new Error("Cấu trúc giao diện đã lưu không hợp lệ.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const {data:published}=await supabase.from("published_pages").select("path").eq("project_id",project.id).eq("is_live",true).limit(1);

  return <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#0f172a] text-slate-100">
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-700/75 bg-[#0f172a] px-3 sm:px-5">
      <Link href="/builder" className="flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500" aria-label="Trang dự án">
        <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20"><Blocks size={19}/></span>
        <span className="hidden text-sm font-bold tracking-tight text-white sm:block">{siteTitle}</span>
      </Link>
      <span className="hidden text-slate-600 sm:block">/</span>
      <div className="flex min-w-0 items-center gap-2">
        <LayoutDashboard size={15} className="shrink-0 text-orange-400"/>
        <span className="max-w-36 truncate text-sm font-semibold text-slate-100 sm:max-w-64">{project.name}</span>
        <span className="hidden rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 md:inline">Không gian làm việc</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-300 hover:border-slate-600 hover:text-white [&::-webkit-details-marker]:hidden"><FolderPlus size={15}/><span className="hidden sm:inline">Dự án</span></summary>
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-800 p-3 shadow-2xl">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Dự án của tôi</p>
            <nav className="mb-3 max-h-48 space-y-1 overflow-y-auto">{(projects ?? []).map(p => <Link key={p.id} href={`/builder?project=${p.id}`} className={`block truncate rounded-lg px-3 py-2 text-sm transition ${p.id === project.id ? "bg-orange-500/15 font-semibold text-orange-300" : "text-slate-300 hover:bg-slate-700"}`}>{p.name}</Link>)}</nav>
            <form action={createProject} className="space-y-2"><input name="name" required maxLength={120} placeholder="Tên dự án mới" aria-label="Tên dự án mới" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-orange-500"/>
            <select name="template_id" className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-xs text-white"><option value="">Trang trắng</option>{(templates??[]).map(t=><option key={t.id} value={t.id}>{t.kind==="game"?"🎮":t.kind==="app"?"📱":"🌐"} {t.name}</option>)}</select>
            <button className="w-full rounded-lg bg-orange-500 p-2 text-xs font-bold text-white">Tạo sản phẩm</button></form>
          </div>
        </details>
        <details className="relative">
          <summary title="Dịch vụ SaaS" className="flex cursor-pointer list-none items-center rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2.5 text-sm text-slate-200 hover:text-orange-300 [&::-webkit-details-marker]:hidden">Dịch vụ</summary>
          <nav className="absolute right-0 z-50 mt-2 w-48 space-y-1 rounded-xl border border-slate-700 bg-[#1e293b] p-2 shadow-2xl">
            <Link href="/domains" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-700">🌐 Tên miền & thương hiệu</Link>
            <Link href="/sign" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-700">✍️ Ký tài liệu PDF</Link>
            <Link href="/pricing" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-700">💳 Bảng giá</Link>
          </nav>
        </details>
        {profile?.role === "admin" && <Link href="/settings" title="Cài đặt quản trị" aria-label="Cài đặt quản trị" className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-300 transition hover:text-orange-300"><Settings2 size={16}/></Link>}
        <form action={signOut}><button title="Đăng xuất" aria-label="Đăng xuất" className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-300 transition hover:text-white"><LogOut size={16}/></button></form>
      </div>
    </header>
    <div className="flex min-h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-700/70 bg-[#172235] px-3 sm:px-5">
      <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:flex"><LayoutDashboard size={13}/> Các trang <ChevronRight size={12}/></span>
      <nav aria-label="Trang trong dự án" className="flex min-w-0 items-center gap-1.5">{(pages ?? []).map(p => <Link key={p.id} href={`/builder?project=${project.id}&page=${p.id}`} className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${p.id === page.id ? "border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-100"}`}>{p.path}</Link>)}</nav>
      <details className="relative ml-auto shrink-0"><summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700 [&::-webkit-details-marker]:hidden"><Plus size={14}/> Trang</summary>
        <form action={createPage} className="absolute right-0 z-50 mt-2 flex w-64 gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-2xl"><input type="hidden" name="project_id" value={project.id}/><input name="path" required placeholder="/trang-moi" aria-label="Đường dẫn trang mới" className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-xs outline-none focus:border-orange-500"/><button className="rounded-lg bg-orange-500 px-2 text-white" title="Thêm trang" aria-label="Thêm trang"><Plus size={16}/></button></form>
      </details>
    </div>
    <BuilderWorkspace key={page.id} pageId={page.id} projectId={project.id} projectKind={project.kind} pagePath={page.path} previewPages={(pages??[]).map(p=>({path:p.path,ui_tree:p.ui_tree}))} initiallyPublished={Boolean(published?.length)} projectName={project.name} initialNodes={page.ui_tree} initialVersion={page.version}/>
  </div>;
}
