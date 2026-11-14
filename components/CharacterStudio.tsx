"use client";
import {useState} from "react";
import {Camera,CheckCircle2,ChevronDown,Download,Gamepad2,Layers3,Move3D,Pause,Play,Save,Shield,Trash2,Zap} from "lucide-react";
import type {CharacterModel} from "@/lib/character-model";
import type {CameraView} from "@/lib/character-webgl";
import CharacterViewport from "./CharacterViewport";
import {saveCharacter,deleteCharacter} from "@/app/characters/actions";

type Tab="3d"|"4d"|"5d"|"6d";
const colors={skin:"Màu da",hair:"Màu tóc",outfit:"Áo giáp / trang phục",pants:"Quần / giày"} as const;
const body={headSize:"Kích cỡ đầu",bodyWidth:"Thân rộng",armLength:"Chiều dài tay",legLength:"Chiều dài chân"} as const;
const poses=[["idle","Đứng yên"],["run","Chạy"],["combat","Chiến đấu"],["victory","Ăn mừng"]] as const;
const equipment=[["none","Không"],["sword","Kiếm"],["staff","Trượng"],["shield","Khiên"]] as const;
const auras=[["none","Không"],["flame","Lửa"],["electric","Điện"],["heal","Hồi máu"]] as const;
const scenes=[["studio","Studio"],["forest","Rừng"],["arena","Đấu trường"],["castle","Thành trì"],["stadium","Sân bóng"]] as const;
const angles:{label:string;camera:CameraView}[]=[
 {label:"Trước",camera:{yaw:0,pitch:0,distance:8}},
 {label:"Sau",camera:{yaw:Math.PI,pitch:0,distance:8}},
 {label:"Trái",camera:{yaw:-Math.PI/2,pitch:0,distance:8}},
 {label:"Phải",camera:{yaw:Math.PI/2,pitch:0,distance:8}},
 {label:"Trên",camera:{yaw:.2,pitch:1.25,distance:9}},
 {label:"Dưới",camera:{yaw:.2,pitch:-1.12,distance:9}},
 {label:"Chéo 1",camera:{yaw:.62,pitch:.32,distance:8}},
 {label:"Chéo 2",camera:{yaw:-.75,pitch:.25,distance:8}}
];
const input="mt-2 w-full rounded-xl border border-slate-600 bg-[#0b1424] px-3 py-3 text-sm text-white outline-none focus:border-orange-500";
export default function CharacterStudio({id,initialName,initialModel,saved}:{
 id?:string;initialName:string;initialModel:CharacterModel;saved:boolean;
}){
 const [model,setModel]=useState<CharacterModel>(initialModel);
 const [name,setName]=useState(initialName);
 const [camera,setCamera]=useState<CameraView>({yaw:.38,pitch:.12,distance:8});
 const [playing,setPlaying]=useState(false);
 const [tab,setTab]=useState<Tab>("3d");
 const [notice,setNotice]=useState("");
 function change<K extends keyof CharacterModel>(key:K,value:CharacterModel[K]){setModel(previous=>({...previous,[key]:value}));}
 const exportConfig=()=>{
  const data={format:"studio-character-v2",name:name.trim()||"Nhân vật",model,description:"Mô hình tham số, không phải file mesh GLB/FBX"};
  const file=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const href=URL.createObjectURL(file),a=document.createElement("a");a.href=href;a.download="studio-character-config.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
  setNotice("Đã tải cấu hình nhân vật JSON. Chụp PNG từ vùng 3D nếu cần ảnh.");
 };
 return <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_345px]">
  <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-[#142137]">
   <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-4">
    <div><h2 className="flex items-center gap-2 text-sm font-black"><Move3D size={20} className="text-orange-300"/> Nhân vật WebGL 3D và bản đồ</h2>
     <p className="mt-1 text-[11px] leading-5 text-slate-400">GPU thực • ánh sáng • chiều sâu • xoay bằng ngón tay • chụm hai ngón để zoom</p>
    </div>
    <button type="button" onClick={()=>setPlaying(value=>!value)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white">
      {playing?<Pause size={16}/>:<Play size={16}/>} {playing?"Dừng timeline":"Chạy timeline"}
    </button>
   </header>
   <CharacterViewport model={model} camera={camera} onCameraChange={setCamera} playing={playing}/>
   <div className="flex flex-wrap gap-2 border-t border-slate-700 p-3">
    {angles.map(view=><button key={view.label} type="button" onClick={()=>setCamera(view.camera)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-orange-400 hover:text-orange-300">{view.label}</button>)}
   </div>
   <div className="border-t border-slate-700 px-4 py-3 text-xs leading-6 text-slate-400">
    3D = mô hình không gian. 4D = thời gian/animation. 5D = camera & bối cảnh. 6D = lớp trang bị, kỹ năng và chỉ số gameplay; không phải 4–6 chiều vật lý.
   </div>
  </section>
  <aside className="h-max min-w-0 rounded-2xl border border-slate-700 bg-[#1b293d] p-4 sm:p-5">
   {saved&&<p role="status" className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/30 p-3 text-xs text-emerald-200"><CheckCircle2 size={17}/> Đã lưu vào Supabase.</p>}
   <h2 className="text-base font-black">Bảng điều khiển nhân vật</h2>
   <p className="mt-2 text-xs leading-6 text-slate-400">Chọn lớp bên dưới để thay đổi mô hình, thời gian, camera hoặc sức mạnh.</p>
   <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl border border-slate-700 bg-slate-900 p-1.5">
    {(["3d","4d","5d","6d"] as const).map(key=><button type="button" key={key} onClick={()=>setTab(key)}
      aria-pressed={tab===key} className={"rounded-lg py-3 text-xs font-black "+(tab===key?"bg-orange-500 text-white":"text-slate-300 hover:bg-slate-800")}>{key.toUpperCase()}</button>)}
   </div>
   {tab==="3d"&&<div className="mt-5 space-y-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-orange-300"><Layers3 size={18}/> Màu sắc và hình thể 3D</h3>
    {(Object.entries(colors) as [keyof typeof colors,string][]).map(([key,label])=><label key={key} className="flex items-center justify-between gap-2 text-xs text-slate-200">{label}<span className="flex items-center gap-2"><span className="font-mono text-[10px] text-slate-400">{model[key]}</span><input type="color" aria-label={label} value={model[key]} onChange={event=>change(key,event.target.value)} className="size-10 cursor-pointer rounded-lg bg-transparent"/></span></label>)}
    {(Object.entries(body) as [keyof typeof body,string][]).map(([key,label])=><label key={key} className="block text-xs text-slate-300"><span className="flex justify-between">{label}<span className="font-mono text-orange-200">{model[key].toFixed(2)}×</span></span><input type="range" min=".55" max="1.65" step=".05" value={model[key]} onChange={event=>change(key,Number(event.target.value))} className="mt-2 w-full accent-orange-500"/></label>)}
    <label className="block text-xs text-slate-300">Kiểu mắt<select value={model.eyeStyle} onChange={e=>change("eyeStyle",e.target.value as CharacterModel["eyeStyle"])} className={input}><option value="round">Tròn</option><option value="square">Vuông</option></select></label>
   </div>}
   {tab==="4d"&&<div className="mt-5 space-y-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-orange-300"><Play size={17}/> Thời gian và chuyển động</h3>
    <div className="grid grid-cols-2 gap-2">{poses.map(([value,label])=><button type="button" key={value} onClick={()=>change("pose",value)} className={"rounded-xl border p-3 text-xs font-bold "+((model.pose??"idle")===value?"border-orange-500 bg-orange-500/15 text-orange-200":"border-slate-700 bg-slate-900 text-slate-300")}>{label}</button>)}</div>
    <label className="block text-xs text-slate-300">Tốc độ animation: {(model.timelineSpeed??1).toFixed(2)}×<input type="range" min=".25" max="3" step=".25" value={model.timelineSpeed??1} onChange={e=>change("timelineSpeed",Number(e.target.value))} className="mt-3 w-full accent-orange-500"/></label>
    <button type="button" onClick={()=>setPlaying(value=>!value)} className="w-full rounded-xl bg-orange-500 p-3 text-xs font-black text-white">{playing?"Dừng chuyển động":"Phát chuyển động"}</button>
    <p className="text-xs leading-6 text-slate-400">4D mô tả chiều thời gian trong animation, chưa có skeletal rig hoặc motion capture.</p>
   </div>}
   {tab==="5d"&&<div className="mt-5 space-y-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-orange-300"><Camera size={18}/> Camera đa góc và môi trường</h3>
    <label className="block text-xs text-slate-300">Bối cảnh 3D<select value={model.scene??"studio"} onChange={e=>change("scene",e.target.value as CharacterModel["scene"])} className={input}>{scenes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-2">{angles.map(view=><button type="button" key={view.label} onClick={()=>setCamera(view.camera)} className="rounded-xl border border-slate-600 bg-slate-900 p-3 text-xs text-slate-200 hover:border-orange-400">{view.label}</button>)}</div>
    <label className="block text-xs text-slate-300">Khoảng cách camera {camera.distance.toFixed(1)}<input type="range" min="4.5" max="16" step=".5" value={camera.distance} onChange={e=>setCamera(v=>({...v,distance:Number(e.target.value)}))} className="mt-2 w-full accent-orange-500"/></label>
    <p className="text-xs leading-6 text-slate-400">5D là góc camera và biến thể bối cảnh. Có thể xoay 360°, xem từ trên/dưới và thay nền 3D.</p>
   </div>}
   {tab==="6d"&&<div className="mt-5 space-y-5">
    <h3 className="flex items-center gap-2 text-sm font-bold text-orange-300"><Zap size={18}/> Trang bị, hiệu ứng và buff</h3>
    <label className="block text-xs text-slate-200">Trang bị<select value={model.equipment??"none"} onChange={e=>change("equipment",e.target.value as CharacterModel["equipment"])} className={input}>{equipment.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
    <label className="block text-xs text-slate-200">Hiệu ứng năng lượng<select value={model.aura??"none"} onChange={e=>change("aura",e.target.value as CharacterModel["aura"])} className={input}>{auras.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
    {(["strength","agility","defense"] as const).map((key,i)=><label key={key} className="block text-xs text-slate-300"><span className="flex justify-between">{["Sức mạnh","Nhanh nhẹn","Phòng thủ"][i]}<span className="text-orange-200">{model[key]??50}/100</span></span><input type="range" min="0" max="100" step="1" value={model[key]??50} onChange={e=>change(key,Number(e.target.value))} className="mt-2 w-full accent-orange-500"/></label>)}
    <p className="flex items-start gap-2 text-xs leading-6 text-slate-400"><Shield size={17} className="mt-1 shrink-0"/> Các chỉ số được lưu trong dữ liệu nhân vật; chưa tự động kết nối với hệ thống chiến đấu trực tuyến.</p>
   </div>}
   <form action={saveCharacter} className="mt-6 space-y-3 border-t border-slate-700 pt-5">
    <label className="block text-xs font-bold text-slate-200">Tên nhân vật<input name="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100} placeholder="Đặt tên nhân vật" className={input}/></label>
    <input type="hidden" name="id" value={id??""}/><input type="hidden" name="model" value={JSON.stringify(model)}/>
    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white"><Save size={18}/>{id?"Lưu cập nhật":"Lưu nhân vật mới"}</button>
   </form>
   <button type="button" onClick={exportConfig} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-xs font-bold text-slate-200"><Download size={17}/> Xuất cấu hình nhân vật JSON</button>
   {id&&<form action={deleteCharacter} onSubmit={e=>{if(!window.confirm("Xóa nhân vật đã lưu này?"))e.preventDefault();}} className="mt-3"><input type="hidden" name="id" value={id}/><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-700 p-3 text-xs text-rose-300"><Trash2 size={17}/> Xóa nhân vật</button></form>}
   {notice&&<p role="status" className="mt-3 rounded-xl bg-slate-900 p-3 text-xs text-emerald-300">{notice}</p>}
  </aside>
 </div>;
}
