import { signIn, signUp } from "./actions";
import { getSiteSettings } from "@/lib/platform-settings";
export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { siteTitle } = await getSiteSettings();
  const query = await searchParams;
  return <main className="flex min-h-dvh items-center justify-center p-5">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">{siteTitle}</h1>
      <p className="mb-6 text-sm text-slate-600">Đăng nhập hoặc tạo tài khoản để quản lý dự án.</p>
      {query.error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">Không thể xác thực. Kiểm tra email, mật khẩu và cấu hình Supabase.</p>}
      {query.message && <p role="status" className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">Kiểm tra email xác nhận trước khi đăng nhập.</p>}
      <form className="space-y-4">
        <label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border p-2.5" /></label>
        <label className="block text-sm">Mật khẩu<input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-1 w-full rounded border p-2.5" /></label>
        <div className="grid grid-cols-2 gap-3">
          <button formAction={signIn} className="brand-bg rounded p-3 font-semibold text-white">Đăng nhập</button>
          <button formAction={signUp} className="rounded border border-slate-300 p-3 font-semibold">Đăng ký</button>
        </div>
      </form>
    </section>
  </main>;
}
