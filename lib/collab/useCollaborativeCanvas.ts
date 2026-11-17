"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import * as Y from "yjs";
import {createClient} from "@/lib/supabase/browser";
import {createStudioYTree,type StudioYTree} from "@/lib/collab/y-tree";
import type {BuilderNode} from "@/lib/component-registry";
type Cursor={userId:string;name:string;x:number;y:number};
type SyncApi={connected:boolean;peers:Cursor[];shareCursor:(x:number,y:number)=>void;applyLocal:(tree:BuilderNode[])=>void};
function encode(bytes:Uint8Array):string{
 let s="";for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return btoa(s);
}
function decode(input:string):Uint8Array{
 if(input.length>1000000)throw new Error("Realtime update too large");
 const binary=atob(input),arr=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);
 return arr;
}
export function useCollaborativeCanvas({pageId,userId,initialNodes,onRemote}:{pageId:string;userId:string;initialNodes:BuilderNode[];onRemote:(tree:BuilderNode[])=>void}):SyncApi{
 const model=useRef<StudioYTree|null>(null);
 const channel=useRef<ReturnType<ReturnType<typeof createClient>["channel"]>|null>(null);
 const connected=useRef(false);
 const lastPointer=useRef(0);
 const [status,setStatus]=useState(false);
 const [peers,setPeers]=useState<Cursor[]>([]);
 const remote=useRef(onRemote);
 remote.current=onRemote;
 useEffect(()=>{
  const db=createClient(),instance=createStudioYTree(initialNodes);
  model.current=instance;
  const wire=db.channel("studio-page:"+pageId,{config:{private:true,broadcast:{self:false},presence:{key:userId}}});
  channel.current=wire;
  let disposed=false,displayName="Editor";
  void db.from("profiles").select("display_name").eq("id",userId).maybeSingle().then(({data})=>{
   if(data?.display_name)displayName=data.display_name.slice(0,24);
  });
  const refresh=()=>{
   if(disposed)return;
   const list:Cursor[]=[];
   const states=wire.presenceState();
   for(const [key,entries] of Object.entries(states)){
    if(key===userId||!Array.isArray(entries))continue;
    const state=entries[0] as Record<string,unknown>;
    if(typeof state.x==="number"&&typeof state.y==="number")list.push({userId:key,name:typeof state.name==="string"?state.name.slice(0,24):"Editor",x:state.x,y:state.y});
   }
   setPeers(list.slice(0,8));
  };
  const sendState=()=>{
   if(!connected.current)return;
   void wire.send({type:"broadcast",event:"ydoc",payload:{update:encode(Y.encodeStateAsUpdate(instance.doc))}});
  };
  const onDocUpdate=(update:Uint8Array,origin:unknown)=>{
   if(origin==="network"){
    const tree=instance.snapshot();if(tree)remote.current(tree);
    return;
   }
   if(connected.current&&update.byteLength<500000)void wire.send({type:"broadcast",event:"ydoc",payload:{update:encode(update)}});
  };
  instance.doc.on("update",onDocUpdate);
  wire.on("broadcast",{event:"ydoc"},(message)=>{
   const update=message.payload?.update;
   if(typeof update!=="string")return;
   try{Y.applyUpdate(instance.doc,decode(update),"network");}catch{/* ignore untrusted malformed broadcasts */}
  });
  wire.on("presence",{event:"sync"},refresh);
  wire.on("presence",{event:"join"},()=>sendState());
  wire.on("presence",{event:"leave"},refresh);
  wire.subscribe(status=>{
   if(disposed)return;
   const ready=status==="SUBSCRIBED";
   connected.current=ready;setStatus(ready);
   if(ready){void wire.track({name:displayName});sendState();}
  });
  return()=>{disposed=true;connected.current=false;instance.doc.off("update",onDocUpdate);instance.doc.destroy();model.current=null;channel.current=null;void db.removeChannel(wire);};
 // pageId and initialNodes are stable for one BuilderWorkspace mount.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[pageId,userId]);
 const shareCursor=useCallback((x:number,y:number)=>{
  if(!connected.current||!channel.current||Date.now()-lastPointer.current<160)return;
  lastPointer.current=Date.now();
  void channel.current.track({x:Math.max(0,Math.min(100,x)),y:Math.max(0,Math.min(100,y)),name:"Editor"});
 },[]);
 const applyLocal=useCallback((tree:BuilderNode[])=>model.current?.applyLocal(tree),[]);
 return {connected:status,peers,shareCursor,applyLocal};
}
