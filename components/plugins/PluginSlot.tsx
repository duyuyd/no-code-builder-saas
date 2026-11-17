"use client";
import {useEffect,useState,createElement} from "react";
import {createClient} from "@/lib/supabase/browser";
import {nodeCss,safeUrl,validateUiTree,type BuilderNode} from "@/lib/component-registry";
import {validatePluginManifest,type StudioPluginManifest} from "@/lib/plugins/manifest";
function Render({node}:{node:BuilderNode}){
 const tag=["section","hero","container","row","column","grid","card"].includes(node.type)?"section":node.type==="heading"||node.type==="h1"?"h2":node.type==="h3"?"h3":node.type==="button"?"button":node.type==="link"?"a":node.type==="image"?"img":"p";
 const attrs:Record<string,unknown>={style:nodeCss(node),className:"max-w-full break-words"};
 if(tag==="a")attrs.href=safeUrl(node.props.href??"")||"#";
 if(tag==="img")return createElement("img",{...attrs,src:safeUrl(node.props.src??""),alt:node.props.alt??"",loading:"lazy"});
 return createElement(tag,attrs,node.props.text??node.children.map(n=><Render key={n.id} node={n}/>));
}
export default function PluginSlot({pluginId}:{pluginId:string}){
 const [nodes,setNodes]=useState<BuilderNode[]>([]),[message,setMessage]=useState("Loading plugin...");
 useEffect(()=>{
  if(!/^[a-f0-9-]{36}$/i.test(pluginId)){setMessage("Choose a plugin from /plugins.");return;}
  let alive=true;const db=createClient();
  void Promise.resolve(db.from("studio_plugins").select("manifest").eq("id",pluginId).eq("enabled",true).maybeSingle()).then(({data,error})=>{
   if(!alive)return;
   if(error||!validatePluginManifest(data?.manifest)){setMessage("Plugin not enabled or invalid");return;}
   const worker=new Worker(new URL("../../lib/plugins/plugin-runtime.worker.ts",import.meta.url),{type:"module"});
   worker.onmessage=(event:MessageEvent<{ok?:boolean;nodes?:BuilderNode[]}>)=>{
    if(!alive)return;
    if(event.data?.ok&&validateUiTree(event.data.nodes)){setNodes(event.data.nodes);setMessage("");}else setMessage("Plugin runtime rejected output");
    worker.terminate();
   };
   worker.onerror=()=>{if(alive)setMessage("Plugin worker unavailable");worker.terminate();};
   worker.postMessage({type:"render",manifest:data.manifest as StudioPluginManifest});
  }).catch(()=>{if(alive)setMessage("Plugin could not load");});
  return()=>{alive=false;};
 },[pluginId]);
 if(message)return <p role="status" className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{message}</p>;
 return <div className="min-w-0 space-y-3">{nodes.map(n=><Render key={n.id} node={n}/>)}</div>;
}
