"use client";
import {useCallback,useEffect,useRef,useState,type PointerEvent} from "react";
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Heart,RotateCcw,Shield,Skull,Swords,Timer,Trophy,Star} from "lucide-react";
import {boxesOverlap,gameSize,type GameScene} from "@/lib/game-scene";
type Enemy={id:string;x:number;y:number;hp:number};
type State={x:number;y:number;hp:number;enemies:Enemy[];coins:string[];kills:number;steps:number;seconds:number;started:boolean;won:boolean;lost:boolean;lastContact:number;lastAttack:number};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const dirs:Record<string,[number,number]>={
 arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0],
 w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]
};
const start=(scene:GameScene):State=>({
 x:scene.player.x,y:scene.player.y,hp:100,
 enemies:scene.objects.filter(o=>o.kind==="enemy").map(o=>({id:o.id,x:o.x,y:o.y,hp:o.hp??2})),
 coins:[],kills:0,steps:0,seconds:0,started:false,won:false,lost:false,lastContact:0,lastAttack:0
});
const center=(x:number,y:number,w:number,h:number)=>({x:x+w/2,y:y+h/2});
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
export default function CombatStage({scene}:{scene:GameScene}){
 const [state,setState]=useState<State>(()=>start(scene));
 const pressed=useRef(new Set<string>());
 const frame=useRef<HTMLDivElement>(null);
 const status=useRef(state);status.current=state;
 const walls=scene.objects.filter(o=>o.kind==="wall");
 const coins=scene.objects.filter(o=>o.kind==="coin");
 const goal=scene.objects.find(o=>o.kind==="goal");
 const stageReady=state.started&&!state.won&&!state.lost;
 const attack=useCallback(()=>{
  const now=Date.now();
  setState(previous=>{
   if(previous.won||previous.lost||now-previous.lastAttack<400)return previous;
   const player=center(previous.x,previous.y,gameSize.playerW,gameSize.playerH);
   const inRange=previous.enemies.filter(e=>e.hp>0).map(enemy=>{
    const source=scene.objects.find(o=>o.id===enemy.id);
    const size=source??{w:7,h:9};
    return {enemy,d:dist(player,center(enemy.x,enemy.y,size.w,size.h))};
   }).filter(e=>e.d<15).sort((a,b)=>a.d-b.d)[0];
   if(!inRange)return {...previous,started:true,lastAttack:now};
   const enemies=previous.enemies.map(e=>e.id===inRange.enemy.id?{...e,hp:Math.max(0,e.hp-1)}:e);
   const killed=inRange.enemy.hp===1;
   return {...previous,started:true,lastAttack:now,enemies,kills:previous.kills+(killed?1:0)};
  });
 },[scene]);
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{
   if(["INPUT","TEXTAREA","SELECT"].includes((event.target as HTMLElement)?.tagName))return;
   const key=event.key.toLowerCase();
   if(key===" "||key==="j"||key==="k"){event.preventDefault();attack();return;}
   if(key in dirs){event.preventDefault();pressed.current.add(key);}
  };
  const up=(event:KeyboardEvent)=>pressed.current.delete(event.key.toLowerCase());
  const blur=()=>pressed.current.clear();
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
  return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);pressed.current.clear();};
 },[attack]);
 useEffect(()=>{
  const timer=window.setInterval(()=>{
   if(document.visibilityState!=="visible")return;
   const now=Date.now();
   setState(previous=>{
    if(previous.won||previous.lost)return previous;
    let vx=0,vy=0;
    for(const key of pressed.current){const d=dirs[key];if(d){vx+=d[0];vy+=d[1];}}
    const moving=vx!==0||vy!==0;
    const length=Math.hypot(vx,vy)||1;
    let x=previous.x,y=previous.y;
    if(moving){
     const nx=clamp(x+vx/length*scene.player.speed,0,100-gameSize.playerW);
     const ny=clamp(y+vy/length*scene.player.speed,0,100-gameSize.playerH);
     if(!walls.some(w=>boxesOverlap({x:nx,y:ny,w:gameSize.playerW,h:gameSize.playerH},w))){x=nx;y=ny;}
    }
    const started=previous.started||moving;
    if(!started)return previous;
    const player=center(x,y,gameSize.playerW,gameSize.playerH);
    let contact=false;
    const enemies=previous.enemies.map(enemy=>{
     if(enemy.hp<=0)return enemy;
     const source=scene.objects.find(o=>o.id===enemy.id);
     if(!source)return enemy;
     const enemyAt=center(enemy.x,enemy.y,source.w,source.h);
     const distance=dist(player,enemyAt);
     if(distance<7)contact=true;
     if(distance<7||distance>45)return enemy;
     const factor=.36/distance;
     const nx=clamp(enemy.x+(player.x-enemyAt.x)*factor,0,100-source.w);
     const ny=clamp(enemy.y+(player.y-enemyAt.y)*factor,0,100-source.h);
     if(walls.some(w=>boxesOverlap({x:nx,y:ny,w:source.w,h:source.h},w)))return enemy;
     return {...enemy,x:nx,y:ny};
    });
    let hp=previous.hp,lastContact=previous.lastContact;
    if(contact&&now-previous.lastContact>900){hp=Math.max(0,hp-8);lastContact=now;}
    const collected=[...new Set([...previous.coins,...coins.filter(c=>boxesOverlap({x,y,w:gameSize.playerW,h:gameSize.playerH},c)).map(c=>c.id)])];
    const completeEnemies=enemies.every(e=>e.hp<=0);
    const completeCoins=coins.every(c=>collected.includes(c.id));
    const won=!!goal&&completeEnemies&&completeCoins&&boxesOverlap({x,y,w:gameSize.playerW,h:gameSize.playerH},goal);
    const lost=hp===0;
    return {...previous,x,y,hp,enemies,coins:collected,steps:previous.steps+(moving?1:0),started,won,lost,lastContact};
   });
  },85);
  return ()=>clearInterval(timer);
 },[scene]);
 useEffect(()=>{
  if(!stageReady)return;
  const timer=window.setInterval(()=>setState(p=>p.won||p.lost?p:{...p,seconds:p.seconds+1}),1000);
  return ()=>clearInterval(timer);
 },[stageReady]);
 const ctrl=(key:string)=>({
  onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);pressed.current.add(key);setState(p=>({...p,started:true}));},
  onPointerUp:()=>pressed.current.delete(key),
  onPointerCancel:()=>pressed.current.delete(key),
  onLostPointerCapture:()=>pressed.current.delete(key)
 });
 const restart=()=>{pressed.current.clear();setState(start(scene));};
 const alive=state.enemies.filter(e=>e.hp>0).length;
 const score=state.kills*150+state.coins.length*100+state.hp*2-Math.min(200,state.seconds*2);
 return <section className="w-full min-w-0 text-slate-100">
  <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs sm:grid-cols-4">
   <span className="flex items-center gap-2"><Heart className="text-rose-400" size={16}/> Máu <strong>{state.hp}/100</strong></span>
   <span className="flex items-center gap-2"><Skull className="text-orange-400" size={16}/> Đối thủ <strong>{alive}</strong></span>
   <span className="flex items-center gap-2"><Star className="text-amber-400" size={16}/> Vật phẩm <strong>{state.coins.length}/{coins.length}</strong></span>
   <span className="flex items-center gap-2"><Timer className="text-sky-400" size={16}/> {state.seconds}s · {state.steps} bước</span>
  </div>
  <div ref={frame} className="relative isolate mx-auto aspect-[3/2] w-full touch-none select-none overflow-hidden rounded-2xl border-2 border-slate-600"
    style={{backgroundColor:scene.background,backgroundImage:scene.backgroundImageUrl?"url("+JSON.stringify(scene.backgroundImageUrl)+")":undefined,backgroundSize:"cover",backgroundPosition:"center"}}>
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(#fff2 1px,transparent 1px),linear-gradient(90deg,#fff2 1px,transparent 1px)",backgroundSize:"10% 10%"}}/>
   {scene.objects.filter(o=>o.kind!=="enemy"&&(o.kind!=="coin"||!state.coins.includes(o.id))).map(object=><div key={object.id} className="pointer-events-none absolute z-10 flex items-center justify-center rounded-md border border-white/20 bg-black/10"
     style={{left:object.x+"%",top:object.y+"%",width:object.w+"%",height:object.h+"%",fontSize:"clamp(16px,2.7vw,35px)"}}>
      {object.imageUrl?<img src={object.imageUrl} alt={object.label} draggable={false} className="h-full w-full object-contain"/>:object.label}
     </div>)}
   {state.enemies.filter(e=>e.hp>0).map(enemy=>{
    const original=scene.objects.find(o=>o.id===enemy.id);
    if(!original)return null;
    return <div key={enemy.id} className="pointer-events-none absolute z-20 flex flex-col items-center justify-center rounded-lg border border-rose-400/70 bg-rose-950/30"
      style={{left:enemy.x+"%",top:enemy.y+"%",width:original.w+"%",height:original.h+"%",fontSize:"clamp(17px,3vw,40px)"}}>
       <div className="absolute -top-2 left-0 h-1 w-full rounded-full bg-rose-950"><div className="h-full rounded-full bg-rose-400" style={{width:Math.round(enemy.hp/(original.hp??2)*100)+"%"}}/></div>
       {original.imageUrl?<img src={original.imageUrl} alt={original.label} draggable={false} className="h-full w-full object-contain"/>:original.label}
      </div>;
   })}
   <div className="pointer-events-none absolute z-30 flex items-center justify-center rounded-lg border border-emerald-300/70 bg-emerald-400/10 text-3xl sm:text-4xl"
    style={{left:state.x+"%",top:state.y+"%",width:gameSize.playerW+"%",height:gameSize.playerH+"%"}}>
    {scene.player.imageUrl?<img src={scene.player.imageUrl} alt="Nhân vật người chơi" draggable={false} className="h-full w-full object-contain"/>:scene.player.emoji}
   </div>
   {(state.won||state.lost)&&<div role="status" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-slate-950/90 px-4 text-center">
    {state.won?<Trophy size={49} className="text-amber-400"/>:<Shield size={49} className="text-rose-400"/>}
    <h2 className="text-2xl font-black sm:text-4xl">{state.won?"Chiến thắng!":"Nhân vật bị hạ!"}</h2>
    <p className="text-sm text-slate-300">Tiêu diệt {state.kills} đối thủ · {Math.max(0,score)} điểm · {state.seconds} giây</p>
    <button onClick={restart} className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black"><RotateCcw size={18}/> Chơi lại</button>
   </div>}
  </div>
  <p className="mt-3 text-center text-xs leading-5 text-slate-400">WASD / phím mũi tên để di chuyển, Space/J/K để tấn công. Hạ mọi quái, nhặt vật phẩm rồi đến cổng đích. Để thua khi HP về 0.</p>
  <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
   <div className="grid grid-cols-3 gap-2">
    <span/>
    <button {...ctrl("arrowup")} aria-label="Đi lên" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 active:bg-orange-500"><ArrowUp/></button><span/>
    <button {...ctrl("arrowleft")} aria-label="Sang trái" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 active:bg-orange-500"><ArrowLeft/></button>
    <button {...ctrl("arrowdown")} aria-label="Đi xuống" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 active:bg-orange-500"><ArrowDown/></button>
    <button {...ctrl("arrowright")} aria-label="Sang phải" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 active:bg-orange-500"><ArrowRight/></button>
   </div>
   <div className="flex flex-col items-center gap-2"><button type="button" onPointerDown={event=>{event.preventDefault();attack();}} onClick={attack} aria-label="Tấn công kẻ địch" className="flex size-20 touch-none flex-col items-center justify-center gap-1 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-950/50 active:scale-95 active:bg-rose-500"><Swords size={27}/><span className="text-xs font-black">ĐÁNH</span></button><button type="button" onClick={restart} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-orange-300">Chơi lại</button></div>
  </div>
 </section>;
}
