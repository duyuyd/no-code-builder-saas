"use client";
import {useCallback,useEffect,useState} from "react";
import {requestNativeBuild} from "@/app/native-build/actions";
import {useSupabase} from "@/lib/supabase/useSupabase";
import {createClient} from "@/lib/supabase/browser";
type Job={id:string;platform:string;status:string;error_message:string|null;artifact_key:string|null;created_at:string};
export default function NativeBuildPanel({projectId}:{projectId:string}){
 const [jobs,setJobs]=useState<Job[]>([]);
 const {readWithRetry}=useSupabase();
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  try{
   const rows=await readWithRetry(client=>client.from("build_jobs").select("id,platform,status,error_message,artifact_key,created_at")
     .eq("project_id",projectId).order("created_at",{ascending:false}).limit(20));
   setJobs(rows as Job[]);
  }catch(e){setMessage(e instanceof Error?e.message:"Mất kết nối Supabase.");}
 },[projectId,readWithRetry]);
 useEffect(()=>{
  void load();
  const timer=window.setInterval(()=>void load(),15000);
  const client=createClient();
  const channel=client.channel("native-builds:"+projectId).on("postgres_changes",{
   event:"*",schema:"public",table:"build_jobs",filter:"project_id=eq."+projectId
  },()=>void load()).subscribe();
  return()=>{window.clearInterval(timer);void client.removeChannel(channel);};
 },[load,projectId]);
 const start=async(platform:"android"|"ios")=>{
  if(busy)return;setBusy(true);setMessage("");
  try{const result=await requestNativeBuild(projectId,platform);setMessage(result.ok?"Đã gửi job "+result.id:result.error);await load();}
  catch{setMessage("Không kết nối được máy chủ build.");}finally{setBusy(false);}
 };
 return <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
  <h2 className="text-base font-bold">Xuất APK / IPA</h2>
  <a href={"/app-runtime?project="+projectId} className="inline-block rounded-lg border border-orange-500/40 px-3 py-2 text-xs text-orange-200">Mobile web runtime · QR preview</a>
  <p className="text-xs leading-5 text-slate-400">Dự án được biên dịch bất đồng bộ bằng GitHub Actions. File tải xuống từ Cloudflare R2 qua liên kết ngắn hạn. iOS cần cấu hình chứng chỉ ký và Expo. Không dùng file cài đặt giả.</p>
  <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void start("android")} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold disabled:opacity-50">Xuất APK</button>
  <button disabled={busy} onClick={()=>void start("ios")} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-bold text-orange-300 disabled:opacity-50">Xuất IPA</button></div>
  {message&&<p role="status" className="rounded-lg bg-slate-800 p-3 text-xs text-amber-200">{message}</p>}
  <div aria-live="polite" className="space-y-2">
   {jobs.map(job=><div key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 py-3 text-xs">
    <span className="font-medium">{job.platform.toUpperCase()} · {job.status} · {new Date(job.created_at).toLocaleString("vi-VN")}</span>
    {job.status==="completed"&&job.artifact_key?<a className="font-bold text-emerald-300 underline" href={"/api/native-build/download/"+job.id}>Tải file cài đặt</a>:null}
    {job.status==="failed"&&<span role="alert" className="text-rose-300">{job.error_message??"Build thất bại"}</span>}
   </div>)}
  </div>
 </section>;
}
