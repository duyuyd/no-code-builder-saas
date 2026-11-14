// This browser runtime is embedded in every stand-alone exported HTML document.
// It contains no server secrets and never executes user-supplied JavaScript.
export const interactiveExportRuntime = String.raw`
(function(){
 "use strict";
 const style=document.createElement("style");
 style.textContent='*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}body>main{max-width:1140px;margin:0 auto;min-height:70vh;padding:16px;display:flex;flex-direction:column;gap:16px}img,video,iframe{max-width:100%}a{cursor:pointer}button{cursor:pointer}form input,form textarea{min-width:0}.export-game{max-width:800px;margin:auto;width:100%;padding:24px;border-radius:20px;background:#0f172a;color:#fff;box-shadow:0 12px 40px #0002}.export-game h2{font-size:clamp(24px,4vw,34px);margin:0 0 8px}.export-game p{line-height:1.55}.game-controls{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:12px 0}.game-reset,.quiz-answer,.quiz-next{border:1px solid #ffffff44;border-radius:12px;padding:12px 16px;font:inherit}.game-reset,.quiz-next{background:#f97316;color:#fff;font-weight:700}.memory-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.memory-card{aspect-ratio:1/1;border:1px solid #ffffff44;background:linear-gradient(135deg,#334155,#172033);border-radius:14px;font-size:clamp(22px,5vw,40px);color:#fb923c;transition:transform .15s,background .15s}.memory-card:hover:not(:disabled){transform:translateY(-3px)}.memory-card:focus-visible{outline:3px solid #f97316}.memory-card.revealed{background:#fff;color:#111827}.memory-card.matched{background:#064e3b;color:#fff;border-color:#34d399}.game-success{border:1px solid #f97316;background:#9a341233;border-radius:14px;padding:16px;text-align:center}.quiz-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.quiz-answer{background:#fff;color:#0f172a;text-align:left;font-weight:600}.quiz-answer.correct{background:#d1fae5;color:#064e3b;border-color:#10b981}.quiz-answer.wrong{background:#ffe4e6;color:#9f1239;border-color:#fb7185}.game-error{color:#fecaca}@media(max-width:500px){.export-game{padding:14px}.quiz-options{grid-template-columns:1fr}}';
 document.head.appendChild(style);
 const el=(tag,className,text)=>{
  const e=document.createElement(tag);
  if(className)e.className=className;
  if(text!==undefined)e.textContent=text;
  return e;
 };
 const shuffled=(source)=>{
  const items=[...source];
  for(let i=items.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [items[i],items[j]]=[items[j],items[i]];
  }
  return items;
 };
 function initMemory(root){
  let config;
  try{config=JSON.parse(root.dataset.memory||'{}');}catch{config={};}
  const symbols=[...new Set(String(config.symbols||'').split('|').map(s=>s.trim()).filter(Boolean))].slice(0,Math.min(10,Math.max(3,Number(config.pairCount)||6)));
  if(symbols.length<3){root.appendChild(el('p','game-error','Cần ít nhất ba biểu tượng.'));return;}
  const header=el('h2','',String(config.title||'Lật thẻ trí nhớ'));
  const instructions=el('p','','Lật hai thẻ giống nhau. Ghép hết các cặp để thắng!');
  const metrics=el('div','game-controls');
  const timeLabel=el('span','','⏱ 00:00'),movesLabel=el('span','','🎯 0 lượt'),matchedLabel=el('span','','0/'+symbols.length+' cặp');
  metrics.append(timeLabel,movesLabel,matchedLabel);
  const grid=el('div','memory-grid');
  const notice=el('div','','');
  const reset=el('button','game-reset','⟳ Chơi lại');reset.type='button';
  let deck=[],open=[],matched=new Set(),moves=0,seconds=0,timer=null,locked=false,started=false;
  const resetRound=()=>{
   if(timer)clearInterval(timer);timer=null;
   deck=shuffled(symbols.flatMap((symbol,i)=>[{id:i+'a',symbol},{id:i+'b',symbol}]));
   open=[];matched=new Set();moves=0;seconds=0;locked=false;started=false;
   notice.replaceChildren();render();
  };
  const render=()=>{
   timeLabel.textContent='⏱ '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
   movesLabel.textContent='🎯 '+moves+' lượt';matchedLabel.textContent=(matched.size/2)+'/'+symbols.length+' cặp';
   grid.replaceChildren();
   for(let i=0;i<deck.length;i++){
    const card=deck[i];const shown=open.includes(card.id)||matched.has(card.id);
    const button=el('button','memory-card'+(matched.has(card.id)?' matched':shown?' revealed':''),shown?card.symbol:'✦');
    button.type='button';button.disabled=shown||locked||matched.size===deck.length;
    button.setAttribute('aria-label','Thẻ '+(i+1)+(shown?' '+card.symbol:' chưa mở'));
    button.addEventListener('click',()=>flip(card.id));
    grid.append(button);
   }
  };
  const flip=(id)=>{
   if(locked||open.includes(id)||matched.has(id))return;
   if(!started){started=true;timer=setInterval(()=>{seconds++;render();},1000);}
   open.push(id);if(open.length===2)moves++;
   render();
   if(open.length!==2)return;
   locked=true;
   const same=deck.find(c=>c.id===open[0]).symbol===deck.find(c=>c.id===open[1]).symbol;
   setTimeout(()=>{
    if(same){matched.add(open[0]);matched.add(open[1]);}
    open=[];locked=false;render();
    if(matched.size===deck.length){
     if(timer)clearInterval(timer);timer=null;
     const score=Math.max(0,900-moves*18-seconds*2);
     notice.replaceChildren(el('p','game-success','🏆 Chiến thắng! '+score+' điểm · '+moves+' lượt · '+seconds+' giây'));
    }
   },same?350:850);
  };
  reset.addEventListener('click',resetRound);
  root.replaceChildren(header,instructions,metrics,grid,notice,reset);resetRound();
 }
 function initQuiz(root){
  let config;
  try{config=JSON.parse(root.dataset.quiz||'{}');}catch{config={};}
  const rows=String(config.questions||'').split(/\r?\n/).map(line=>line.split('|').map(s=>s.trim())).filter(row=>row.length===6&&row.slice(0,5).every(Boolean)&&/^[1-4]$/.test(row[5])).slice(0,40);
  const heading=el('h2','',String(config.title||'Đố vui'));
  const status=el('p','',''),question=el('h3','',''),options=el('div','quiz-options'),note=el('p','','');
  const next=el('button','quiz-next','Tiếp tục');next.type='button';
  let index=0,selected=null,score=0;
  const render=()=>{
   options.replaceChildren();note.textContent='';
   if(!rows.length){status.textContent='Hãy cấu hình câu hỏi trong Builder.';question.textContent='';next.hidden=true;return;}
   if(index>=rows.length){
    status.textContent='🏆 Kết quả';question.textContent=score+'/'+rows.length+' điểm';
    next.hidden=false;next.textContent='Chơi lại';return;
   }
   const current=rows[index];status.textContent='Câu '+(index+1)+'/'+rows.length+' · '+score+' điểm';
   question.textContent=current[0];next.hidden=selected===null;next.textContent=index+1===rows.length?'Xem kết quả':'Tiếp tục';
   current.slice(1,5).forEach((answer,j)=>{
    const b=el('button','quiz-answer',String.fromCharCode(65+j)+'. '+answer);b.type='button';
    b.disabled=selected!==null;
    if(selected!==null){if(j===Number(current[5])-1)b.classList.add('correct');else if(selected===j)b.classList.add('wrong');}
    b.addEventListener('click',()=>{
     if(selected!==null)return;selected=j;
     if(selected===Number(current[5])-1)score++;
     render();note.textContent=selected===Number(current[5])-1?'✅ Chính xác!':'Đáp án đúng: '+current[Number(current[5])];
    });options.append(b);
   });
  };
  next.addEventListener('click',()=>{if(index>=rows.length){index=0;selected=null;score=0;}else{index++;selected=null;}render();});
  root.replaceChildren(heading,status,question,options,note,next);render();
 }
 document.querySelectorAll('[data-memory]').forEach(initMemory);
 document.querySelectorAll('[data-quiz]').forEach(initQuiz);
 document.querySelectorAll('form[data-recipient]').forEach(form=>{
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const email=form.dataset.recipient||'';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert('Chưa cấu hình email nhận biểu mẫu.');return;}
   const parts=Array.from(new FormData(form).entries()).filter(pair=>typeof pair[1]==='string').map(pair=>pair[0]+': '+pair[1]);
   location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Liên hệ từ website')+'&body='+encodeURIComponent(parts.join('\n').slice(0,6000));
  });
 });
})();`;
