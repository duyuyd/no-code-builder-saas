"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as Dialog from "@radix-ui/react-dialog";
import {ArrowLeft,CloudUpload,ExternalLink,Eye,EyeOff,Gamepad2,ImagePlus,Plus,Redo2,Save,Trash2,Undo2,X} from "lucide-react";
import GameStage from "@/components/GameStage";
import StudioAssistant from "@/components/StudioAssistant";
import {validateGameScene,type GameObjectKind,type GameScene,type GameSceneTemplate} from "@/lib/game-scene";
import {saveGameScene,publishGameScene,unpublishGameScene} from "@/app/game-builder/actions";

const AssetBrowser = dynamic(() => import("./AssetBrowser"), {ssr:false,loading:()=> <p className="p-6 text-sm text-slate-300">Đang tải kho ảnh...</p>});
const field="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-white outline-none focus:border-orange-500";
const round=(v:number)=>Math.round(v*10)/10;
export default function GameWorkspace({projectId,projectName,userId,initialScene,initialVersion,initialPublished,templates}:{
 projectId:string;projectName:string;userId:string;initialScene:GameScene;initialVersion:number;initialPublished:boolean;templates:GameSceneTemplate[]
}){
 const [scene,setScene]=useState<GameScene>(initialScene);
 const sceneRef=useRef(scene);
 const versionRef=useRef(initialVersion);
 const [dirty,setDirty]=useState(false);
 const [saveNonce,setSaveNonce]=useState(0);
 const [saving,setSaving]=useState(false);
 const savingRef=useRef(false);
 const [published,setPublished]=useState(initialPublished);
 const [publishing,setPublishing]=useState(false);
 const [message,setMessage]=useState("");
 const [preview,setPreview]=useState(false);
 const [tool,setTool]=useState<"select"|GameObjectKind>("select");
 const [selected,setSelected]=useState<string|null>(null);
 const [past,setPast]=useState<GameScene[]>([]);
 const [future,setFuture]=useState<GameScene[]>([]);
 const [templateChoice,setTemplateChoice]=useState(templates[0]?.code??"");
 const [assetTarget,setAssetTarget]=useState<"background"|"player"|"object"|null>(null);
 const pendingDrag=useRef<GameScene|null>(null);
 useEffect(()=>{sceneRef.current=scene;},[scene]);
 const commit=useCallback((next:GameScene)=>{
  setPast(previous=>[...previous.slice(-39),sceneRef.current]);setFuture([]);
  sceneRef.current=next;setScene(next);setDirty(true);setMessage("");
 },[]);
 function undo(){
  if(!past.length)return;
  const previous=past[past.length-1];
  setPast(past.slice(0,-1));setFuture(f=>[sceneRef.current,...f]);sceneRef.current=previous;setScene(previous);setDirty(true);
 }
 function redo(){
  if(!future.length)return;
  const next=future[0];
  setFuture(future.slice(1));setPast(p=>[...p,sceneRef.current]);sceneRef.current=next;setScene(next);setDirty(true);
 }
 const flush=useCallback(async():Promise<boolean>=>{
  if(savingRef.current)return false;
  const snapshot=sceneRef.current;
  if(!validateGameScene(snapshot)){setMessage("Kiểm tra bản đồ: cần đích và ít nhất một sao hoặc quái (tùy chế độ), kích thước và vị trí hợp lệ.");return false;}
  savingRef.current=true;setSaving(true);
  try{
   const result=await saveGameScene(projectId,snapshot,versionRef.current);
   if(!result.ok){setMessage(result.message);return false;}
   versionRef.current=result.version;
   if(sceneRef.current===snapshot)setDirty(false);
   setMessage("Đã lưu màn chơi lên Supabase · v"+result.version);
   return true;
  }catch(error){setMessage(error instanceof Error?error.message:"Lỗi lưu màn chơi.");return false;}
  finally{savingRef.current=false;setSaving(false);setSaveNonce(x=>x+1);}
 },[projectId]);
 useEffect(()=>{
  if(!dirty||preview)return;
  const timer=window.setTimeout(()=>{void flush();},2000);
  return ()=>window.clearTimeout(timer);
 },[scene,dirty,preview,saveNonce,flush]);
 const updateObject=(id:string,patch:Partial<GameScene["objects"][number]>)=>{
  commit({...sceneRef.current,objects:sceneRef.current.objects.map(o=>o.id===id?{...o,...patch}:o)});
 };
 const dragMove=(id:string,x:number,y:number)=>{
  if(pendingDrag.current===null)pendingDrag.current=sceneRef.current;
  const next={...sceneRef.current,objects:sceneRef.current.objects.map(o=>o.id===id?{...o,x,y}:o)};
  sceneRef.current=next;setScene(next);setDirty(true);
 };
 const completeDrag=()=>{
  const initial=pendingDrag.current;
  if(initial){setPast(previous=>[...previous.slice(-39),initial]);setFuture([]);pendingDrag.current=null;}
 };
 const applyTemplate=()=>{
  const template=templates.find(item=>item.code===templateChoice);
  if(!template||!validateGameScene(template.scene))return;
  if(dirty&&!window.confirm("Thay bản nháp hiện tại bằng mẫu này? Bạn có thể Hoàn tác trong phiên thiết kế."))return;
  commit({...template.scene,player:{...template.scene.player},objects:template.scene.objects.map(o=>({...o,id:crypto.randomUUID()}))});
  setSelected(null);setTool("select");setPreview(false);
  setMessage("Đã tải mẫu "+template.name+". Màn chơi sẽ tự lưu sau 2 giây.");
 };
 const chosen=scene.objects.find(o=>o.id===selected);
 const applyImage=(url:string)=>{
  if(assetTarget==="background")commit({...sceneRef.current,backgroundImageUrl:url});
  else if(assetTarget==="player")commit({...sceneRef.current,player:{...sceneRef.current.player,imageUrl:url}});
  else if(assetTarget==="object"&&selected)updateObject(selected,{imageUrl:url});
  setAssetTarget(null);
 };
 const addObject=(x:number,y:number)=>{
  if(tool==="select"){setSelected(null);return;}
  if(sceneRef.current.objects.length>=80){setMessage("Mỗi màn chơi tối đa 80 vật thể.");return;}
  const templates:{[K in GameObjectKind]:{w:number;h:number;label:string}}={
   coin:{w:7,h:10,label:"⭐"},wall:{w:9,h:23,label:"🧱"},goal:{w:9,h:13,label:"🏁"},enemy:{w:7,h:9,label:"👹"}
  };
  const p=templates[tool];const id=crypto.randomUUID();
  commit({...sceneRef.current,objects:[...sceneRef.current.objects,{id,kind:tool,x:Math.min(x,100-p.w),y:Math.min(y,100-p.h),...p}]});
  setSelected(id);setTool("select");
 };
 const deleteSelected=()=>{
  if(!chosen)return;
  const remaining=scene.objects.filter(o=>o.id!==chosen.id);
  if(!remaining.some(o=>o.kind==="goal")||!(scene.mode==="combat"?remaining.some(o=>o.kind==="enemy"):remaining.some(o=>o.kind==="coin"))){setMessage("Cần giữ ít nhất một đích và sao/quái theo chế độ.");return;}
  commit({...scene,objects:remaining});setSelected(null);
 };
 const publish=async()=>{
  if(publishing)return;
  setPublishing(true);
  try{
   if(dirty||versionRef.current===0){const okay=await flush();if(!okay){setMessage("Chưa thể xuất bản vì bản nháp chưa lưu thành công.");return;}}
   const result=await publishGameScene(projectId);
   if(!result.ok){setMessage(result.message);return;}
   setPublished(true);setMessage("Game đã xuất bản. Mở liên kết để chơi thật.");
  }finally{setPublishing(false);}
 };
 const unpublish=async()=>{
  if(publishing)return;
  setPublishing(true);
  try{const result=await unpublishGameScene(projectId);if(!result.ok)setMessage(result.message);else{setPublished(false);setMessage("Đã ngừng xuất bản game.");}}
  finally{setPublishing(false);}
 };
 const button="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-40";
 return <div className="min-h-dvh bg-[#0f172a] px-3 py-4 text-slate-100 sm:px-5">
 <div className="mx-auto max-w-7xl">
  <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
   <div><Link href={"/builder?project="+projectId+"&mode=website"} className="mb-2 inline-flex items-center gap-2 text-xs text-orange-300"><ArrowLeft size={14}/> Trang giới thiệu game</Link>
    <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl"><Gamepad2 className="text-orange-400"/> Game Builder 2D</h1>
    <p className="mt-1 text-xs text-slate-400">{projectName} · {scene.objects.length} vật thể · {dirty?"Chưa lưu":"Đã đồng bộ"}</p></div>
   <div className="flex flex-wrap gap-2">
    <Link href="/game-maps#five-v-five" className="inline-flex items-center justify-center rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2.5 text-xs font-bold text-orange-200">🎮 MOBA 5v5: 2 bản đồ chơi thật</Link>
    <StudioAssistant contextKind="game" projectId={projectId} pageId="" selectedId={selected} selectedType={chosen?.kind??null} blockCount={scene.objects.length}/>
    <button type="button" onClick={undo} disabled={!past.length} title="Hoàn tác" className={button+" border border-slate-600 bg-slate-800"}><Undo2 size={17}/></button>
    <button type="button" onClick={redo} disabled={!future.length} title="Làm lại" className={button+" border border-slate-600 bg-slate-800"}><Redo2 size={17}/></button>
    <button type="button" onClick={()=>setPreview(v=>!v)} className={button+" border border-orange-500/60 bg-orange-500/10 text-orange-300"}>{preview?<EyeOff size={17}/>:<Eye size={17}/>} {preview?"Chỉnh sửa":"Chơi thử"}</button>
    <button type="button" disabled={saving} onClick={()=>void flush()} className={button+" bg-slate-700 text-white"}><Save size={16}/> {saving?"Đang lưu":"Lưu"}</button>
    <button type="button" disabled={publishing||saving} onClick={()=>void publish()} className={button+" bg-orange-500 text-white"}><CloudUpload size={16}/>{publishing?"Đang xuất bản":"Xuất bản"}</button>
   </div>
  </header>
  {!preview&&templates.length>0&&<section className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-4">
    <label className="min-w-48 flex-1 text-xs font-semibold text-slate-200">Khởi tạo bản đồ theo thể loại
     <select value={templateChoice} onChange={e=>setTemplateChoice(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-xs text-white">
      {templates.map(t=><option key={t.code} value={t.code}>{t.genre} · {t.name}</option>)}
     </select>
    </label>
    <button type="button" onClick={applyTemplate} className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold text-white">Dùng bản đồ này</button>
    <p className="w-full text-xs leading-5 text-amber-200">Đây là mẫu bản đồ tương tác 2D để chỉnh sửa; chưa có trận MOBA online, RPG nhiều người chơi hoặc bóng đá vật lý.</p>
   </section>}
  {message&&<p role="status" className="mb-4 rounded-xl border border-slate-700 bg-[#1e293b] p-3 text-sm text-orange-200">{message}</p>}
  {published&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-700 bg-emerald-950/30 p-3 text-xs text-emerald-200">
   <a href={"/play/"+projectId} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold"><ExternalLink size={16}/> Game đang công khai · Mở để chơi</a>
   <button onClick={()=>void unpublish()} disabled={publishing} className="rounded-lg border border-emerald-700 px-3 py-2">Ngừng công khai</button>
  </div>}
  <div className="grid min-w-0 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_275px]">
   {!preview&&<section className="order-2 rounded-2xl border border-slate-700 bg-[#1e293b] p-4 xl:order-1">
    <h2 className="mb-4 text-sm font-bold">Kho vật thể</h2>
    <p className="mb-3 text-xs text-slate-400">Chọn công cụ rồi chạm vào màn chơi để đặt vật thể mới.</p>
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
    {([{id:"select",label:"🖱️ Chọn & kéo"},{id:"coin",label:"⭐ Sao thưởng"},{id:"wall",label:"🧱 Tường cản"},{id:"goal",label:"🏁 Về đích"},{id:"enemy",label:"👹 Quái / đối thủ AI"}] as const).map(t=>
      <button key={t.id} type="button" onClick={()=>setTool(t.id)} className={"rounded-xl border p-3 text-left text-xs font-bold transition "+(tool===t.id?"border-orange-400 bg-orange-500/20 text-orange-200":"border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500")}>{t.label}</button>
    )}
    </div>
    <div className="my-4 h-px bg-slate-700"/>
    <h3 className="mb-3 text-sm font-bold">Vật thể trong màn</h3>
    <div className="max-h-64 space-y-1 overflow-auto">{scene.objects.map(o=><button key={o.id} onClick={()=>{setSelected(o.id);setTool("select");}} className={"block w-full rounded-lg px-3 py-2 text-left text-xs "+(selected===o.id?"bg-orange-500/20 text-orange-200":"bg-slate-900 text-slate-300")}>{o.label} {o.kind} ({Math.round(o.x)}%,{Math.round(o.y)}%)</button>)}</div>
   </section>}
   <div className="order-1 min-w-0 rounded-2xl border border-slate-700 bg-[#1e293b] p-3 sm:p-5 xl:order-2">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{scene.title}</p><span className="text-xs text-slate-400">{preview?"ĐANG CHƠI THỬ":"KHUNG THIẾT KẾ 2D"}</span></div>
    <GameStage key={preview?"playing":"editing"} scene={scene} mode={preview?"play":"edit"} selectedId={selected} onSelect={setSelected} onAddObject={addObject} onMoveObject={(id,x,y)=>dragMove(id,round(x),round(y))} onMoveEnd={completeDrag}/>
   </div>
   {!preview&&<section className="order-3 space-y-4 rounded-2xl border border-slate-700 bg-[#1e293b] p-4">
    <h2 className="text-sm font-bold">Thuộc tính màn chơi</h2>
    <label className="block text-xs text-slate-300">Cơ chế chơi
      <select value={scene.mode??"collection"} onChange={e=>{
       const mode=e.target.value as "collection"|"combat";
       const objects=[...scene.objects];
       if(mode==="combat"&&!objects.some(o=>o.kind==="enemy"))objects.push({id:crypto.randomUUID(),kind:"enemy",x:63,y:45,w:7,h:9,label:"👹",hp:3});
       if(mode==="collection"&&!objects.some(o=>o.kind==="coin"))objects.push({id:crypto.randomUUID(),kind:"coin",x:40,y:30,w:7,h:9,label:"⭐"});
       commit({...scene,mode,objects});
      }} className={field}><option value="collection">Thu thập & về đích</option><option value="combat">Chiến đấu PvE: quái AI, máu, tấn công, thắng/thua</option></select>
     </label>
     <label className="block text-xs text-slate-300">Tên game<input value={scene.title} maxLength={120} onChange={e=>commit({...scene,title:e.target.value})} className={field}/></label>
    <label className="flex items-center justify-between gap-3 text-xs text-slate-300">Nền<input type="color" value={scene.background} onChange={e=>commit({...scene,background:e.target.value})} className="h-10 w-20 rounded-md border border-slate-600 bg-transparent"/></label>
    <div className="space-y-2 rounded-xl border border-slate-700 p-3">
     <p className="text-xs font-bold text-slate-200">Ảnh nền màn chơi</p>
     {scene.backgroundImageUrl&&<img src={scene.backgroundImageUrl} alt="Ảnh nền màn chơi" loading="lazy" className="max-h-28 w-full rounded-lg object-cover"/>}
     <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setAssetTarget("background")} className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white"><ImagePlus size={15}/> Chọn ảnh nền</button>{scene.backgroundImageUrl&&<button type="button" onClick={()=>commit({...scene,backgroundImageUrl:""})} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">Gỡ ảnh</button>}</div>
    </div>
    <label className="block text-xs text-slate-300">Nhân vật<input value={scene.player.emoji} maxLength={16} onChange={e=>commit({...scene,player:{...scene.player,emoji:e.target.value}})} className={field}/></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>setAssetTarget("player")} className="inline-flex items-center gap-2 rounded-lg border border-orange-500 px-3 py-2 text-xs font-bold text-orange-200"><ImagePlus size={15}/> Chọn ảnh nhân vật</button>
      {scene.player.imageUrl&&<button type="button" onClick={()=>commit({...scene,player:{...scene.player,imageUrl:""}})} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">Dùng emoji</button>}
     </div>
    <label className="block text-xs text-slate-300">Tốc độ di chuyển (0.4–5)<input type="number" step=".2" min=".4" max="5" value={scene.player.speed} onChange={e=>commit({...scene,player:{...scene.player,speed:Number(e.target.value)}})} className={field}/></label>
    {chosen&&<div className="space-y-3 border-t border-slate-700 pt-4">
     <h3 className="text-sm font-bold">Đang chọn: {chosen.kind}</h3>
     {chosen.kind==="enemy"&&<label className="block text-xs text-slate-300">Số máu kẻ địch (1–10)<input type="number" min="1" max="10" step="1" value={chosen.hp??2} onChange={e=>updateObject(chosen.id,{hp:Number(e.target.value)})} className={field}/></label>}
      <label className="block text-xs text-slate-300">Biểu tượng<input value={chosen.label} maxLength={16} onChange={e=>updateObject(chosen.id,{label:e.target.value})} className={field}/></label>
     <div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>setAssetTarget("object")} className="inline-flex items-center gap-2 rounded-lg border border-orange-500 px-3 py-2 text-xs font-bold text-orange-200"><ImagePlus size={15}/> Chọn ảnh vật thể</button>
      {chosen.imageUrl&&<button type="button" onClick={()=>updateObject(chosen.id,{imageUrl:""})} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">Dùng biểu tượng</button>}
     </div>
     <div className="grid grid-cols-2 gap-2">{(["x","y","w","h"] as const).map(key=><label key={key} className="text-xs text-slate-400">{key.toUpperCase()} (%)<input type="number" min={key==="w"||key==="h"?2:0} max={100} step=".5" value={chosen[key]} onChange={e=>updateObject(chosen.id,{[key]:Number(e.target.value)})} className={field}/></label>)}</div>
     <button onClick={deleteSelected} type="button" className={button+" w-full border border-rose-700 text-rose-200"}><Trash2 size={15}/> Xóa vật thể</button>
    </div>}
    <p className="text-xs leading-5 text-slate-400">Chạm vật thể để sửa kích thước/vị trí. Tự lưu sau 2 giây. Nút Xuất bản lấy đúng bản đã lưu trên Supabase.</p>
   </section>}
  </div>
 <Dialog.Root open={assetTarget!==null} onOpenChange={open=>{if(!open)setAssetTarget(null);}}>
  <Dialog.Portal>
   <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/85"/>
   <Dialog.Content className="fixed inset-3 z-[81] flex flex-col overflow-hidden rounded-2xl bg-[#0f172a] p-4 text-white outline-none sm:inset-10">
    <div className="mb-4 flex items-center justify-between gap-2">
     <Dialog.Title className="text-base font-bold">Chọn ảnh cho {assetTarget==="background"?"nền":assetTarget==="player"?"nhân vật":"vật thể"}</Dialog.Title>
     <Dialog.Close className="rounded-lg bg-slate-700 p-2" aria-label="Đóng kho ảnh"><X size={19}/></Dialog.Close>
    </div>
    <Dialog.Description className="sr-only">Chọn hoặc tải ảnh từ kho Supabase của bạn để dùng trong màn chơi.</Dialog.Description>
    <div className="editor-scroll min-h-0 flex-1 overflow-auto">
     <AssetBrowser userId={userId} onPick={applyImage}/>
    </div>
   </Dialog.Content>
  </Dialog.Portal>
 </Dialog.Root>
 </div>
 </div>;
}
