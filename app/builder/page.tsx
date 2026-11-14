import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  const { data: projects, error: projectsError } = await supabase.from("projects")
    .select("id,name").order("created_at", {ascending: false});
  if (projectsError) throw new Error(projectsError.message);
  const project = query.project ? projects?.find(p => p.id === query.project) : projects?.[0];
  if (query.project && !project) notFound();
  if (!project) return <main className="mx-auto max-w-xl p-6">
    <header className="mb-10 flex items-center justify-between"><h1 className="text-2xl font-bold">{siteTitle}</h1><form action={signOut}><button className="text-sm underline">Đăng xuất</button></form></header>
    <h2 className="mb-4 text-xl font-semibold">Tạo dự án đầu tiên</h2>
    <form action={createProject} className="flex flex-col gap-3 rounded-xl border bg-white p-6">
      <label className="text-sm">Tên dự án<input required maxLength={120} name="name" className="mt-2 w-full rounded border p-3" /></label>
      <button className="brand-bg rounded p-3 font-semibold text-white">Tạo dự án</button>
    </form>
  </main>;
  const { data: pages, error: pagesError } = await supabase.from("pages")
    .select("id,path,ui_tree,version").eq("project_id", project.id).order("path");
  if (pagesError) throw new Error(pagesError.message);
  const page = query.page ? pages?.find(p => p.id === query.page) : pages?.[0];
  if (query.page && !page) notFound();
  if (!page) throw new Error("Project has no pages. Check database or create the initial page.");
  if (!validateUiTree(page.ui_tree)) throw new Error("Stored page contains an invalid UI tree.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return <div className="flex h-dvh flex-col overflow-hidden">
    <header className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-3">
      <h1 className="mr-2 font-bold">{siteTitle}</h1>
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        {(projects ?? []).map(p => <Link key={p.id} href={`/builder?project=${p.id}`} className={p.id === project.id ? "brand-text font-bold" : "text-slate-600"}>{p.name}</Link>)}
      </nav>
      <form action={createProject} className="flex items-center gap-1"><input name="name" required maxLength={120} placeholder="Tên dự án mới" aria-label="Tên dự án mới" className="w-32 rounded border px-2 py-1 text-xs" /><button className="text-xs underline">Tạo</button></form>
      <div className="ml-auto flex items-center gap-3 text-xs">
        {profile?.role === "admin" && <Link href="/settings" className="brand-text font-semibold">Admin</Link>}
        <form action={signOut}><button className="underline">Đăng xuất</button></form>
      </div>
    </header>
    <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-2 text-xs">
      {(pages ?? []).map(p => <Link key={p.id} href={`/builder?project=${project.id}&page=${p.id}`} className={`rounded px-2 py-1 ${p.id === page.id ? "brand-bg text-white" : "border bg-white"}`}>{p.path}</Link>)}
      <form action={createPage} className="ml-auto flex gap-1"><input type="hidden" name="project_id" value={project.id} /><input name="path" placeholder="/new-page" required className="w-28 rounded border px-2 py-1"/><button className="underline">Thêm trang</button></form>
    </div>
    <BuilderWorkspace key={page.id} pageId={page.id} pagePath={page.path} projectName={project.name} initialNodes={page.ui_tree} initialVersion={page.version}/>
  </div>;
}
