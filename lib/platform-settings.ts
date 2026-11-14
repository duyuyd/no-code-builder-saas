import { createClient } from "@/lib/supabase/server";
export type SiteSettings = { siteTitle: string; primaryColor: string };
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platform_settings")
    .select("key,value").in("key", ["site_title", "primary_color"]);
  if (error) throw new Error(`Settings query failed: ${error.message}`);
  const values = new Map((data ?? []).map(({key,value}) => [key, value]));
  const siteTitle: unknown = values.get("site_title");
  const primaryColor: unknown = values.get("primary_color");
  if (typeof siteTitle !== "string" || !siteTitle.trim()) throw new Error("Missing site_title in platform_settings");
  if (typeof primaryColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    throw new Error("Invalid primary_color in platform_settings");
  }
  return { siteTitle, primaryColor };
}
