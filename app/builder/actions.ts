"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateUiTree, type BuilderNode } from "@/lib/component-registry";
import { mergeUiTrees } from "@/lib/merge-ui-tree";
export type SaveResult = { ok: true; version: number; tree: BuilderNode[] } | { ok: false; error: string; reason?: "conflict" | "forbidden" | "invalid" };
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
export async function savePageTree(pageId: string, tree: BuilderNode[], expectedVersion: number, baseTree: BuilderNode[]): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(pageId) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, reason: "invalid", error: "Tham số trang không hợp lệ." };
  }
  if (!validateUiTree(tree) || !validateUiTree(baseTree) || JSON.stringify(tree).length > 600000 || JSON.stringify(baseTree).length > 600000) {
    return { ok: false, reason: "invalid", error: "Dữ liệu trang không hợp lệ hoặc quá lớn." };
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { ok: false, reason: "forbidden", error: "Phiên đăng nhập đã hết hạn." };

  let mergedTree = tree;
  let version = expectedVersion;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase.from("pages")
      .update({ ui_tree: mergedTree })
      .eq("id", pageId)
      .eq("version", version)
      .select("version").maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (data) return { ok: true, version: data.version as number, tree: mergedTree };

    // Read back under RLS to distinguish a genuine version conflict from denied access.
    const { data: current, error: readError } = await supabase.from("pages")
      .select("version,ui_tree").eq("id", pageId).maybeSingle();
    if (readError) return { ok: false, error: readError.message };
    if (!current) return { ok: false, reason: "forbidden", error: "Bạn không có quyền chỉnh sửa hoặc trang đã bị xóa." };
    if (!validateUiTree(current.ui_tree)) return { ok: false, reason: "invalid", error: "Dữ liệu trên máy chủ bị lỗi." };

    const combined = mergeUiTrees(baseTree, tree, current.ui_tree);
    if (!combined || !validateUiTree(combined) || JSON.stringify(combined).length > 600000) {
      return { ok: false, reason: "conflict", error: "Có thay đổi trùng nhau từ phiên khác. Bản nháp vẫn được giữ trên thiết bị; chưa ghi đè dữ liệu trên Supabase." };
    }
    mergedTree = combined;
    version = current.version;
  }
  return { ok: false, reason: "conflict", error: "Trang đang được cập nhật ở phiên khác. Bản nháp của bạn vẫn được giữ." };
}
