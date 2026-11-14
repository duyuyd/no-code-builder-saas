import Link from "next/link";
import {ArrowLeft,Blocks,KeyRound,Mail,ShieldCheck} from "lucide-react";
import {getSiteSettings} from "@/lib/platform-settings";
import {requestPasswordReset,updatePassword} from "./actions";
export const dynamic="force-dynamic";
export const metadata={title:"Khôi phục mật khẩu — Studio",robots:{index:false,follow:false}};
const messages:Record<string,string>={invalid:"Địa chỉ email không hợp lệ.",config:"Hệ thống email chưa được cấu hình.",send:"Không thể gửi email khôi phục. Hãy thử lại sau.",mismatch:"Hai mật khẩu phải trùng nhau và có ít nhất 8 ký tự.",expired:"Phiên đặt lại đã hết hạn. Hãy yêu cầu email mới.",update:"Không thể đổi mật khẩu. Hãy yêu cầu email mới và thử lại."};
export default async function ResetPassword({searchParams}:{searchParams:Promise<{mode?:string;error?:string;message?:string}>}){
 const [{siteTitle},query]=await Promise.all([getSiteSettings(),searchParams]);
 const updating=query.mode==="update";
 return <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#0b1221] via-[#17243b] to-[#3f2519] px-4 py-12 text-white">
  <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#182438] p-6 shadow-2xl sm:p-9">
   <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={17}/> Trở về đăng nhập</Link>
   <div className="mb-5 flex items-center gap-3 text-sm font-black"><span className="flex size-11 items-center justify-center rounded-xl bg-orange-500"><Blocks size={23}/></span>{siteTitle}</div>
   <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">{updating?<KeyRound size={26}/>:<Mail size={26}/>}</div>
   <h1 className="text-2xl font-black sm:text-3xl">{updating?"Đặt mật khẩu mới":"Khôi phục tài khoản"}</h1>
   <p className="mt-3 text-sm leading-7 text-slate-300">{updating?"Nhập mật khẩu mới để tiếp tục làm việc.":"Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu nếu tài khoản tồn tại."}</p>
   {query.error&&<p role="alert" className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{messages[query.error]??"Có lỗi xảy ra."}</p>}
   {query.message==="sent"&&<p role="status" className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Nếu email được đăng ký, bạn sẽ nhận được liên kết khôi phục. Kiểm tra cả hộp thư Spam.</p>}
   <form action={updating?updatePassword:requestPasswordReset} className="mt-7 space-y-4">
    {updating?<><label className="block text-sm font-semibold">Mật khẩu mới<input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3.5 outline-none focus:border-orange-500"/></label><label className="block text-sm font-semibold">Nhập lại mật khẩu<input name="confirm" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3.5 outline-none focus:border-orange-500"/></label></>:<label className="block text-sm font-semibold">Email tài khoản<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="ban@example.com" required className="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] p-3.5 outline-none focus:border-orange-500"/></label>}
    <button className="w-full rounded-xl bg-orange-500 p-4 text-sm font-black text-white hover:bg-orange-400">{updating?"Lưu mật khẩu mới":"Gửi liên kết khôi phục"}</button>
   </form>
   <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-slate-400"><ShieldCheck size={16} className="mt-1 shrink-0 text-emerald-400"/> Không chia sẻ liên kết đặt lại mật khẩu với người khác.</p>
  </div>
 </main>;
}
