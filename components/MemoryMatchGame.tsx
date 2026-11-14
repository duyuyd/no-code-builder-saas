"use client";

import {useEffect,useMemo,useState,type CSSProperties} from "react";
import {motion} from "framer-motion";
import {RotateCcw,Timer,Trophy,Zap,Sparkles} from "lucide-react";
import {nodeCss,type BuilderNode} from "@/lib/component-registry";

type Card={id:string;symbol:string};
function shuffle(cards:Card[]):Card[]{
 const result=[...cards];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
export default function MemoryMatchGame({node}:{node:BuilderNode}){
 const configured=useMemo(()=>[...new Set((node.props.symbols??"").split("|").map(s=>s.trim()).filter(s=>s.length>0&&s.length<=12))].slice(0,10),[node.props.symbols]);
 const count=Math.min(10,Math.max(3,Math.trunc(Number(node.props.pairCount??"6")||6)));
 const symbols=useMemo(()=>configured.slice(0,count),[configured,count]);
 const baseDeck=useMemo(()=>symbols.flatMap((symbol,i)=>[{id:i+"-a",symbol},{id:i+"-b",symbol}]),[symbols]);
 const [deck,setDeck]=useState<Card[]>(baseDeck);
 const [opened,setOpened]=useState<string[]>([]);
 const [matched,setMatched]=useState<string[]>([]);
 const [moves,setMoves]=useState(0);
 const [seconds,setSeconds]=useState(0);
 const [started,setStarted]=useState(false);
 const [best,setBest]=useState<number|null>(null);
 const [round,setRound]=useState(0);
 const won=symbols.length>=3&&matched.length===deck.length;
 const score=Math.max(0,900-moves*18-seconds*2);
 useEffect(()=>{
  setDeck(shuffle(baseDeck));setOpened([]);setMatched([]);setMoves(0);setSeconds(0);setStarted(false);
 },[baseDeck,round]);
 useEffect(()=>{
  if(!started||won)return;
  const interval=window.setInterval(()=>setSeconds(t=>t+1),1000);
  return ()=>window.clearInterval(interval);
 },[started,won]);
 useEffect(()=>{
  if(opened.length!==2)return;
  const [a,b]=opened;
  const match=deck.find(c=>c.id===a)?.symbol===deck.find(c=>c.id===b)?.symbol;
  const timeout=window.setTimeout(()=>{
   if(match)setMatched(prev=>[...prev,a,b]);
   setOpened([]);
  },match?360:850);
  return ()=>window.clearTimeout(timeout);
 },[opened,deck]);
 useEffect(()=>{if(won)setBest(previous=>previous===null?score:Math.max(previous,score));},[won,score]);
 function flip(id:string){
  if(opened.length>=2||opened.includes(id)||matched.includes(id)||won)return;
  if(!started)setStarted(true);
  if(opened.length===1)setMoves(value=>value+1);
  setOpened(previous=>[...previous,id]);
 }
 const clock=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
 if(symbols.length<3)return <div className="rounded-2xl bg-rose-950 p-5 text-sm text-rose-100">Cần ít nhất 3 biểu tượng khác nhau. Vào Builder → Thuộc tính để chỉnh danh sách.</div>;
 return <section id="game" style={nodeCss(node) as CSSProperties} className="w-full overflow-hidden rounded-[28px] border border-white/10 shadow-2xl">
 <div className="mx-auto w-full max-w-3xl space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-300"><Zap size={13}/> Game thực tế</div>
    <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{node.props.title||"Lật thẻ trí nhớ"}</h2>
    <p className="mt-2 text-sm text-slate-300">Chạm để tìm hai thẻ giống nhau. Ghép tất cả cặp để chiến thắng!</p>
   </div>
   <button type="button" onClick={()=>setRound(x=>x+1)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"><RotateCcw size={16}/> Chơi lại</button>
  </div>
  <div className="grid grid-cols-3 gap-2 sm:gap-3">
   <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center"><Timer size={16} className="mx-auto mb-1 text-orange-300"/><p className="text-xl font-extrabold text-white">{clock}</p><p className="text-[11px] text-slate-300">Thời gian</p></div>
   <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center"><Zap size={16} className="mx-auto mb-1 text-orange-300"/><p className="text-xl font-extrabold text-white">{moves}</p><p className="text-[11px] text-slate-300">Lượt lật</p></div>
   <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center"><Sparkles size={16} className="mx-auto mb-1 text-orange-300"/><p className="text-xl font-extrabold text-white">{matched.length/2}/{symbols.length}</p><p className="text-[11px] text-slate-300">Cặp đúng</p></div>
  </div>
  <div className="grid grid-cols-4 gap-2 sm:gap-3" role="group" aria-label="Bàn chơi lật thẻ">
   {deck.map((card,index)=>{
    const revealed=opened.includes(card.id)||matched.includes(card.id);
    const completed=matched.includes(card.id);
    return <motion.button key={card.id} type="button" onClick={()=>flip(card.id)}
     whileHover={revealed?undefined:{y:-3,scale:1.025}} whileTap={revealed?undefined:{scale:.96}}
     aria-label={"Thẻ "+(index+1)+": "+(revealed?card.symbol:"chưa mở")} aria-pressed={revealed}
     disabled={revealed||opened.length>=2||won}
     className={"relative flex aspect-[1.06/1] min-h-16 select-none items-center justify-center overflow-hidden rounded-2xl border text-3xl font-extrabold shadow-lg transition-[background,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 sm:aspect-square sm:text-5xl "+(completed?"border-emerald-400/70 bg-emerald-500/20 text-white":revealed?"border-white/60 bg-white text-slate-900":"border-white/15 bg-gradient-to-br from-[#334155] to-[#172033] text-orange-200 hover:border-orange-400/70")}>
     <motion.span key={revealed?"face":"back"} initial={{opacity:.4,scale:.65}} animate={{opacity:1,scale:1}} transition={{duration:.18}}>{revealed?card.symbol:"✦"}</motion.span>
     {completed&&<span className="absolute right-1.5 top-1.5 text-xs text-emerald-300">✓</span>}
    </motion.button>;
   })}
  </div>
  {won?<motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} role="status" className="rounded-2xl border border-orange-400/40 bg-gradient-to-r from-orange-600/30 to-amber-500/20 p-5 text-center">
   <Trophy size={42} className="mx-auto text-amber-300"/>
   <p className="mt-2 text-2xl font-black text-white">Chiến thắng! 🎉</p>
   <p className="mt-2 text-sm text-slate-200">{moves} lượt · {clock} · {score} điểm</p>
   <p className="mt-1 text-xs text-amber-200">Điểm cao nhất trong phiên: {best??score}</p>
   <button type="button" onClick={()=>setRound(x=>x+1)} className="mt-4 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-400">Chơi ván mới</button>
  </motion.div>:<div className="flex items-center justify-between gap-3 text-xs text-slate-300">
   <span>{!started?"Chạm vào thẻ bất kỳ để bắt đầu":"Tìm đúng cặp càng nhanh càng tốt"}</span>
   <span className="font-bold text-orange-300">{score} điểm</span>
  </div>}
 </div>
 </section>;
}
