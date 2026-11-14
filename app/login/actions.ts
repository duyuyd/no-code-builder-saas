"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
function getCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    redirect("/login?error=invalid");
  }
  return { email, password };
}
export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(getCredentials(formData));
  if (error) redirect("/login?error=signin");
  redirect("/builder");
}
export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !/^https?:\/\//.test(siteUrl)) redirect("/login?error=config");
  const { error } = await supabase.auth.signUp({
    ...getCredentials(formData),
    options: { emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback` },
  });
  if (error) redirect("/login?error=signup");
  redirect("/login?message=confirm");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
