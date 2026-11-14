"use client";
import {useEffect,useRef,useState,type PointerEvent,type MouseEvent} from "react";
import {FileSignature,PenLine,RotateCcw,Download,LoaderCircle} from "lucide-react";
import {signPdf,getSignedPdfUrl,type SigningResult} from "@/app/sign/actions";
type SignedRow={id:string;original_filename:string;signer_name:string;signed_sha256:string;signed_at:string;file_size:number};
const blank={x:0.62,y:0.76};
export default function SignWorkspace({documents}:{documents:SignedRow[]}){
 const [file,setFile]=useState<File|null>(null);
 const [pages,setPages]=useState(0);
 const [pageNumber,setPageNumber]=useState(1);
 const [pos,setPos]=useState(blank);
 const [signer,setSigner]=useState("");
 const [signature,setSignature]=useState("");
 const [processing,setProcessing]=useState(false);
 const [previewLoading,setPreviewLoading]=useState(false);
 const [previewError,setPreviewError]=useState("");
 const [message,setMessage]=useState("");
 const [result,setResult]=useState<Extract<SigningResult,{ok:true}>|null>(null);
 const [history,setHistory]=useState(documents);
 const previewRef=useRef<HTMLCanvasElement>(null);
 const signatureRef=useRef<HTMLCanvasElement>(null);
 const drawing=useRef(false);
 const hasInk=useRef(false);
 useEffect(()=>{
  const cv=signatureRef.current;
  if(!cv)return;
  const ctx=cv.getContext("2d");
  if(ctx){ctx.strokeStyle="#111827";ctx.lineWidth=3.4;ctx.lineCap="round";ctx.lineJoin="round";}
 },[]);
 useEffect(()=>{
  if(!file){setPages(0);return;}
  let disposed=false;
  setPreviewLoading(true);setPreviewError("");
  let loadingTask:{destroy:()=>Promise<void>}|undefined;
  (async()=>{
   const pdfjs=await import("pdfjs-dist");
   pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
   const buffer=await file.arrayBuffer();
   if(disposed)return;
   const loading=pdfjs.getDocument({data:new Uint8Array(buffer)});
   loadingTask=loading;
   const document=await loading.promise;
   if(disposed)return;
   setPages(document.numPages);
   if(pageNumber>document.numPages){setPageNumber(1);return;}
   const page=await document.getPage(pageNumber);
   const view=page.getViewport({scale:1});
   const scale=Math.min(1.6,650/view.width);
   const viewport=page.getViewport({scale});
   const cv=previewRef.current;
   if(!cv||disposed)return;
   const ctx=cv.getContext("2d");
   if(!ctx)return;
   cv.width=Math.round(viewport.width);cv.height=Math.round(viewport.height);
   const render=page.render({canvasContext:ctx,canvas:cv,viewport});
   await render.promise;
   if(!disposed)setPreviewLoading(false);
  })().catch(err=>{if(!disposed){setPreviewLoading(false);setPreviewError(err instanceof Error?err.message:"Không thể hiển thị PDF.");}});
  return ()=>{disposed=true;void loadingTask?.destroy().catch(()=>{});};
 },[file,pageNumber]);
 const coords=(event:PointerEvent<HTMLCanvasElement>)=>{
  const cv=signatureRef.current;if(!cv)return null;
  const rect=cv.getBoundingClientRect();
  return {x:(event.clientX-rect.left)*cv.width/rect.width,y:(event.clientY-rect.top)*cv.height/rect.height};
 };
 const down=(e:PointerEvent<HTMLCanvasElement>)=>{
  const cv=signatureRef.current,pt=coords(e);if(!cv||!pt)return;
  cv.setPointerCapture(e.pointerId);drawing.current=true;hasInk.current=true;
  const ctx=cv.getContext("2d");if(!ctx)return;
  ctx.beginPath();ctx.moveTo(pt.x,pt.y);ctx.lineTo(pt.x+.1,pt.y+.1);ctx.stroke();
 };
 const move=(e:PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current)return;const pt=coords(e);if(!pt)return;const ctx=signatureRef.current?.getContext("2d");if(!ctx)return;ctx.lineTo(pt.x,pt.y);ctx.stroke();};
 const up=()=>{drawing.current=false;if(hasInk.current&&signatureRef.current)setSignature(signatureRef.current.toDataURL("image/png"));};
 const clear=()=>{const cv=signatureRef.current;cv?.getContext("2d")?.clearRect(0,0,cv.width,cv.height);hasInk.current=false;setSignature("");};
 const place=(e:MouseEvent<HTMLDivElement>)=>{const box=e.currentTarget.getBoundingClientRect();setPos({x:Math.max(0,Math.min(.72,(e.clientX-box.left)/box.width-.14)),y:Math.max(0,Math.min(.85,(e.clientY-box.top)/box.height-.04))});};
 const submit=async()=>{
  if(!file||!signature||!signer.trim()){setMessage("Chọn PDF, nhập tên và vẽ chữ ký trước khi lưu.");return;}
  setProcessing(true);setMessage("");setResult(null);
  try{
    const form=new FormData();form.set("pdf",file);form.set("signature",signature);form.set("signer_name",signer.trim());form.set("page",String(pageNumber));form.set("x",String(pos.x));form.set("y",String(pos.y));
    const r=await signPdf(form);
    if(!r.ok){setMessage(r.error);return;}
    setResult(r);
    setMessage("Đã ký PDF và lưu metadata SHA-256. Tải tệp đã ký bằng liên kết bên dưới.");
    setHistory(prev=>[{id:r.id,original_filename:file.name,signer_name:signer.trim(),signed_sha256:r.sha256,signed_at:new Date().toISOString(),file_size:0},...prev]);
  }catch(e){setMessage(e instanceof Error?e.message:"Không thể ký PDF.");}
  finally{setProcessing(false);}
 };
 const download=async(id:string)=>{setMessage("");const r=await getSignedPdfUrl(id);if(!r.ok){setMessage(r.error);return;}const a=document.createElement("a");a.href=r.url;a.target="_blank";a.rel="noopener noreferrer";document.body.append(a);a.click();a.remove();};
 return <div className="space-y-6">
  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
   <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
    <label className="mb-4 block text-sm font-semibold">1. Chọn file PDF (tối đa 3 MB)<input type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-xs" onChange={e=>{const f=e.currentTarget.files?.[0]??null;setFile(f);setPageNumber(1);setPos(blank);setResult(null);}}/></label>
    {file&&<div className="mb-3 flex flex-wrap items-center gap-2"><label className="text-xs text-slate-300">Trang <select aria-label="Trang ký" value={pageNumber} onChange={e=>setPageNumber(Number(e.target.value))} className="ml-2 rounded-lg bg-slate-900 p-2">{Array.from({length:Math.max(pages,1)},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label><span className="text-xs text-slate-400">{file.name}</span></div>}
    <div className="overflow-x-auto rounded-xl bg-slate-900 p-3">
     {previewLoading&&<p className="py-10 text-center text-xs text-slate-400"><LoaderCircle className="mr-2 inline animate-spin" size={16}/>Đang tải PDF...</p>}
     {previewError&&<p role="alert" className="rounded-lg bg-rose-950 p-3 text-sm">{previewError}</p>}
     <div onClick={place} title="Nhấn trên trang để đặt chữ ký" className="relative mx-auto w-fit max-w-full cursor-crosshair shadow-xl">
      <canvas ref={previewRef} className="block h-auto max-w-full bg-white"/>
      {file&&signature&&<img src={signature} alt="Vị trí chữ ký" draggable={false} className="pointer-events-none absolute rounded-md border-2 border-dashed border-orange-500 bg-white/30 object-contain" style={{left:pos.x*100+"%",top:pos.y*100+"%",width:"28%"}}/>}
     </div>
    </div>
    <p className="mt-3 text-xs text-slate-400">Nhấn vào vị trí muốn đặt chữ ký trên trang PDF. Có thể chuyển trang ở phía trên.</p>
   </section>
   <section className="space-y-5 rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><PenLine size={20} className="text-orange-400"/>2. Ký tài liệu</h2>
    <label className="block text-sm text-slate-300">Họ và tên người ký<input name="signer_name" minLength={2} maxLength={120} value={signer} onChange={e=>setSigner(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-white outline-none focus:border-orange-500" placeholder="Họ và tên"/></label>
    <div><div className="mb-2 flex items-center justify-between"><span className="text-sm text-slate-300">Vẽ chữ ký bằng chuột hoặc ngón tay</span><button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-orange-300"><RotateCcw size={15}/>Xóa</button></div>
      <canvas ref={signatureRef} width={520} height={170} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="h-36 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"/>
    </div>
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-400">Trang {pageNumber} · Vị trí ngang {Math.round(pos.x*100)}% · dọc {Math.round(pos.y*100)}%</div>
    <button type="button" onClick={()=>void submit()} disabled={processing||!file||!signature||!signer.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 p-3 font-semibold text-white disabled:opacity-40">{processing?<LoaderCircle size={18} className="animate-spin"/>:<FileSignature size={18}/>} {processing?"Đang đóng dấu và lưu...":"Ký và lưu PDF"}</button>
    {message&&<p role="status" className="rounded-lg bg-slate-900 p-3 text-sm text-orange-200">{message}</p>}
    {result&&<div className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-4"><a href={result.downloadUrl} rel="noopener noreferrer" target="_blank" className="flex items-center gap-2 font-semibold text-emerald-300"><Download size={18}/>Tải PDF đã ký</a><p className="mt-2 break-all font-mono text-[10px] text-emerald-200">SHA-256: {result.sha256}</p></div>}
   </section>
  </div>
  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
   <h2 className="mb-4 text-lg font-semibold">Lịch sử ký · Riêng tư</h2>
   {!history.length?<p className="text-sm text-slate-400">Chưa có tài liệu đã ký.</p>:<div className="divide-y divide-slate-700">{history.map(doc=><div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{doc.original_filename}</p><p className="mt-1 text-xs text-slate-400">{doc.signer_name} · {new Date(doc.signed_at).toLocaleString("vi-VN")}</p><p className="mt-1 max-w-xs truncate font-mono text-[10px] text-slate-500" title={doc.signed_sha256}>{doc.signed_sha256}</p></div><button onClick={()=>void download(doc.id)} className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"><Download size={16}/>Tải lại</button></div>)}</div>}
  </section>
 </div>;
}
