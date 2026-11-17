import {createBuilderNode,validateUiTree,type BuilderNode} from "@/lib/component-registry";
type FigmaNode={id?:string;name?:string;type?:string;characters?:string;children?:unknown[];fills?:unknown[];cornerRadius?:number;style?:{fontSize?:number}};
type Fill={type?:string;visible?:boolean;color?:{r?:number;g?:number;b?:number;a?:number}};
function object(v:unknown):Record<string,unknown>|null{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;}
export function extractFigmaFileLink(input:string):{fileKey:string;nodeId?:string}{
 if(input.length>700)throw new Error("Figma URL too long");
 let url:URL;try{url=new URL(input);}catch{throw new Error("Invalid Figma URL");}
 if(url.protocol!=="https:"||!["figma.com","www.figma.com"].includes(url.hostname))throw new Error("Only https://www.figma.com URLs are supported");
 const match=url.pathname.match(/^\/(?:file|design|proto)\/([a-zA-Z0-9]{8,128})(?:\/|$)/);
 if(!match)throw new Error("Figma design/file link must contain a file key");
 const rawId=url.searchParams.get("node-id");
 if(rawId&& !/^[0-9]+(?:[-:][0-9]+)+$/.test(rawId))throw new Error("Invalid Figma node ID");
 return {fileKey:match[1],...(rawId?{nodeId:rawId.replace(/-/g,":")}: {})};
}
function hex(v:unknown):string|null{
 const color=object(v);
 if(!color||!["r","g","b"].every(k=>typeof color[k]==="number"))return null;
 const c=(key:"r"|"g"|"b")=>Math.max(0,Math.min(255,Math.round(Number(color[key])*255))).toString(16).padStart(2,"0");
 return "#"+c("r")+c("g")+c("b");
}
function fillHex(node:FigmaNode):string|null{
 if(!Array.isArray(node.fills))return null;
 const solid=node.fills.find(f=>{const x=f as Fill;return x?.type==="SOLID"&&x.visible!==false;}) as Fill|undefined;
 return solid?hex(solid.color):null;
}
export function figmaToUiTree(raw:unknown):BuilderNode[]{
 const source=object(raw);if(!source)throw new Error("Missing Figma document");
 let count=0;
 const convert=(v:unknown,depth:number):BuilderNode|null=>{
  const n=object(v) as FigmaNode|null;
  if(!n||depth>9||++count>160)throw new Error("Figma document too deep or large");
  if(n.type==="DOCUMENT"||n.type==="CANVAS"){const item=createBuilderNode("section");item.props.label=(n.name??"Design").slice(0,120);item.children=(n.children??[]).slice(0,80).map(x=>convert(x,depth+1)).filter((x):x is BuilderNode=>x!==null);return item;}
  if(n.type==="TEXT"){
   const size=Number(n.style?.fontSize??16);
   const item=createBuilderNode(size>=28?"heading":"paragraph");
   item.props.text=String(n.characters??n.name??"").slice(0,3000);
   item.style.fontSize=String(Math.max(10,Math.min(120,size)));
   const fg=fillHex(n);if(fg)item.style.color=fg;
   return item;
  }
  const containerTypes=["FRAME","GROUP","SECTION","COMPONENT","INSTANCE","COMPONENT_SET"];
  if(containerTypes.includes(n.type??"")){
   const item=createBuilderNode(n.type==="FRAME"?"section":"container");
   item.props.label=String(n.name??"Figma layer").slice(0,120);
   const bg=fillHex(n);if(bg)item.style.backgroundColor=bg;
   if(typeof n.cornerRadius==="number")item.style.borderRadius=String(Math.max(0,Math.min(200,Math.round(n.cornerRadius))));
   item.children=(n.children??[]).slice(0,80).map(x=>convert(x,depth+1)).filter((x):x is BuilderNode=>x!==null);
   return item;
  }
  if(n.type==="RECTANGLE"||n.type==="ELLIPSE"){
   const item=createBuilderNode("container");
   item.props.label=String(n.name??n.type).slice(0,120);
   const bg=fillHex(n);if(bg)item.style.backgroundColor=bg;
   if(n.type==="ELLIPSE")item.style.borderRadius="100";
   return item;
  }
  // Unsupported vectors/effects must never be represented as fully converted.
  return null;
 };
 const root=convert(source,0);
 const nodes=root?[root]:[];
 if(!validateUiTree(nodes)||!nodes.length)throw new Error("No supported Figma layers to import");
 return nodes;
}
