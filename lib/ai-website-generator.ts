import {createBuilderNode,getDefinition,safeUrl,validateUiTree,type BuilderNode} from "@/lib/component-registry";
export type AiWebsite={name:string;tree:BuilderNode[]};
const allowed=new Set(["section","container","hero","card","row","column","grid","heading","h1","h3","paragraph","text","button","link","image"]);
function asObject(v:unknown):Record<string,unknown>|null{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;}
export function parseAiWebsiteResponse(raw:string):AiWebsite{
 if(raw.length>45000)throw new Error("Model output too large");
 const response=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
 let value:unknown;
 try{value=JSON.parse(response);}catch{throw new Error("AI returned malformed JSON");}
 const root=asObject(value);
 if(!root||typeof root.name!=="string"||!Array.isArray(root.ui_tree))throw new Error("Missing AI page JSON");
 const name=root.name.trim().slice(0,100);
 if(!name)throw new Error("Missing website title");
 let count=0;
 const walk=(items:unknown[],depth:number):BuilderNode[]=>{
  if(depth>6||items.length>30)throw new Error("AI component depth/size limit exceeded");
  return items.map(v=>{
   if(++count>80)throw new Error("AI component limit exceeded");
   const n=asObject(v),type=n?.type;
   if(typeof type!=="string"||!allowed.has(type))throw new Error("Unsupported AI component "+String(type));
   const def=getDefinition(type);
   if(!def)throw new Error("Component missing from registry");
   const node=createBuilderNode(type);
   const props=asObject(n?.props);
   if(props)for(const [key,val] of Object.entries(props)){
    if(!(key in def.propsSchema)||typeof val!=="string"||val.length>2000)continue;
    if(key==="href"||key==="src"){const u=safeUrl(val);if(!u)continue;node.props[key]=u;}
    else node.props[key]=val;
   }
   const style=asObject(n?.style);
   if(style)for(const [key,val] of Object.entries(style)){
    const schema=def.styleSchema[key];if(!schema||typeof val!=="string")continue;
    if(schema.type==="color"&&!/^#[a-f0-9]{6}$/i.test(val))continue;
    if(schema.type==="number"&&(!Number.isFinite(Number(val))||Math.abs(Number(val))>10000))continue;
    if(schema.type==="select"&&schema.options&&!schema.options.includes(val))continue;
    node.style[key]=val;
   }
   if(def.allowsChildren&&Array.isArray(n?.children))node.children=walk(n.children,depth+1);
   return node;
  });
 };
 const tree=walk(root.ui_tree,0);
 if(!tree.length||!validateUiTree(tree)||JSON.stringify(tree).length>150000)throw new Error("AI generated an invalid component tree");
 return {name,tree};
}
