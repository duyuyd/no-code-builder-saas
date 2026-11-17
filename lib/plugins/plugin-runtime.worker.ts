/// <reference lib="webworker" />
import type {StudioPluginManifest} from "./manifest";
import type {BuilderNode} from "@/lib/component-registry";
type WorkerRequest={type:"render";manifest:StudioPluginManifest};
const ctx=self as DedicatedWorkerGlobalScope;
ctx.onmessage=(event:MessageEvent<WorkerRequest>)=>{
 if(event.data?.type!=="render")return;
 try{
  const {manifest}=event.data;
  const operation=manifest.transform?.operation??"none",extra=manifest.transform?.value??"";
  const transform=(text:string)=>operation==="uppercase"?text.toUpperCase():operation==="lowercase"?text.toLowerCase():operation==="prefix"?extra+text:text;
  const visit=(nodes:BuilderNode[],depth:number):BuilderNode[]=>depth>5?[]:nodes.slice(0,30).map(node=>({
   id:node.id,type:node.type,
   props:Object.fromEntries(Object.entries(node.props).map(([key,value])=>[key,key==="text"?transform(value):value])),
   style:{...node.style},children:visit(node.children,depth+1)
  }));
  ctx.postMessage({ok:true,nodes:visit(manifest.component.nodes,0)});
 }catch{ctx.postMessage({ok:false,error:"Plugin manifest rejected"});}
};
export {};
