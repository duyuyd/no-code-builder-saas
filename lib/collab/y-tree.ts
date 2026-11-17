import * as Y from "yjs";
import {validateUiTree,type BuilderNode} from "@/lib/component-registry";

type NodeRecord=Y.Map<unknown>;
export type StudioYTree={doc:Y.Doc;applyLocal:(tree:BuilderNode[])=>void;snapshot:()=>BuilderNode[]|null};

function syncFields(record:NodeRecord,key:"props"|"style",fields:Record<string,string>){
 let nested=record.get(key) as Y.Map<string>|undefined;
 if(!(nested instanceof Y.Map)){nested=new Y.Map<string>();record.set(key,nested);}
 for(const existing of Array.from(nested.keys()))if(!(existing in fields))nested.delete(existing);
 for(const [k,v] of Object.entries(fields))if(nested.get(k)!==v)nested.set(k,v);
}
function updateOrder(array:Y.Array<string>,next:string[]){
 const current=array.toArray();
 if(current.length===next.length&&current.every((x,i)=>x===next[i]))return;
 if(array.length)array.delete(0,array.length);
 if(next.length)array.insert(0,next);
}
export function createStudioYTree(initial:BuilderNode[]):StudioYTree{
 if(!validateUiTree(initial))throw new TypeError("Invalid starting builder tree");
 const doc=new Y.Doc();
 const records=doc.getMap<NodeRecord>("nodes");
 const root=doc.getArray<string>("roots");
 const applyLocal=(tree:BuilderNode[])=>{
  if(!validateUiTree(tree))return;
  doc.transact(()=>{
   const known=new Set<string>();
   const visit=(node:BuilderNode)=>{
    known.add(node.id);
    let record=records.get(node.id);
    if(!(record instanceof Y.Map)){record=new Y.Map<unknown>();records.set(node.id,record);}
    if(record.get("type")!==node.type)record.set("type",node.type);
    syncFields(record,"props",node.props);
    syncFields(record,"style",node.style);
    let children=record.get("children") as Y.Array<string>|undefined;
    if(!(children instanceof Y.Array)){children=new Y.Array<string>();record.set("children",children);}
    for(const child of node.children)visit(child);
    updateOrder(children,node.children.map(n=>n.id));
   };
   tree.forEach(visit);
   updateOrder(root,tree.map(n=>n.id));
   for(const id of Array.from(records.keys()))if(!known.has(id))records.delete(id);
  },"local");
 };
 const snapshot=():BuilderNode[]|null=>{
  const seen=new Set<string>();
  const read=(id:string,depth:number):BuilderNode|null=>{
   if(depth>24||seen.has(id))return null;
   const record=records.get(id);
   if(!(record instanceof Y.Map))return null;
   const type=record.get("type");
   const props=record.get("props"),style=record.get("style"),children=record.get("children");
   if(typeof type!=="string"||!(props instanceof Y.Map)||!(style instanceof Y.Map)||!(children instanceof Y.Array))return null;
   seen.add(id);
   const node:BuilderNode={id,type,props:Object.fromEntries(props.entries()),style:Object.fromEntries(style.entries()),children:[]};
   for(const childId of children.toArray()){
    const child=read(String(childId),depth+1);
    if(!child)return null;
    node.children.push(child);
   }
   return node;
  };
  const result:BuilderNode[]=[];
  for(const id of root.toArray()){const node=read(id,0);if(!node)return null;result.push(node);}
  return validateUiTree(result)?result:null;
 };
 applyLocal(initial);
 return {doc,applyLocal,snapshot};
}
