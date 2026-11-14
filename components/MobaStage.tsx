"use client";
import {useEffect,useRef,useState,type PointerEvent} from "react";
import {ArrowLeft,Heart,RotateCcw,Shield,Skull,Swords,Target,Wind,Zap} from "lucide-react";
import {basePoint,clamp,distance,initArena,pathPoint,playerAction,tickArena,type ArenaMap,type ArenaState,type Point,type Team} from "@/lib/moba-arena";

const point=(x:number,y:number):Point=>({x,y});
const path=(ctx:CanvasRenderingContext2D,points:Point[])=>{
 ctx.beginPath();points.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
};
const disk=(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string)=>{
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
};
function terrain(ctx:CanvasRenderingContext2D,map:ArenaMap,time:number){
 const pal=map.palette;
 ctx.fillStyle=pal.ground;ctx.fillRect(0,0,100,100);
 // Baked procedural world geometry: no network image requests during gameplay.
 for(let i=0;i<230;i++){
  const x=((i*73+31)%103+Math.sin(i*17)*.7)%100,y=((i*47+19)%103+Math.cos(i*23)*.6)%100;
  disk(ctx,x,y,i%7===0?.55:.23,i%3===0?pal.bush:pal.stone);
 }
 for(const riverPoint of [map.river]){
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  path(ctx,riverPoint);ctx.strokeStyle="#0b1c28";ctx.lineWidth=14;ctx.stroke();
  path(ctx,riverPoint);ctx.strokeStyle=pal.river;ctx.lineWidth=10;ctx.stroke();
  path(ctx,riverPoint);ctx.strokeStyle="rgba(255,255,255,.13)";ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
 }
 for(const lane of map.lanes){
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  path(ctx,lane.points);ctx.strokeStyle=pal.laneEdge;ctx.lineWidth=10.3;ctx.stroke();
  path(ctx,lane.points);ctx.strokeStyle=pal.lane;ctx.lineWidth=7.5;ctx.stroke();
  path(ctx,lane.points);ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=.35;ctx.setLineDash([.35,.75]);ctx.stroke();
  ctx.restore();
 }
 for(const [index,p] of map.bushes.entries()){
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(index*.95);
  const pulse=.96+Math.sin(time*.5+index)*.03;
  ctx.fillStyle="#0c2f22";ctx.beginPath();ctx.ellipse(0,.4,3.5*pulse,1.8,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,r=1.4+(i%3)*.28;
   disk(ctx,Math.cos(a)*r,Math.sin(a)*r*.64,1.36,pal.bush);
  }
  ctx.restore();
 }
 for(const camp of map.camps){
  ctx.save();ctx.translate(camp.x,camp.y);ctx.rotate(Math.PI/4);
  ctx.fillStyle="#1e293b";ctx.fillRect(-2.1,-2.1,4.2,4.2);
  ctx.strokeStyle="#a78bfa";ctx.lineWidth=.55;ctx.strokeRect(-2.1,-2.1,4.2,4.2);
  ctx.fillStyle="#fcd34d";ctx.fillRect(-.58,-.58,1.16,1.16);
  ctx.restore();
 }
}
function hpbar(ctx:CanvasRenderingContext2D,x:number,y:number,ratio:number,width:number){
 ctx.fillStyle="#080e1c";ctx.fillRect(x-width/2,y,width,.58);
 ctx.fillStyle=ratio>.45?"#4ade80":"#fb7185";ctx.fillRect(x-width/2,y,width*clamp(ratio,0,1),.58);
}
function tower(ctx:CanvasRenderingContext2D,x:number,y:number,team:Team,hp:number,pal:ArenaMap["palette"],t:number){
 ctx.save();ctx.translate(x,y);
 disk(ctx,0,.5,3.25,"#0008");
 disk(ctx,0,0,2.8,team==="blue"?"#164e87":"#881337");
 ctx.strokeStyle=team==="blue"?pal.blue:pal.red;ctx.lineWidth=.7;ctx.beginPath();
 ctx.moveTo(0,-3.6);ctx.lineTo(3.2,0);ctx.lineTo(0,3.6);ctx.lineTo(-3.2,0);ctx.closePath();ctx.stroke();
 disk(ctx,0,0,1.4,"#101827");
 disk(ctx,0,0,.86,team==="blue"?"#67e8f9":"#fda4af");
 disk(ctx,0,0,.52,"#fff");
 ctx.restore();hpbar(ctx,x,y-4.4,hp/220,5.8);
}
function core(ctx:CanvasRenderingContext2D,x:number,y:number,team:Team,hp:number,pal:ArenaMap["palette"],t:number){
 const glow=ctx.createRadialGradient(x,y,1,x,y,9);
 const c=team==="blue"?pal.blue:pal.red;glow.addColorStop(0,c+"b0");glow.addColorStop(1,c+"00");
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y);ctx.rotate(t*.15);
 ctx.strokeStyle=c;ctx.lineWidth=1.1;
 for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(1.7,-1.5);ctx.lineTo(0,0);ctx.lineTo(-1.7,-1.5);ctx.closePath();ctx.stroke();}
 disk(ctx,0,0,2.6,"#121827");disk(ctx,0,0,1.35,c);disk(ctx,0,0,.8,"#fff");
 ctx.restore();
 hpbar(ctx,x,y-7,hp/750,12);
}
function hero(ctx:CanvasRenderingContext2D,x:number,y:number,team:Team,hp:number,name:string,isPlayer:boolean,pal:ArenaMap["palette"],time:number){
 const c=team==="blue"?pal.blue:pal.red;
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle="#03071299";ctx.beginPath();ctx.ellipse(0,1,2.8,1.5,0,0,Math.PI*2);ctx.fill();
 disk(ctx,0,-.15,isPlayer?2.5:2.05,"#081221");
 disk(ctx,0,-.15,isPlayer?2.11:1.72,c);
 ctx.strokeStyle=isPlayer?"#fbbf24":"#f8fafc99";ctx.lineWidth=isPlayer?.75:.37;
 ctx.beginPath();ctx.arc(0,-.15,isPlayer?2.92:2.27,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#e2e8f0";ctx.beginPath();ctx.moveTo(-1,-.75);ctx.lineTo(0,-1.6);ctx.lineTo(1,-.75);ctx.lineTo(.63,1.25);ctx.lineTo(-.63,1.25);ctx.closePath();ctx.fill();
 disk(ctx,0,-.65,.46,isPlayer?"#fef08a":"#0f172a");
 if(isPlayer){ctx.strokeStyle="#facc15";ctx.lineWidth=.45;ctx.beginPath();ctx.arc(0,0,3.6+Math.sin(time*3)*.2,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
 hpbar(ctx,x,y-4.3,hp/130,isPlayer?6.8:5.2);
 ctx.save();ctx.font=(isPlayer?"bold 1.8px":"1.6px")+" system-ui,sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.strokeStyle="#07111fd9";ctx.lineWidth=.55;ctx.strokeText(name,x,y-5.2);ctx.fillText(name,x,y-5.2);ctx.restore();
}
function minion(ctx:CanvasRenderingContext2D,x:number,y:number,team:Team,hp:number,pal:ArenaMap["palette"]){
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle=team==="blue"?pal.blue:pal.red;ctx.strokeStyle="#0f172a";ctx.lineWidth=.45;
 ctx.beginPath();ctx.moveTo(0,-1.15);ctx.lineTo(1,0);ctx.lineTo(0,1.15);ctx.lineTo(-1,0);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.restore();hpbar(ctx,x,y-2,hp/54,2.6);
}
function minimap(ctx:CanvasRenderingContext2D,map:ArenaMap,s:ArenaState,w:number){
 const size=Math.min(132,Math.max(102,w*.3)),left=w-size-12,top=12,ratio=size/100;
 ctx.save();ctx.translate(left,top);ctx.scale(ratio,ratio);
 ctx.fillStyle="#0c1724ed";ctx.fillRect(-2,-2,104,104);
 ctx.fillStyle=map.palette.ground;ctx.fillRect(0,0,100,100);
 ctx.lineCap="round";ctx.lineJoin="round";
 for(const lane of map.lanes){path(ctx,lane.points);ctx.strokeStyle=map.palette.lane;ctx.lineWidth=3;ctx.stroke();}
 path(ctx,map.river);ctx.strokeStyle=map.palette.river;ctx.lineWidth=3;ctx.stroke();
 for(const obj of s.towers)if(obj.hp>0)disk(ctx,obj.x,obj.y,1.7,obj.team==="blue"?map.palette.blue:map.palette.red);
 for(const h of s.heroes)if(h.hp>0)disk(ctx,h.x,h.y,h.id===0?2.9:1.2,h.id===0?"#fef08a":h.team==="blue"?"#67e8f9":"#fb7185");
 for(const team of ["blue","red"] as Team[]){const p=basePoint(map,team);disk(ctx,p.x,p.y,3,team==="blue"?map.palette.blue:map.palette.red);}
 ctx.strokeStyle="#fbbf24";ctx.lineWidth=.8;ctx.strokeRect(0,0,100,100);
 ctx.restore();
}
function paint(canvas:HTMLCanvasElement,map:ArenaMap,s:ArenaState){
 const bounds=canvas.getBoundingClientRect(),w=bounds.width,h=bounds.height;
 if(w<4||h<4)return;
 const dpr=Math.min(window.devicePixelRatio||1,1.5);
 const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return;
 const player=s.heroes[0],viewW=w<640?52:78,viewH=clamp(viewW*h/w,32,100);
 const camX=clamp(player.x-viewW/2,0,Math.max(0,100-viewW));
 const camY=clamp(player.y-viewH/2,0,Math.max(0,100-viewH));
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#071421";ctx.fillRect(0,0,pw,ph);
 ctx.setTransform(pw/viewW,0,0,ph/viewH,-camX*pw/viewW,-camY*ph/viewH);
 terrain(ctx,map,s.time);
 for(const team of ["blue","red"] as Team[]){const p=basePoint(map,team);core(ctx,p.x,p.y,team,s.cores[team],map.palette,s.time);}
 for(const b of s.towers)if(b.hp>0)tower(ctx,b.x,b.y,b.team,b.hp,map.palette,s.time);
 for(const u of s.minions)if(u.hp>0)minion(ctx,u.x,u.y,u.team,u.hp,map.palette);
 for(const h of s.heroes)if(h.hp>0)hero(ctx,h.x,h.y,h.team,h.hp,h.name,h.id===0,map.palette,s.time);
 for(const effect of s.effects){const alpha=clamp((effect.expires-s.time)/.6,0,1);
  ctx.strokeStyle=effect.color;ctx.globalAlpha=alpha;ctx.lineWidth=.55+alpha*.4;
  ctx.beginPath();ctx.arc(effect.x,effect.y,effect.radius*(1.2-alpha*.3),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
 }
 if(s.playerTarget){ctx.strokeStyle="#fbbf24";ctx.lineWidth=.5;ctx.beginPath();ctx.arc(s.playerTarget.x,s.playerTarget.y,1.4+Math.sin(s.time*6)*.3,0,Math.PI*2);ctx.stroke();}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const vignette=ctx.createLinearGradient(0,h*.7,0,h);
 vignette.addColorStop(0,"#0000");vignette.addColorStop(1,"#07132180");
 ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 minimap(ctx,map,s,w);
}
type Hud={time:number;hp:number;scoreBlue:number;scoreRed:number;blueTower:number;redTower:number;enemies:number;deaths:number;kills:number;winner:Team|null;cooldowns:ArenaState["cooldowns"];fps:number};
const snapshot=(s:ArenaState):Hud=>({time:s.time,hp:s.heroes[0].hp,scoreBlue:s.cores.blue,scoreRed:s.cores.red,
 blueTower:s.towers.filter(t=>t.team==="blue"&&t.hp>0).length,redTower:s.towers.filter(t=>t.team==="red"&&t.hp>0).length,
 enemies:s.heroes.filter(h=>h.team==="red"&&h.hp>0).length,deaths:s.playerDeaths,kills:s.playerKills,winner:s.winner,cooldowns:{...s.cooldowns},fps:s.lastFps});
const formatTime=(n:number)=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");
export default function MobaStage({map,name}:{map:ArenaMap;name:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const state=useRef<ArenaState>(initArena(map));
 const keys=useRef(new Set<string>());
 const joystick=useRef<Point>(point(0,0));
 const lastDirection=useRef<Point>(point(1,-.3));
 const joystickId=useRef<number|null>(null);
 const joystickBase=useRef<Point>(point(0,0));
 const [hud,setHud]=useState<Hud>(()=>snapshot(state.current));
 const [running,setRunning]=useState(true);
 const active=useRef(true);active.current=running;
 const reset=()=>{state.current=initArena(map);setRunning(true);keys.current.clear();joystick.current=point(0,0);setHud(snapshot(state.current));};
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{
   if(["INPUT","TEXTAREA","SELECT"].includes((event.target as HTMLElement)?.tagName))return;
   const key=event.key.toLowerCase();
   if([" ","q","w","e"].includes(key)){
    event.preventDefault();
    const action=key===" "?"attack":key==="q"?"spin":key==="w"?"dash":"heal";
    if(active.current)playerAction(state.current,map,action,lastDirection.current);
   }else if(["arrowup","arrowdown","arrowleft","arrowright","i","j","k","l"].includes(key)){event.preventDefault();keys.current.add(key);}
  };
  const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase());
  const blur=()=>keys.current.clear();
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
  return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
 },[map]);
 useEffect(()=>{
  let raf=0,last=0,acc=0,frames=0;
  const update=(time:number)=>{
   if(!last)last=time;
   const dt=Math.min((time-last)/1000,.055);last=time;
   if(document.visibilityState==="visible"){
    const movement={...joystick.current};
    if(keys.current.has("arrowup")||keys.current.has("i"))movement.y-=1;
    if(keys.current.has("arrowdown")||keys.current.has("k"))movement.y+=1;
    if(keys.current.has("arrowleft")||keys.current.has("j"))movement.x-=1;
    if(keys.current.has("arrowright")||keys.current.has("l"))movement.x+=1;
    if(Math.hypot(movement.x,movement.y)>.12)lastDirection.current={...movement};
    if(active.current)tickArena(state.current,map,dt,movement);
    if(canvas.current&&time-acc>31){paint(canvas.current,map,state.current);frames++;acc=time;}
    if(time%1000<32)state.current.lastFps=frames;
   }
   if(time-lastHud.current>220){setHud(snapshot(state.current));lastHud.current=time;}
   raf=requestAnimationFrame(update);
  };
  raf=requestAnimationFrame(update);return ()=>cancelAnimationFrame(raf);
 },[map]);
 const lastHud=useRef(0);
 const onWorldTap=(event:PointerEvent<HTMLCanvasElement>)=>{
  if(!active.current||state.current.winner)return;
  const rect=event.currentTarget.getBoundingClientRect(),p=state.current.heroes[0];
  const width=rect.width,height=rect.height,viewW=width<640?52:78,viewH=clamp(viewW*height/width,32,100);
  const x=clamp(p.x-viewW/2,0,Math.max(0,100-viewW))+(event.clientX-rect.left)/width*viewW;
  const y=clamp(p.y-viewH/2,0,Math.max(0,100-viewH))+(event.clientY-rect.top)/height*viewH;
  state.current.playerTarget=point(clamp(x,1,99),clamp(y,1,99));
 };
 const joystickMove=(event:PointerEvent<HTMLDivElement>)=>{
  if(joystickId.current!==event.pointerId)return;
  const origin=joystickBase.current;
  const dx=event.clientX-origin.x,dy=event.clientY-origin.y,len=Math.hypot(dx,dy);
  joystick.current={x:dx/Math.max(55,len),y:dy/Math.max(55,len)};
  if(len>8)lastDirection.current={...joystick.current};
  setStick({x:joystick.current.x*40,y:joystick.current.y*40});
 };
 const [stick,setStick]=useState<Point>(point(0,0));
 const startStick=(event:PointerEvent<HTMLDivElement>)=>{
  if(joystickId.current!==null)return;
  joystickId.current=event.pointerId;
  const bounds=event.currentTarget.getBoundingClientRect();
  joystickBase.current=point(bounds.left+bounds.width/2,bounds.top+bounds.height/2);
  event.currentTarget.setPointerCapture(event.pointerId);
  joystickMove(event);
 };
 const endStick=(event:PointerEvent<HTMLDivElement>)=>{
  if(joystickId.current!==event.pointerId)return;
  joystickId.current=null;joystick.current=point(0,0);setStick(point(0,0));
 };
 const useSkill=(action:"attack"|"spin"|"dash"|"heal")=>{
  if(active.current)playerAction(state.current,map,action,lastDirection.current);
 };
 const cooldown=(key:keyof Hud["cooldowns"])=>Math.max(0,Math.ceil(hud.cooldowns[key]-hud.time));
 const skills=[
  {id:"spin" as const,icon:<Wind size={22}/>,label:"Lốc kiếm",key:"Q",className:"from-amber-500 to-orange-700"},
  {id:"dash" as const,icon:<Zap size={22}/>,label:"Lướt",key:"W",className:"from-sky-500 to-blue-700"},
  {id:"heal" as const,icon:<Heart size={22}/>,label:"Hồi máu",key:"E",className:"from-green-500 to-emerald-800"}
 ];
 return <section className="w-full min-w-0 text-white">
  <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl border border-slate-700 bg-[#142338] p-3 text-xs sm:grid-cols-4">
   <div className="flex flex-col gap-1"><span className="text-slate-400">Nhà xanh</span><span className="font-black text-sky-300">{Math.ceil(hud.scoreBlue)}/750 · {hud.blueTower} trụ</span></div>
   <div className="flex flex-col gap-1"><span className="text-slate-400">Nhà đỏ</span><span className="font-black text-rose-300">{Math.ceil(hud.scoreRed)}/750 · {hud.redTower} trụ</span></div>
   <div className="flex flex-col gap-1"><span className="text-slate-400">Trận / K-D</span><span className="font-black text-amber-200">{formatTime(hud.time)} · {hud.kills}/{hud.deaths}</span></div>
   <div className="flex flex-col gap-1"><span className="text-slate-400">Sinh lực / đối phương</span><span className="font-black text-green-300">{Math.ceil(hud.hp)}/130 HP · {hud.enemies} hero</span></div>
  </div>
  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-600 bg-[#071827] shadow-[0_18px_65px_rgba(0,0,0,.4)]">
   <canvas ref={canvas} aria-label="Chiến trường MOBA 3 đường có trụ, rừng, lính và hai nhà chính"
     className="block h-[53dvh] min-h-[390px] w-full touch-none select-none sm:h-[620px]" style={{touchAction:"none"}} onPointerDown={onWorldTap}/>
   <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-amber-300/30 bg-[#071827]/80 px-3 py-2 text-[11px] font-bold text-amber-200">{name} · 5 vs 5 PvE</div>
   {hud.hp<=0&&!hud.winner&&<div className="pointer-events-none absolute inset-x-6 top-1/2 rounded-xl bg-slate-950/90 p-4 text-center text-sm font-bold text-rose-200">Hero đã bị hạ · hồi sinh sau 9 giây</div>}
   {hud.winner&&<div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-5 text-center">
    <Shield size={52} className={hud.winner==="blue"?"text-amber-400":"text-rose-400"}/>
    <h2 className="text-3xl font-black">{hud.winner==="blue"?"Đội xanh chiến thắng!":"Đội đỏ chiến thắng!"}</h2>
    <p className="text-sm text-slate-300">Trận đấu {formatTime(hud.time)} · {hud.kills} lần hạ gục / {hud.deaths} lần bị hạ</p>
    <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold"><RotateCcw size={18}/> Chơi trận mới</button>
   </div>}
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#142338] p-3">
   <div className="flex items-center gap-3">
    <div onPointerDown={startStick} onPointerMove={joystickMove} onPointerUp={endStick} onPointerCancel={endStick} onLostPointerCapture={endStick}
      role="group" aria-label="Joystick điều hướng bằng cảm ứng" style={{touchAction:"none"}} className="relative flex size-28 shrink-0 touch-none select-none items-center justify-center rounded-full border-2 border-sky-400/50 bg-sky-500/10">
     <div className="absolute size-20 rounded-full border border-sky-300/20"/>
     <div className="absolute flex size-11 items-center justify-center rounded-full border border-sky-200/70 bg-sky-500 shadow-lg" style={{transform:"translate("+stick.x+"px,"+stick.y+"px)"}}><Target size={21}/></div>
    </div>
    <div className="hidden text-xs leading-6 text-slate-400 sm:block">Joystick hoặc I/J/K/L để di chuyển. Chạm map để tự chạy.<br/>Space đánh thường · Q lốc kiếm · W lướt · E hồi phục.</div>
   </div>
   <div className="ml-auto flex flex-wrap items-end justify-end gap-2">
    {skills.map(skill=><button key={skill.id} type="button" aria-label={skill.label} disabled={cooldown(skill.id)>0||hud.hp<=0||!!hud.winner}
      onClick={()=>useSkill(skill.id)} className={"relative flex h-[68px] w-[66px] flex-col items-center justify-center gap-1 rounded-xl border border-white/20 bg-gradient-to-br text-[10px] font-bold shadow-lg disabled:grayscale "+skill.className}>
       {skill.icon}<span>{cooldown(skill.id)>0?cooldown(skill.id)+"s":skill.label}</span><span className="absolute -right-1 -top-1 rounded bg-[#071827] px-1.5 py-0.5 text-[9px]">{skill.key}</span>
      </button>)}
    <button type="button" aria-label="Đánh thường" onClick={()=>useSkill("attack")} disabled={hud.hp<=0||!!hud.winner} className="flex size-[78px] flex-col items-center justify-center gap-1 rounded-full border-2 border-orange-200 bg-gradient-to-br from-orange-500 to-rose-700 text-sm font-black shadow-lg shadow-rose-900/30 active:scale-95"><Swords size={27}/> ĐÁNH</button>
   </div>
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs leading-6 text-slate-400">
   <p>3 đường • bụi rậm • rừng • {hud.blueTower+hud.redTower} trụ còn sống • 10 hero • lính đánh tự động • phá trụ để mở nhà chính</p>
   <button type="button" onClick={()=>setRunning(x=>!x)} className="rounded-lg border border-slate-600 px-3 py-2 text-orange-300">{running?"Tạm dừng":"Tiếp tục"}</button>
   <button type="button" onClick={reset} className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2"><RotateCcw size={14}/> Chơi lại</button>
  </div>
  <p className="mt-3 text-xs leading-6 text-amber-200">Bản nguyên mẫu MOBA PvE 5v5 chạy trên máy của bạn. Chưa có người chơi online, matchmaking, hệ thống mua vật phẩm hoặc đồ họa AAA. Không sử dụng ảnh hay tài sản của game thương mại.</p>
 </section>;
}
