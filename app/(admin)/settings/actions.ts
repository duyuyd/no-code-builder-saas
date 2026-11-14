"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export type SettingsFormState = { message: string; ok: boolean };
export async function updateSettings(_previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const title = String(formData.get("site_title") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? "");
  if (title.length < 2 || title.length > 120 || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return { ok: false, message: "Tiêu đề hoặc mã màu không hợp lệ." };
  }
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { ok: false, message: "Chưa đăng nhập." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
  if (profile?.role !== "admin") return { ok: false, message: "Không có quyền quản trị." };
  const { error } = await supabase.from("platform_settings").upsert([
    { key: "site_title", value: title },
    { key: "primary_color", value: primaryColor }
  ], { onConflict: "key" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã lưu cấu hình toàn hệ thống." };
}
