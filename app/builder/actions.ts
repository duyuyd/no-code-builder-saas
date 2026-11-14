"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateUiTree, type BuilderNode } from "@/lib/component-registry";
export type SaveResult = { ok: true; version: number } | { ok: false; error: string };
export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 120) throw new Error("Tên dự án không hợp lệ.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: project, error } = await supabase.from("projects")
    .insert({ owner_id: user.id, name }).select("id").single();
  if (error || !project) throw new Error(error?.message ?? "Không thể tạo dự án.");
  const { error: pageError } = await supabase.from("pages")
    .insert({ project_id: project.id, path: "/", ui_tree: [] });
  if (pageError) {
    await supabase.from("projects").delete().eq("id", project.id);
    throw new Error(pageError.message);
  }
  revalidatePath("/builder");
  redirect(`/builder?project=${project.id}`);
}
export async function createPage(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const path = String(formData.get("path") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(projectId) || !/^\/[a-z0-9/_-]*$/i.test(path) || path.length > 120) throw new Error("Đường dẫn không hợp lệ.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("pages")
    .insert({ project_id: projectId, path, ui_tree: [] }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Không thể tạo trang.");
  revalidatePath("/builder");
  redirect(`/builder?project=${projectId}&page=${data.id}`);
}
export async function savePageTree(pageId: string, tree: BuilderNode[], expectedVersion: number): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(pageId) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, error: "Tham số trang không hợp lệ." };
  }
  if (!validateUiTree(tree) || JSON.stringify(tree).length > 600000) return {ok: false, error: "Cây UI không hợp lệ hoặc quá lớn."};
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return {ok: false, error: "Phiên đăng nhập đã hết hạn."};
  const { data, error } = await supabase.from("pages")
    .update({ ui_tree: tree })
    .eq("id", pageId).eq("version", expectedVersion)
    .select("version").maybeSingle();
  if (error) return {ok: false, error: error.message};
  if (!data) return {ok: false, error: "Xung đột phiên bản hoặc không có quyền chỉnh sửa. Tải lại trang trước khi lưu."};
  revalidatePath("/builder");
  return {ok: true, version: data.version as number};
}
