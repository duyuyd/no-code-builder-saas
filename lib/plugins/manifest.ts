import {validateUiTree,type BuilderNode} from "@/lib/component-registry";
export type StudioPluginManifest={name:string;version:string;description:string;component:{label:string;nodes:BuilderNode[]};transform?:{operation:"none"|"uppercase"|"lowercase"|"prefix";value?:string}};
const safeTypes=new Set(["section","container","hero","card","row","column","grid","heading","h1","h3","paragraph","text","button","link","image"]);
export function validatePluginManifest(raw:unknown):raw is StudioPluginManifest{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Partial<StudioPluginManifest>,node=v.component;
 if(typeof v.name!=="string"||v.name.length<2||v.name.length>80||typeof v.version!=="string"||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(v.version)||
 typeof v.description!=="string"||v.description.length>300||!node||typeof node.label!=="string"||node.label.length>80||
 !validateUiTree(node.nodes)||JSON.stringify(node.nodes).length>50000)return false;
 const count=(nodes:BuilderNode[],depth:number):boolean=>depth<=5&&nodes.length<=30&&nodes.every(n=>safeTypes.has(n.type)&&count(n.children,depth+1));
 if(!count(node.nodes,0))return false;
 if(v.transform&&(!["none","uppercase","lowercase","prefix"].includes(v.transform.operation)||typeof v.transform.value==="string"&&v.transform.value.length>100))return false;
 return true;
}
