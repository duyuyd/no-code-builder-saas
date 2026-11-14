"use client";
import {useActionState,useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Users,FolderKanban,Wallet,ShieldCheck,Search,CheckCircle2,Clock3,Settings2,ReceiptText} from "lucide-react";
import {changeUserPlan,updatePricingPlan,type AdminActionState} from "@/app/admin/actions";
import ProjectLifecycleControls from "@/components/ProjectLifecycleControls";

export type Member={id:string;email:string|null;display_name:string;role:string;plan:string;registered_at:string;confirmed_at:string|null;last_sign_in_at:string|null;project_count:number};
export type ManagedProject={id:string;owner_id:string;name:string;kind:string;created_at:string;archived_at:string|null};
export type PriceTier={code:string;name:string;priceLabel:string;description:string;features:string[];available:boolean;visible?:boolean};
export type AuditItem={id:number;actor_id:string|null;target_user_id:string|null;action:string;details:unknown;created_at:string};
const initial:AdminActionState={ok:false,message:""};
const controls="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500";
function date(s:string|null){return s?new Date(s).toLocaleString("vi-VN"):"Chưa có";}
function feedback(state:AdminActionState){return state.message?<p role="status" className={"mt-2 text-xs "+(state.ok?"text-emerald-300":"text-rose-300")}>{state.message}</p>:null;}
function MemberPlanForm({member}:{member:Member}){
 const router=useRouter();
 const [state,action,pending]=useActionState(changeUserPlan,initial);
 useEffect(()=>{if(state.ok)router.refresh();},[state,router]);
 return <form action={action} className="flex flex-wrap items-center gap-2">
   <input type="hidden" name="user_id" value={member.id}/>
   <select name="plan" defaultValue={member.plan} aria-label={"Gói của "+(member.email||member.id)} className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-xs">
    {["free","pro","agency"].map(plan=><option value={plan} key={plan}>{plan.toUpperCase()}</option>)}
   </select>
   <button disabled={pending} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending?"Đang lưu...":"Cấp gói"}</button>
   {feedback(state)}
 </form>;
}
function TierEditor({tier}:{tier:PriceTier}){
 const router=useRouter();
 const [state,action,pending]=useActionState(updatePricingPlan,initial);
 useEffect(()=>{if(state.ok)router.refresh();},[state,router]);
 return <form action={action} className="space-y-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
  <input type="hidden" name="code" value={tier.code}/>
  <div className="flex items-center justify-between"><h3 className="font-bold uppercase text-orange-300">{tier.code}</h3><span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400">{tier.code==="free"?"Truy cập miễn phí":"Chưa có checkout"}</span></div>
  <label className="block text-xs text-slate-300">Tên gói<input name="name" required minLength={2} maxLength={50} defaultValue={tier.name} className={"mt-1 "+controls}/></label>
  <label className="block text-xs text-slate-300">Giá hiển thị (chỉ là nội dung)<input name="priceLabel" required maxLength={80} defaultValue={tier.priceLabel} className={"mt-1 "+controls}/></label>
  <label className="block text-xs text-slate-300">Mô tả<textarea name="description" required minLength={5} maxLength={500} defaultValue={tier.description} className={"mt-1 min-h-20 "+controls}/></label>
  <label className="block text-xs text-slate-300">Quyền lợi (mỗi dòng một mục)<textarea name="features" required rows={5} defaultValue={tier.features.join("\n")} className={"mt-1 "+controls}/></label>
  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200"><input type="checkbox" name="visible" defaultChecked={tier.visible!==false} className="size-4 accent-orange-500"/>Hiển thị gói trên trang /pricing</label>
  <button disabled={pending} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending?"Đang lưu...":"Lưu cấu hình gói"}</button>
  {feedback(state)}
 </form>;
}
export default function AdminDashboard({members,projects,plans,audit}:{members:Member[];projects:ManagedProject[];plans:PriceTier[];audit:AuditItem[]}){
 const [memberQuery,setMemberQuery]=useState("");
 const [projectQuery,setProjectQuery]=useState("");
 const [scope,setScope]=useState<"active"|"trash"|"all">("active");
 const ownerLookup=useMemo(()=>new Map(members.map(m=>[m.id,m])),[members]);
 const visibleMembers=members.filter(m=>(m.email??"").toLowerCase().includes(memberQuery.toLowerCase())||m.display_name.toLowerCase().includes(memberQuery.toLowerCase()));
 const visibleProjects=projects.filter(p=>(scope==="all"||(scope==="trash"?Boolean(p.archived_at):!p.archived_at))&&
 (p.name.toLowerCase().includes(projectQuery.toLowerCase())||(ownerLookup.get(p.owner_id)?.email??"").toLowerCase().includes(projectQuery.toLowerCase())));
 const active=projects.filter(p=>!p.archived_at).length;
 const trash=projects.length-active;
 return <div className="space-y-10">
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><Users className="mb-4 text-orange-400"/><p className="text-3xl font-bold">{members.length}</p><p className="mt-1 text-xs text-slate-400">Tài khoản đăng ký</p></div>
   <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><FolderKanban className="mb-4 text-orange-400"/><p className="text-3xl font-bold">{active}</p><p className="mt-1 text-xs text-slate-400">Dự án đang hoạt động · {trash} trong Thùng rác</p></div>
   <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><Wallet className="mb-4 text-orange-400"/><p className="text-xl font-bold">Chưa kết nối</p><p className="mt-1 text-xs text-slate-400">Cổng thanh toán · chưa có doanh thu xác minh</p></div>
  </div>
  <section id="members" className="scroll-mt-6">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><Users size={22}/> Người đăng ký</h2><p className="mt-1 text-sm text-slate-400">Email, trạng thái xác minh, đăng nhập và cấp gói thủ công. Chỉ Admin được xem.</p></div>
    <div className="flex items-center rounded-xl border border-slate-600 bg-slate-900 px-3"><Search size={16} className="text-slate-500"/><input aria-label="Tìm người dùng" value={memberQuery} onChange={e=>setMemberQuery(e.target.value)} placeholder="Tìm email, tên..." className="w-48 bg-transparent p-3 text-xs outline-none"/></div></div>
   <div className="space-y-3">{visibleMembers.map(m=><article key={m.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
    <div className="min-w-0"><p className="break-all font-semibold">{m.email??"Chưa có email"}</p><p className="text-xs text-slate-400">{m.display_name||"Chưa đặt tên"} · {m.role==="admin"?"Quản trị viên":"Thành viên"} · {m.project_count} dự án</p>
     <p className="mt-1 text-xs text-slate-500">Đăng ký {date(m.registered_at)} · Truy cập gần nhất {date(m.last_sign_in_at)}</p></div>
    <div className="flex flex-wrap items-center gap-2 text-xs">{m.confirmed_at?<span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={15}/>Email đã xác minh</span>:<span className="flex items-center gap-1 text-amber-300"><Clock3 size={15}/>Chờ xác minh</span>}</div>
    <MemberPlanForm member={m}/>
   </article>)}{visibleMembers.length===0&&<p className="rounded-xl border border-slate-700 p-6 text-sm text-slate-400">Không tìm thấy tài khoản.</p>}</div>
  </section>
  <section id="projects" className="scroll-mt-6">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><FolderKanban size={22}/> Dự án và Thùng rác</h2><p className="mt-1 text-sm text-slate-400">Chuyển vào Thùng rác trước; sau đó có thể khôi phục hoặc xóa vĩnh viễn bằng tên xác nhận.</p></div>
    <div className="flex flex-wrap gap-2">
    {(["active","trash","all"] as const).map(s=><button type="button" key={s} onClick={()=>setScope(s)} className={"rounded-xl border px-3 py-2 text-xs "+(scope===s?"border-orange-500 bg-orange-500/10 text-orange-300":"border-slate-700 text-slate-400")}>{s==="active"?"Đang dùng":s==="trash"?"Thùng rác":"Tất cả"}</button>)}
    </div></div>
   <input aria-label="Tìm dự án" placeholder="Tìm theo tên dự án hoặc email chủ sở hữu" value={projectQuery} onChange={e=>setProjectQuery(e.target.value)} className={"mb-3 "+controls}/>
   <div className="space-y-3">{visibleProjects.map(p=><article key={p.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
    <div className="min-w-0"><p className="truncate font-bold">{p.name}</p><p className="text-xs text-slate-400">{p.kind} · {ownerLookup.get(p.owner_id)?.email??p.owner_id} · Tạo {date(p.created_at)}</p>
    <p className={"mt-2 text-xs "+(p.archived_at?"text-amber-300":"text-emerald-300")}>{p.archived_at?"Trong Thùng rác":"Đang hoạt động"}</p></div>
    <ProjectLifecycleControls project={p}/>
   </article>)}{visibleProjects.length===0&&<p className="rounded-xl border border-slate-700 p-6 text-sm text-slate-400">Không có dự án trong mục này.</p>}</div>
  </section>
  <section id="plans" className="scroll-mt-6"><h2 className="mb-1 flex items-center gap-2 text-xl font-bold"><Settings2 size={22}/> Giá và quyền lợi gói</h2><p className="mb-5 text-sm text-slate-400">Admin chỉnh nội dung công khai ngay tại đây. Cấp Pro/Agency bằng tay ở phần người dùng; việc thu tiền tự động chưa tích hợp.</p>
   <div className="grid gap-4 md:grid-cols-3">{plans.map(t=><TierEditor tier={t} key={t.code}/>)}</div>
  </section>
  <section id="billing" className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><ReceiptText size={21}/> Thanh toán và nâng cấp</h2>
   <p className="mt-3 text-sm leading-6 text-slate-300">Bạn có toàn quyền chỉnh giá hiển thị, quyền lợi và cấp gói cho tài khoản. Chưa có cổng thanh toán, webhook hay giao dịch xác minh nên hệ thống <strong>không tự thu tiền</strong> và không tự động cấp quyền sau thanh toán.</p>
   <div className="mt-4 flex flex-wrap gap-3"><Link href="/pricing" className="inline-flex rounded-lg border border-orange-600 px-3 py-2 text-sm text-orange-300">Kiểm tra trang giá công khai</Link><Link href="/admin/requests" className="inline-flex rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white">Duyệt yêu cầu người dùng</Link></div>
  </section>
  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ShieldCheck size={21}/> Nhật ký thao tác</h2>
   <div className="space-y-2">{audit.map(e=><p key={e.id} className="break-words border-b border-slate-700 pb-2 text-xs text-slate-400"><span className="text-slate-100">{e.action}</span> · {date(e.created_at)} · {JSON.stringify(e.details).slice(0,180)}</p>)}{audit.length===0&&<p className="text-sm text-slate-400">Chưa có thao tác quản trị được ghi nhận.</p>}</div>
  </section>
 </div>;
}
