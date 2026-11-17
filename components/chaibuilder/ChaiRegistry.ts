"use client";
import {registerChaiBlock,registerChaiBlockProps,stylesProp} from "@chaibuilder/sdk/runtime";
import {loadWebBlocks} from "@chaibuilder/sdk/web-blocks";
import {NuvoraChaiBlock} from "./NuvoraChaiBlock";
let ready=false;
export function registerNuvoraBlocks(){
 if(ready)return;ready=true;
 loadWebBlocks();
 registerChaiBlock(NuvoraChaiBlock,{
  type:"NuvoraNode",label:"Nuvora UI Component",category:"core",group:"basic",
  props:registerChaiBlockProps({properties:{
   source:{type:"string",default:"",title:"Original component data",ui:{"ui:widget":"hidden"}},
   content:{type:"string",default:"",title:"Nội dung",ui:{"ui:widget":"textarea"}},
   styles:stylesProp(""),
  }}),
  canAcceptBlock:()=>true,
  aiProps:["content"]
 });
}
