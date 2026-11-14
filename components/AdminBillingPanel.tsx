"use client";
import {useActionState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {Landmark,ShieldCheck,Receipt,CheckCircle2} from "lucide-react";
import {saveManualBilling,reviewManualOrder,type BillingState} from "@/app/checkout/actions";
const blank:BillingState={ok:false,message:""};
const field="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-white outline-none focus:border-orange-500";
type Order={id:string;user_id:string;plan_code:string;amount_vnd:number;bank_code:string;account_number:string;account_name:string;transfer_code:string;status:string;created_at:string;submitted_at:string|null;decision_note:string|null};
function Feedback({state}:{state:BillingState}){return state.message?<p role="status" className={"mt-3 rounded-xl p-3 text-sm "+(state.ok?"bg-emerald-950 text-emerald-300":"bg-rose-950 text-rose-300")}>{state.message}</p>:null;}
export function BankSettings({settings,prices}:{settings:{enabled?:boolean;bankCode?:string;accountNumber?:string;accountName?:string;notice?:string};prices:{pro:number;agency:number}}){
 const router=useRouter();
 const [state,action,pending]=useActionState(saveManualBilling,blank);
 useEffect(()=>{if(state.ok)router.refresh();},[state.ok,router]);
 return <form action={action} className="space-y-4 rounded-2xl border border-slate-700 bg-[#1e293b] p-5 sm:p-7">
  <h2 className="flex items-center gap-2 text-xl font-bold"><Landmark className="text-orange-400"/> Ngân hàng nhận tiền</h2>
  <p className="text-sm text-slate-400">Nhập thông tin tài khoản thật của bạn. Dữ liệu ngân hàng sẽ được hiển thị cho khách khi tạo đơn; không nhập mật khẩu, mã OTP hoặc khóa API.</p>
  <label className="block text-sm text-slate-300">Mã ngân hàng (VD: MB, VCB, ACB)<input name="bankCode" maxLength={20} defaultValue={settings.bankCode??""} placeholder="Mã ngân hàng nhận tiền" className={field}/></label>
  <label className="block text-sm text-slate-300">Số tài khoản<input name="accountNumber" inputMode="numeric" maxLength={22} defaultValue={settings.accountNumber??""} placeholder="Số tài khoản của bạn" className={field}/></label>
  <label className="block text-sm text-slate-300">Tên người thụ hưởng<input name="accountName" maxLength={100} defaultValue={settings.accountName??""} placeholder="Tên tài khoản ngân hàng" className={field}/></label>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="block text-sm text-slate-300">Giá Pro (VND, thu một lần)<input name="proVnd" type="number" step="1000" min="0" max="100000000" defaultValue={prices.pro} className={field}/></label>
   <label className="block text-sm text-slate-300">Giá Agency (VND, thu một lần)<input name="agencyVnd" type="number" step="1000" min="0" max="100000000" defaultValue={prices.agency} className={field}/></label>
  </div>
  <label className="block text-sm text-slate-300">Lưu ý cho khách<textarea name="notice" maxLength={400} rows={2} defaultValue={settings.notice??""} className={field}/></label>
  <label className="flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-950/20 p-4 text-sm text-amber-200"><input type="checkbox" name="enabled" defaultChecked={settings.enabled===true} className="mt-1 size-4 accent-orange-500"/><span><strong>Bật nhận đơn chuyển khoản thật</strong>. Admin phải tự kiểm tra sao kê ngân hàng trước khi xác nhận đơn đã thanh toán; hệ thống không tự xác minh tiền về.</span></label>
  <button disabled={pending} className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50">{pending?"Đang lưu...":"Lưu cấu hình thanh toán"}</button>
  <Feedback state={state}/>
 </form>;
}
export function ReviewOrder({order,email}:{order:Order;email:string}){
 const router=useRouter();
 const [state,action,pending]=useActionState(reviewManualOrder,blank);
 useEffect(()=>{if(state.ok)router.refresh();},[state.ok,router]);
 return <article className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><p className="break-all text-sm font-bold">{email}</p><p className="mt-2 text-lg font-extrabold">{order.plan_code.toUpperCase()} · {new Intl.NumberFormat("vi-VN").format(order.amount_vnd)} ₫</p><p className="mt-1 font-mono text-xs text-orange-300">{order.transfer_code}</p><p className="mt-2 text-xs text-slate-400">Người nhận: {order.account_name} · {order.bank_code} · {order.account_number}</p><p className="mt-1 text-xs text-slate-400">Ngày tạo: {new Date(order.created_at).toLocaleString("vi-VN")}</p></div>
   <span className={"rounded-lg px-3 py-1 text-xs "+(order.status==="paid"?"bg-emerald-950 text-emerald-300":order.status==="submitted"?"bg-amber-950 text-amber-300":"bg-slate-900 text-slate-300")}>{order.status==="submitted"?"Chờ đối soát":order.status==="paid"?"Đã ghi nhận":order.status==="rejected"?"Từ chối":order.status}</span>
  </div>
  {order.status==="submitted"&&<form action={action} className="mt-4 space-y-3 border-t border-slate-700 pt-4">
   <p className="flex items-start gap-2 text-xs leading-5 text-amber-200"><ShieldCheck size={16} className="shrink-0"/> Chỉ xác nhận đã nhận tiền khi sao kê ngân hàng hiển thị đúng mã chuyển khoản, số tiền và tài khoản thụ hưởng. Không tin riêng nút “Tôi đã chuyển khoản”.</p>
   <input type="hidden" name="order_id" value={order.id}/>
   <label className="block text-xs text-slate-300">Mã giao dịch ngân hàng / ghi chú kiểm chứng<input name="note" required minLength={5} maxLength={500} className={field}/></label>
   <div className="flex flex-wrap gap-2"><button disabled={pending} name="decision" value="paid" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 size={16}/> Đã nhận tiền, cấp gói</button>
    <button disabled={pending} name="decision" value="rejected" formNoValidate className="rounded-lg border border-rose-700 px-4 py-2 text-sm font-bold text-rose-300 disabled:opacity-50">Từ chối</button></div>
   <Feedback state={state}/>
  </form>}
  {order.decision_note&&<p className="mt-3 text-xs text-slate-400">Đối soát: {order.decision_note}</p>}
 </article>;
}
