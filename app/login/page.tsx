import Link from "next/link";
import {ArrowLeft,ArrowRight,Blocks,CheckCircle2,Eye,Gamepad2,LockKeyhole,Mail,ShieldCheck,Sparkles,Workflow} from "lucide-react";
import {signIn,signUp} from "./actions";
import {getSiteSettings} from "@/lib/platform-settings";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export const metadata={title:"Đăng nhập và đăng ký — Studio"};
const errors:Record<string,string>={invalid:"Email không hợp lệ hoặc mật khẩu chưa đủ 8 ký tự.",signin:"Email hoặc mật khẩu không chính xác. Hãy thử lại.",signup:"Không thể tạo tài khoản. Email có thể đã đăng ký hoặc mật khẩu chưa đạt yêu cầu.",config:"Hệ thống xác nhận email chưa được cấu hình. Hãy liên hệ quản trị.",network:"Mất kết nối tới hệ thống đăng nhập. Kiểm tra mạng và thử lại."};
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string;message?:string;mode?:string}>}){
 const db=await createClient();
 const [{siteTitle},query,auth]=await Promise.all([getSiteSettings(),searchParams,db.auth.getUser().catch(()=>({data:{user:null}}))]);
 const user=auth.data.user;
 if(user)redirect("/dashboard");
 const register=query.mode==="register";
 return <main className="grid min-h-dvh grid-cols-1 bg-[#0b1221] text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
  <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#17243b] via-[#18273e] to-[#3f2519] p-10 lg:flex xl:p-16">
   <div className="pointer-events-none absolute -right-36 top-24 size-[550px] rounded-full border-[90px] border-orange-400/10" aria-hidden="true"/>
   <Link href="/" className="relative flex items-center gap-3 text-xl font-black"><span className="flex size-12 items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-900/30"><Blocks size={26}/></span>{siteTitle}</Link>
   <div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-200"><Sparkles size={14}/> Workspace sáng tạo</span>
    <h1 className="mt-7 max-w-xl text-4xl font-black leading-[1.13] xl:text-5xl">Bắt đầu một ý tưởng.<br/><span className="text-orange-300">Hoàn thiện một sản phẩm.</span></h1>
    <p className="mt-6 max-w-md text-sm leading-8 text-slate-300">Thiết kế website, giao diện ứng dụng và game từ mẫu có sẵn. Trải nghiệm một trình Builder dành cho cả cá nhân và đội nhóm.</p>
    <div className="mt-10 grid max-w-md gap-4">
     {[[Workflow,"Lưu & hoàn tác","Mọi lần chỉnh sửa có lịch sử thao tác."],[Gamepad2,"Khởi tạo nhanh","Mẫu giao diện, bản đồ game và tài nguyên có sẵn."],[ShieldCheck,"Bảo vệ dữ liệu","Dự án có quyền truy cập theo tài khoản trên Supabase."]].map(([Icon,title,desc],i)=>{const I=Icon as typeof Workflow;return <div key={String(i)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"><span className="flex size-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><I size={22}/></span><div><p className="text-sm font-bold">{String(title)}</p><p className="mt-1 text-xs text-slate-300">{String(desc)}</p></div></div>})}
    </div>
   </div>
   <p className="relative text-xs text-slate-400">Đăng nhập an toàn • Supabase Authentication</p>
  </aside>
  <section className="relative flex min-h-dvh flex-col justify-center px-4 py-8 sm:px-10 lg:px-12 xl:px-20">
   <div className="mx-auto w-full max-w-[465px]">
    <nav className="mb-10 flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={17}/> Trang chủ</Link><span className="flex items-center gap-2 text-sm font-bold lg:hidden"><Blocks size={19} className="text-orange-400"/>{siteTitle}</span></nav>
    <div className="mb-7"><div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300"><LockKeyhole size={28}/></div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">{register?"Tạo tài khoản mới":"Chào mừng trở lại"}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{register?"Đăng ký để lưu dự án và xây dựng sản phẩm của riêng bạn.":"Đăng nhập để mở không gian làm việc, dự án và thư viện mẫu."}</p></div>
    <nav aria-label="Chọn chế độ xác thực" className="mb-7 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-center text-sm font-bold"><Link href="/login" aria-current={!register?"page":undefined} className={"rounded-lg px-4 py-3 "+(!register?"bg-orange-500 text-white shadow-lg":"text-slate-400 hover:text-white")}>Đăng nhập</Link><Link href="/login?mode=register" aria-current={register?"page":undefined} className={"rounded-lg px-4 py-3 "+(register?"bg-orange-500 text-white shadow-lg":"text-slate-400 hover:text-white")}>Đăng ký</Link></nav>
    {query.error&&<div role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200">{errors[query.error]??"Không thể xác thực. Vui lòng thử lại."}</div>}
    {query.message==="confirm"&&<div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200"><Mail size={19} className="mt-0.5 shrink-0"/> Kiểm tra email và nhấn liên kết xác nhận trước khi đăng nhập.</div>}
    <form action={register?signUp:signIn} className="space-y-5 rounded-[24px] border border-slate-700 bg-[#182438] p-5 shadow-2xl shadow-black/20 sm:p-7">
     <label htmlFor="account-email" className="block text-sm font-semibold text-slate-200">Địa chỉ email<input id="account-email" name="email" type="email" required autoComplete="email" placeholder="ban@example.com" maxLength={254} className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] px-4 py-3.5 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"/></label>
     <label htmlFor="account-password" className="block text-sm font-semibold text-slate-200">Mật khẩu<input id="account-password" name="password" type="password" required minLength={8} maxLength={128} autoComplete={register?"new-password":"current-password"} placeholder="Tối thiểu 8 ký tự" className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] px-4 py-3.5 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"/></label>
     {register&&<p className="flex items-start gap-2 text-xs leading-6 text-slate-400"><CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-400"/> Tài khoản sẽ được tạo bằng Supabase. Có thể cần xác nhận qua email.</p>}
     <button type="submit" className="brand-bg flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:brightness-110">{register?"Tạo tài khoản và bắt đầu":"Đăng nhập vào Studio"} <ArrowRight size={18}/></button>
    </form>
    <div className="mt-7 flex flex-col items-center gap-3 text-center text-xs text-slate-400"><p className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-400"/> Chúng tôi không yêu cầu OTP ngân hàng hoặc thông tin thẻ.</p><p>Quên mật khẩu? <Link href="/reset-password" className="font-semibold text-orange-300 underline underline-offset-4">Đặt lại mật khẩu qua email</Link></p></div>
   </div>
  </section>
 </main>;
}
