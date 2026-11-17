"use client";
import {AbsoluteFill,Easing,interpolate,useCurrentFrame} from "remotion";
import type {BuilderNode} from "@/lib/component-registry";
type VideoProps={projectName:string;pagePath:string;nodes:BuilderNode[]};
function collect(items:BuilderNode[],acc:{type:string;text:string;color:string}[],depth=0){
 if(depth>16||acc.length>36)return;
 for(const n of items){
  if(acc.length>=36)return;
  const text=(n.props.text??n.props.label??n.props.alt??"").replace(/<[^>]*>/g,"").trim();
  if(text)acc.push({type:n.type,text:text.slice(0,150),color:/^#[a-f0-9]{6}$/i.test(n.style.color??"")?n.style.color:"#172033"});
  collect(n.children,acc,depth+1);
 }
}
export function NuvoraVideoComposition({projectName,pagePath,nodes}:VideoProps){
 const frame=useCurrentFrame();
 const blocks:{type:string;text:string;color:string}[]=[];
 collect(nodes,blocks);
 const enter=interpolate(frame,[0,30],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 const travel=interpolate(frame,[40,320],[0,-Math.max(0,blocks.length*62-380)],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.inOut(Easing.cubic)});
 const progress=interpolate(frame,[0,359],[0,100],{extrapolateRight:"clamp"});
 return <AbsoluteFill style={{background:"linear-gradient(140deg,#080f20 0%,#15253b 54%,#2f170c 100%)",fontFamily:"Arial,sans-serif",color:"#fff"}}>
  <div style={{position:"absolute",top:70,left:75,right:75,display:"flex",justifyContent:"space-between",alignItems:"center",opacity:enter}}>
   <div style={{fontSize:26,fontWeight:800,letterSpacing:2}}>NUVORACRAFT</div><div style={{fontSize:16,color:"#fdba74"}}>WEBSITE DEMO · {pagePath}</div>
  </div>
  <div style={{position:"absolute",left:75,right:75,top:145,bottom:80,padding:7,borderRadius:22,background:"#fb923c",boxShadow:"0 24px 60px rgba(0,0,0,.45)",transform:"scale("+interpolate(enter,[0,1],[0.93,1])+")"}}>
   <div style={{height:"100%",borderRadius:16,background:"#f8fafc",overflow:"hidden",color:"#172033"}}>
    <div style={{height:46,background:"#e2e8f0",display:"flex",alignItems:"center",gap:9,paddingLeft:24}}>
     <span style={{height:11,width:11,borderRadius:11,background:"#ef4444"}}/><span style={{height:11,width:11,borderRadius:11,background:"#eab308"}}/><span style={{height:11,width:11,borderRadius:11,background:"#22c55e"}}/>
     <div style={{marginLeft:25,fontSize:15,fontWeight:700}}>{projectName.slice(0,90)}</div>
    </div>
    <div style={{padding:"28px 42px",transform:"translateY("+travel+"px)"}}>
     <div style={{fontSize:43,fontWeight:800,marginBottom:24}}>{projectName.slice(0,70)}</div>
     {blocks.map((b,i)=>(
      <div key={i} style={{fontSize:b.type==="h1"||b.type==="hero"?30:b.type.includes("heading")?24:18,
       fontWeight:b.type==="h1"||b.type.includes("heading")?800:400,marginBottom:12,
       padding:b.type.includes("button")?16:10,borderRadius:12,
       background:b.type.includes("button")?"#fb923c":i%3===0?"#f1f5f9":"#fff",
       color:b.type.includes("button")?"#fff":b.color,whiteSpace:"normal",overflow:"hidden"}}>
       {b.text}
      </div>
     ))}
    </div>
   </div>
  </div>
  <div style={{position:"absolute",bottom:30,left:75,right:75,height:5,background:"#334155",borderRadius:10}}>
   <div style={{width:progress+"%",height:"100%",background:"#fb923c",borderRadius:10}}/>
  </div>
 </AbsoluteFill>;
}
