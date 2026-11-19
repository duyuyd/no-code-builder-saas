"use client";
import {useState,useRef} from "react";
import dynamic from "next/dynamic";
import {Download,Film,LoaderCircle} from "lucide-react";
import {NuvoraVideoComposition} from "@/components/video/NuvoraVideoComposition";
import type {BuilderNode} from "@/lib/component-registry";
const Preview=dynamic(()=>import("@remotion/player").then(m=>m.Player),{ssr:false,loading:()=> <div className="aspect-video w-full rounded-xl bg-slate-950"/>});
type Props={projectName:string;pagePath:string;nodes:BuilderNode[];projectId:string;pageId:string};
function RenderComponent(input:Record<string,unknown>){return <NuvoraVideoComposition {...(input as Props)}/>;}
export default function NuvoraVideoStudio(props:Props){
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(""),[downloaded,setDownloaded]=useState(false);
 const cancelling=useRef<AbortController|null>(null);
 const generate=async()=>{
  if(busy)return;setBusy(true);setError("");setProgress(0);setDownloaded(false);
  const controller=new AbortController();cancelling.current=controller;
  try{
   const {canRenderMediaOnWeb,renderMediaOnWeb}=await import("@remotion/web-renderer");
   const compatible=await canRenderMediaOnWeb({width:1280,height:720,videoCodec:"h264",container:"mp4",muted:true});
   if(!compatible.canRender)throw new Error("Trình duyệt không hỗ trợ H.264 MP4 WebCodecs: "+compatible.issues.map(x=>x.message).join("; "));
   const job=await renderMediaOnWeb({
    composition:{id:"NuvoraDemo",component:RenderComponent,defaultProps:{...props},durationInFrames:450,fps:30,width:1280,height:720,calculateMetadata:null},
    inputProps:props,container:"mp4",videoCodec:"h264",muted:true,signal:controller.signal,
    onProgress:({progress:p})=>setProgress(Math.round(p*100)),
   });
   const video=await job.getBlob();
   if(!video.size)throw Error("Trình mã hóa trả về tệp rỗng.");
   const url=URL.createObjectURL(video);const anchor=document.createElement("a");anchor.href=url;
   anchor.download="nuvoracraft-"+props.projectName.toLowerCase().replace(/[^a-z0-9-]/g,"-").slice(0,35)+".mp4";
   anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000);setDownloaded(true);
  }catch(e){setError(e instanceof Error?e.message:"Không thể dựng video trên thiết bị này.");}
  finally{cancelling.current=null;setBusy(false);}
 };
 const generateOnServer=async()=>{
  if(busy)return;
  setBusy(true);setError("");setDownloaded(false);setProgress(0);
  try{
   const response=await fetch("/api/render-video",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({projectId:props.projectId,pageId:props.pageId})});
   if(!response.ok){
    const data=await response.json() as {error?:string;detail?:string};
    throw new Error([data.error,data.detail].filter(Boolean).join(" · ")||"Máy chủ không thể dựng video.");
   }
   if(!response.headers.get("content-type")?.includes("video/mp4"))throw new Error("Server did not return MP4.");
   const video=await response.blob();
   if(video.size<1024)throw new Error("MP4 quá nhỏ hoặc không hợp lệ.");
   const url=URL.createObjectURL(video);
   const a=document.createElement("a");a.href=url;a.download="nuvoracraft-server-demo.mp4";a.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setDownloaded(true);
  }catch(e){setError(e instanceof Error?e.message:"Server render failed.");}
  finally{setBusy(false);}
 };
 return <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_290px]">
  <div><div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950"><Preview component={RenderComponent} inputProps={{...props}} compositionWidth={1280} compositionHeight={720} fps={30} durationInFrames={450} controls style={{width:"100%",aspectRatio:"16/9"}}/></div><p className="mt-3 text-xs text-slate-400">Bản xem trước 15 giây lấy tên, nội dung và thứ tự các component thật từ pages.ui_tree. Không tự quay màn hình hoặc thu âm.</p></div>
  <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
   <Film size={30} className="text-orange-300"/><h2 className="text-xl font-bold">Tạo Video Demo</h2>
   <p className="text-sm leading-7 text-slate-400">15 giây · 1280×720 · 30 FPS · MP4 H.264. Render trực tiếp trên thiết bị với Remotion/WebCodecs, không chiếm máy chủ hoặc tạo chi phí cloud.</p>
   <button onClick={()=>void generate()} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-500 px-4 py-3 font-bold disabled:opacity-50">{busy?<LoaderCircle size={17} className="animate-spin"/>:<Download size={17}/>} {busy?"Rendering "+progress+"%":"Xuất Video MP4"}</button>
   <button type="button" disabled={busy} onClick={()=>void generateOnServer()} className="w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-bold text-orange-200 disabled:opacity-50">Render Video bằng Node Server</button>
   {busy&&<button type="button" onClick={()=>cancelling.current?.abort()} className="block w-full rounded-lg border border-slate-600 px-4 py-2 text-sm">Hủy render</button>}
   {downloaded&&<p role="status" className="text-sm text-emerald-300">Đã tạo và gửi tệp MP4 để tải xuống.</p>}
   {error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
   <p className="text-xs text-slate-500">Thiết bị cần trình duyệt hỗ trợ WebCodecs. Remotion có điều khoản cấp phép riêng cho tổ chức/doanh nghiệp.</p>
  </aside>
 </div>;
}
