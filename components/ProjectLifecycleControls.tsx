"use client";
import {useActionState,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArchiveRestore,Trash2,Archive,LoaderCircle} from "lucide-react";
import {changeProjectLifecycle,type AdminActionState} from "@/app/admin/actions";

const initial:AdminActionState={ok:false,message:""};
export default function ProjectLifecycleControls({project}:{project:{id:string;name:string;archived_at:string|null}}){
 const router=useRouter();
 const [state,action,pending]=useActionState(changeProjectLifecycle,initial);
 const [confirmName,setConfirmName]=useState("");
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(state.ok){setConfirmName("");setOpen(false);router.refresh();}},[state,router]);
 return <div className="space-y-2">
  <form action={action} className="inline-flex">
   <input type="hidden" name="project_id" value={project.id}/>
   <button type="submit" name="operation" value={project.archived_at?"restore":"archive"} disabled={pending}
    onClick={e=>{if(!project.archived_at&&!window.confirm("Chuyển “"+project.name+"” vào Thùng rác? Trang công khai sẽ được ngừng xuất bản."))e.preventDefault();}}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-orange-400 disabled:opacity-50">
    {pending?<LoaderCircle size={15} className="animate-spin"/>:project.archived_at?<ArchiveRestore size={15}/>:<Archive size={15}/>}
    {project.archived_at?"Khôi phục":"Thùng rác"}
   </button>
  </form>
  {project.archived_at&&<>
    <button onClick={()=>setOpen(v=>!v)} type="button" className="ml-2 inline-flex items-center gap-1 rounded-xl border border-rose-700 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/50"><Trash2 size={15}/>Xóa vĩnh viễn</button>
    {open&&<form action={action} className="max-w-md space-y-3 rounded-xl border border-rose-700/70 bg-rose-950/30 p-4">
      <input type="hidden" name="project_id" value={project.id}/>
      <p className="text-sm text-rose-200">Không thể hoàn tác. Các trang, bản đã xuất bản và dữ liệu liên quan sẽ bị xóa. Nhập chính xác tên dự án để xác nhận:</p>
      <strong className="block break-all text-sm text-white">{project.name}</strong>
      <input name="confirmation" value={confirmName} onChange={e=>setConfirmName(e.target.value)} autoComplete="off" required placeholder="Nhập tên dự án" className="w-full rounded-lg border border-rose-500 bg-slate-950 p-3 text-sm text-white"/>
      <button type="submit" name="operation" value="delete" disabled={pending||confirmName!==project.name} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-30">Xác nhận xóa vĩnh viễn</button>
    </form>}
  </>}
  {state.message&&<p role="status" className={"max-w-md text-xs "+(state.ok?"text-emerald-300":"text-rose-300")}>{state.message}</p>}
 </div>;
}
