import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/platform-settings";
import AdminSettingsForm from "@/components/AdminSettingsForm";
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") notFound();
  const { siteTitle, primaryColor } = await getSiteSettings();
  return <main className="mx-auto max-w-2xl p-6">
    <Link href="/builder" className="brand-text text-sm underline">← Quay lại Builder</Link>
    <h1 className="my-6 text-3xl font-bold">Admin Settings</h1>
    <AdminSettingsForm title={siteTitle} color={primaryColor} />
  </main>;
}
