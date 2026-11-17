import {createBuilderNode,getDefinition,safeUrl,validateUiTree,type BuilderNode} from "@/lib/component-registry";

/**
 * Compatibility bridge between Chai's flat blocks and NuvoraCraft's nested
 * pages.ui_tree JSONB. It rejects unsupported blocks instead of deleting them.
 * Compatible block subset: Box, Heading, Paragraph, Text, Button, Link, Image, Divider.
 * Chai's full editor has a separate storage contract and must not be
 * pointed at pages.ui_tree without conversion and owner-scoped saves.
 */
export type ChaiBlockData={
 _id:string;_type:string;_parent?:string|null;
 content?:string;tag?:string;image?:string;alt?:string;
 link?:{href?:string;type?:string;target?:string};
 styles?:string;
};
export type ConvertResult={tree:BuilderNode[];warning:string[]};
const supported=new Set(["Box","Heading","Paragraph","Text","Button","Link","Image","Divider"]);
const layout=new Set(["Box"]);
const string=(v:unknown,max=2000):string=>typeof v==="string"?v.slice(0,max):"";
export function chaiBlocksToTree(input:unknown):ConvertResult{
 if(!Array.isArray(input)||input.length>80||!input.every(x=>x&&typeof x==="object"&&!Array.isArray(x)))
  throw new Error("Chai blocks must be an array with at most 80 objects.");
 const blocks=input as ChaiBlockData[];
 const nodes=new Map<string,BuilderNode>();
 const parent=new Map<string,string|null>();
 for(const block of blocks){
  if(!block._id||typeof block._id!=="string"||!/^[-a-zA-Z0-9_]{1,128}$/.test(block._id)||nodes.has(block._id))
   throw new Error("Invalid or duplicate Chai block id.");
  if(!supported.has(block._type))throw new Error("Unsupported Chai block type: "+block._type);
  const type=block._type==="Box"?"container":block._type==="Heading"?
   (block.tag==="h1"?"h1":block.tag==="h3"?"h3":"heading"):
   block._type==="Paragraph"?"paragraph":block._type==="Text"?"text":
   block._type==="Button"?"button":block._type==="Link"?"link":
   block._type==="Image"?"image":"divider";
  const node=createBuilderNode(type);
  node.id=crypto.randomUUID();node.children=[];
  if(block._type==="Image"){
   node.props.src=safeUrl(string(block.image,2048))??"";
   node.props.alt=string(block.alt,300);
  }else if(block._type==="Button"||block._type==="Link"){
   node.props.text=string(block.content);
   const href=string(block.link?.href,2048);
   node.props.href=safeUrl(href)??"";
  }else if(block._type!=="Box"&&block._type!=="Divider")node.props.text=string(block.content);
  nodes.set(block._id,node);
  parent.set(block._id,block._parent??null);
 }
 const roots:BuilderNode[]=[];
 for(const block of blocks){
  const node=nodes.get(block._id)!;
  const parentId=parent.get(block._id);
  if(!parentId){roots.push(node);continue;}
  if(parentId===block._id||!nodes.has(parentId))throw new Error("Chai block has an invalid parent.");
  const parentBlock=blocks.find(x=>x._id===parentId);
  if(!parentBlock||!layout.has(parentBlock._type))throw new Error("Chai children require a Box parent.");
  nodes.get(parentId)!.children.push(node);
 }
 if(roots.length===0&&blocks.length)throw new Error("Chai block hierarchy has no roots.");
 if(!validateUiTree(roots))throw new Error("Chai block tree is cyclic, too deep, or incompatible with NuvoraCraft.");
 return {tree:roots,warning:blocks.some(b=>typeof b.styles==="string"&&b.styles.trim())?
  ["Chai Tailwind classes cannot be translated exactly; visual styles were initialized to NuvoraCraft defaults. Review before publishing."]:[]};
}
export function treeToChaiBlocks(tree:BuilderNode[]):ChaiBlockData[]{
 if(!validateUiTree(tree))throw new Error("Invalid NuvoraCraft tree.");
 const flat:ChaiBlockData[]=[];
 const walk=(items:BuilderNode[],parentId:string|null)=>{
  for(const node of items){
   let type:string;
   if(getDefinition(node.type)?.allowsChildren){
    if(!["container","section","row","column","grid","hero","card"].includes(node.type))
     throw new Error("Unsupported container type for Chai export: "+node.type);
    type="Box";
   }else if(["heading","h1","h3"].includes(node.type))type="Heading";
   else if(["text","paragraph","button","link","image","divider"].includes(node.type))
    type={text:"Text",paragraph:"Paragraph",button:"Button",link:"Link",image:"Image",divider:"Divider"}[node.type]!;
   else throw new Error("Unsupported component for Chai export: "+node.type);
   const block:ChaiBlockData={_id:node.id,_type:type,_parent:parentId};
   if(type==="Heading"){block.tag=node.type==="h1"?"h1":node.type==="h3"?"h3":"h2";block.content=node.props.text??"";}
   else if(type==="Button"||type==="Link"){block.content=node.props.text??"";block.link={type:"url",href:node.props.href??"",target:"_self"};}
   else if(type==="Image"){block.image=node.props.src??"";block.alt=node.props.alt??"";}
   else if(type==="Text"||type==="Paragraph")block.content=node.props.text??"";
   flat.push(block);
   walk(node.children,node.id);
  }
 };
 walk(tree,null);
 return flat;
}
