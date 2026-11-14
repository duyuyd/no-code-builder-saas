"use client";
import {useActionState,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Copy,Check,Landmark,ReceiptText,Send,ShieldAlert} from "lucide-react";
import {createManualOrder,markManualOrderSent,cancelManualOrder,type BillingState} from "@/app/checkout/actions";

const blank:BillingState={ok:false,message:""};
const money=(n:number)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n);
type Order={id:string;plan_code:string;amount_vnd:number;bank_code:string;account_number:string;account_name:string;transfer_code:string;status:string;created_at:string;reviewed_at:string|null;decision_note:string|null};
const labels:Record<string,string>={pending:"Chờ chuyển khoản",submitted:"Chờ Admin đối soát",paid:"Đã được xác nhận",rejected:"Từ chối",cancelled:"Đã hủy"};
function Feedback({state}:{state:BillingState}){return state.message?<p role="status" className={"rounded-xl p-3 text-sm "+(state.ok?"bg-emerald-950 text-emerald-300":"bg-rose-950 text-rose-300")}>{state.message}</p>:null;}
function CopyLine({label,value}:{label:string;value:string}){
 const [copied,setCopied]=useState(false);
 return <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
  <div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="break-all text-sm font-bold text-white">{value}</p></div>
  <button type="button" className="shrink-0 rounded-lg bg-slate-700 p-2 text-orange-300" title={"Sao chép "+label} onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);}catch{setCopied(false);}}}>{copied?<Check size={17}/>:<Copy size={17}/>}</button>
 </div>;
}
function OrderActions({order}:{order:Order}){
 const router=useRouter();
 const [sent,sendAction,sending]=useActionState(markManualOrderSent,blank);
 const [cancel,cancelAction,cancelling]=useActionState(cancelManualOrder,blank);
 useEffect(()=>{if(sent.ok||cancel.ok)router.refresh();},[sent.ok,cancel.ok,router]);
 return <>
  {order.status==="pending"&&<div className="mt-4 flex flex-wrap gap-3">
   <form action={sendAction}><input type="hidden" name="order_id" value={order.id}/><button disabled={sending} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16}/> Tôi đã chuyển khoản</button></form>
   <form action={cancelAction}><input type="hidden" name="order_id" value={order.id}/><button disabled={cancelling} className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-300 disabled:opacity-50">Hủy đơn</button></form>
  </div>}
  <Feedback state={sent}/><Feedback state={cancel}/>
 </>;
}
export default function CheckoutPanel({plan,enabled,price,orders}:{plan:"pro"|"agency";enabled:boolean;price:number;orders:Order[]}){
 const router=useRouter();
 const [result,createAction,creating]=useActionState(createManualOrder,blank);
 useEffect(()=>{if(result.ok)router.refresh();},[result.ok,router]);
 const active=orders.find(o=>["pending","submitted"].includes(o.status));
 return <div className="space-y-6">
  {!active&&enabled&&price>=1000&&<form action={createAction} className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
   <h2 className="text-lg font-bold">Đặt gói {plan.toUpperCase()}</h2><p className="mt-2 text-3xl font-black text-orange-300">{money(price)}</p>
   <p className="mt-3 text-sm leading-6 text-slate-300">Thanh toán chuyển khoản ngân hàng một lần cho yêu cầu cấp quyền gói; không tự động gia hạn. Sẽ chỉ cấp quyền sau khi Admin xác nhận tiền thật trên sao kê.</p>
   <input type="hidden" name="plan" value={plan}/>
   <button disabled={creating} className="mt-4 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50">{creating?"Đang tạo...":"Tạo đơn và nhận thông tin chuyển khoản"}</button>
   <div className="mt-3"><Feedback state={result}/></div>
  </form>}
  {!active&&(!enabled||price<1000)&&<div className="rounded-2xl border border-amber-700 bg-amber-950/20 p-5 text-sm text-amber-200">
    <ShieldAlert className="mb-3"/> Chủ nền tảng chưa bật nhận thanh toán hoặc chưa cấu hình giá gói. Không có tiền nào được thu. Bạn có thể gửi yêu cầu nâng cấp thủ công.
  </div>}
  {active&&<section className="space-y-3 rounded-2xl border border-orange-600/50 bg-[#1e293b] p-5 sm:p-7">
   <div className="flex items-center gap-3"><Landmark className="text-orange-400"/><h2 className="text-xl font-bold">Thông tin chuyển khoản</h2></div>
   <p className="text-sm text-amber-200">{labels[active.status]}. Hãy đối chiếu tên người nhận và số tài khoản trước khi chuyển. Tuyệt đối không chuyển lần thứ hai cho cùng đơn nếu đã thanh toán.</p>
   <CopyLine label="Ngân hàng" value={active.bank_code}/>
   <CopyLine label="Số tài khoản" value={active.account_number}/>
   <CopyLine label="Chủ tài khoản nhận tiền" value={active.account_name}/>
   <CopyLine label="Số tiền chính xác" value={money(active.amount_vnd)}/>
   <CopyLine label="Nội dung chuyển khoản (mã đối soát)" value={active.transfer_code}/>
   <p className="text-xs leading-6 text-slate-400">Lưu lại biên lai trong ứng dụng ngân hàng của bạn. Mã chuyển khoản là duy nhất và không chứa mật khẩu hoặc thông tin xác thực.</p>
   <OrderActions order={active}/>
  </section>}
  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ReceiptText size={19}/> Đơn hàng của tôi</h2>
   <div className="space-y-3">{orders.map(o=><article key={o.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
    <div><p className="font-semibold">{o.plan_code.toUpperCase()} · {money(o.amount_vnd)}</p><p className="mt-1 font-mono text-xs text-orange-300">{o.transfer_code}</p><p className="mt-1 text-xs text-slate-500">{new Date(o.created_at).toLocaleString("vi-VN")}</p>{o.decision_note&&<p className="mt-2 text-xs text-slate-300">{o.decision_note}</p>}</div>
    <span className={"rounded-lg px-3 py-1 text-xs "+(o.status==="paid"?"bg-emerald-950 text-emerald-300":o.status==="rejected"?"bg-rose-950 text-rose-300":"bg-slate-800 text-slate-300")}>{labels[o.status]??o.status}</span>
   </article>)}{orders.length===0&&<p className="text-sm text-slate-400">Chưa có đơn hàng.</p>}</div>
  </section>
 </div>;
}
