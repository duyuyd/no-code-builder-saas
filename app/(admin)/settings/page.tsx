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
    <div className="flex flex-wrap items-center gap-4"><Link href="/builder" className="brand-text text-sm underline">← Quay lại Builder</Link><Link href="/admin" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Trung tâm quản trị</Link></div>
    <h1 className="my-6 text-3xl font-bold">Cài đặt nền tảng</h1>
    <AdminSettingsForm title={siteTitle} color={primaryColor} />
    <nav aria-label="Tính năng SaaS" className="mt-6 grid gap-3 sm:grid-cols-2">
      <Link href="/admin/ai" className="rounded-xl border border-orange-500/30 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-orange-500">🤖 Cấu hình AI Gemini / DeepSeek / OpenAI</Link>
      <Link href="/domains" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-orange-500">🌐 Tên miền riêng</Link>
      <Link href="/sign" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-orange-500">✍️ Ký PDF</Link>
      <Link href="/pricing" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-orange-500">💳 Bảng giá SaaS</Link>
    </nav>
  </main>;
}
