"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ImagePlus,LoaderCircle,Link2,Trash2,Check,ExternalLink,Images} from "lucide-react";
import {createClient} from "@/lib/supabase/browser";

type Asset={name:string;id:string|null;created_at:string|null;url:string};
const extensions:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/gif":"gif"};
const BUCKET="builder-assets";
export default function AssetBrowser({userId,onPick}:{userId:string;onPick?:(url:string)=>void}){
 const [files,setFiles]=useState<Asset[]>([]);
 const [loading,setLoading]=useState(true);
 const [uploading,setUploading]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const input=useRef<HTMLInputElement>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const supabase=createClient();
  const {data,error}=await supabase.storage.from(BUCKET).list(userId,{limit:100,sortBy:{column:"created_at",order:"desc"}});
  if(error){setError(error.message);setFiles([]);}
  else setFiles((data??[]).filter(file=>file.name!=="emptyFolderPlaceholder").map(file=>({
   name:file.name,id:file.id??null,created_at:file.created_at??null,
   url:supabase.storage.from(BUCKET).getPublicUrl(userId+"/"+file.name).data.publicUrl
  })));
  setLoading(false);
 },[userId]);
 useEffect(()=>{void load();},[load]);
 const upload=async(event:React.ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setError("");setNotice("");
  if(!extensions[file.type]){setError("Chỉ chấp nhận ảnh PNG, JPG, WEBP hoặc GIF.");return;}
  if(file.size>5*1024*1024){setError("Ảnh quá 5 MB. Hãy nén hoặc chọn file nhỏ hơn.");return;}
  const path=userId+"/"+crypto.randomUUID()+"."+extensions[file.type];
  setUploading(true);
  try{
   const {error}=await createClient().storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"});
   if(error)throw new Error(error.message);
   setNotice("Đã tải ảnh vào thư viện cá nhân. Có thể dùng trực tiếp trong website và game.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Tải ảnh không thành công.");}
  finally{setUploading(false);if(input.current)input.current.value="";}
 };
 const remove=async(file:Asset)=>{
  if(!window.confirm("Xóa ảnh này khỏi kho? Các website/game đang sử dụng URL ảnh này có thể bị mất ảnh."))return;
  setError("");setNotice("");
  const {error}=await createClient().storage.from(BUCKET).remove([userId+"/"+file.name]);
  if(error){setError(error.message);return;}
  setNotice("Đã xóa ảnh khỏi kho cá nhân.");
  await load();
 };
 const copy=async(url:string)=>{
  try{await navigator.clipboard.writeText(url);setNotice("Đã sao chép URL ảnh.");}
  catch{setError("Thiết bị không hỗ trợ sao chép. Hãy mở ảnh và sao chép URL trên trình duyệt.");}
 };
 return <section className="flex min-h-0 flex-col rounded-2xl border border-slate-700 bg-[#1e293b] p-4 text-slate-100 sm:p-5">
  <div className="mb-4 flex flex-wrap items-center gap-3">
   <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Images/></div>
   <div className="min-w-0 flex-1"><h2 className="text-base font-bold">Kho ảnh của tôi</h2><p className="mt-1 text-xs text-slate-400">Ảnh được lưu thật trên Supabase Storage, tối đa 5 MB/tệp.</p></div>
   <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white">
    {uploading?<LoaderCircle size={16} className="animate-spin"/>:<ImagePlus size={16}/>} {uploading?"Đang tải...":"Tải ảnh lên"}
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={e=>void upload(e)} className="sr-only"/>
   </label>
  </div>
  <p className="mb-4 rounded-xl border border-amber-600/30 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100">Ảnh bạn tải lên có URL công khai để hiển thị trên website/game. Không tải hình riêng tư hoặc chưa có quyền sử dụng.</p>
  {error&&<p role="alert" className="mb-3 rounded-xl bg-rose-950/70 p-3 text-xs text-rose-200">{error}</p>}
  {notice&&<p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-950/70 p-3 text-xs text-emerald-200"><Check size={15}/>{notice}</p>}
  {loading?<p className="flex items-center gap-2 py-8 text-sm text-slate-400"><LoaderCircle size={17} className="animate-spin"/> Đang tải ảnh của bạn...</p>:
   files.length===0?<div className="rounded-xl border border-dashed border-slate-600 p-8 text-center text-sm text-slate-400">Chưa có ảnh. Bấm “Tải ảnh lên” hoặc mở thư viện nguồn tài nguyên để tải ảnh phù hợp.</div>:
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{files.map(file=><article key={file.name} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
     <div className="aspect-square overflow-hidden bg-slate-800"><img loading="lazy" decoding="async" src={file.url} alt={"Ảnh "+file.name} className="h-full w-full object-cover"/></div>
     <div className="space-y-2 p-2">
      <p className="truncate font-mono text-[10px] text-slate-400" title={file.name}>{file.name}</p>
      {onPick&&<button type="button" onClick={()=>onPick(file.url)} className="w-full rounded-lg bg-orange-500 px-2 py-2 text-xs font-bold text-white">Chèn ảnh này</button>}
      <div className="flex items-center justify-between gap-1">
       <button type="button" title="Sao chép URL" onClick={()=>void copy(file.url)} className="rounded-lg border border-slate-700 p-2 text-orange-300"><Link2 size={16}/></button>
       <a href={file.url} target="_blank" rel="noopener noreferrer" title="Xem ảnh" className="rounded-lg border border-slate-700 p-2 text-slate-200"><ExternalLink size={16}/></a>
       <button type="button" title="Xóa ảnh" onClick={()=>void remove(file)} className="rounded-lg border border-rose-950 p-2 text-rose-300"><Trash2 size={16}/></button>
      </div>
     </div>
    </article>)}</div>}
 </section>;
}
