import {createBuilderNode,validateUiTree,getDefinition,type BuilderNode} from "@/lib/component-registry";
export type UnifiedChaiBlock={
 _id:string;_type:string;_parent?:string|null;
 content?:string;source?:string;styles?:string;
 tag?:string;image?:string;alt?:string;link?:{href?:string};
 placeholder?:string;name?:string;
};
const eligible=new Set(["Box","Row","Column","Heading","Text","Paragraph","Button","Link","Image","Divider","Form","Input","TextArea","Checkbox","Select"]);
function asObject(v:unknown):Record<string,unknown>|null{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;}
export function toUnifiedChai(tree:BuilderNode[]):UnifiedChaiBlock[]{
 if(!validateUiTree(tree))throw Error("Invalid legacy ui_tree");
 const out:UnifiedChaiBlock[]=[];
 const walk=(nodes:BuilderNode[],parent:string|null)=>{
  for(const node of nodes){
   const original={id:node.id,type:node.type,props:node.props,style:node.style};
   out.push({_id:node.id,_type:"NuvoraNode",_parent:parent,source:JSON.stringify(original),content:node.props.text??node.props.label??node.type,styles:""});
   walk(node.children,node.id);
  }
 };
 walk(tree,null);return out;
}
export function fromUnifiedChai(input:unknown):BuilderNode[]{
 if(!Array.isArray(input)||input.length>1500)throw Error("Too many Chai blocks");
 const flat=input as UnifiedChaiBlock[];
 const mapped=new Map<string,BuilderNode>();
 const ids=new Set<string>();
 for(const block of flat){
  if(!block||typeof block!=="object"||typeof block._id!=="string"||!/^[-_a-z0-9]{1,100}$/i.test(block._id)||ids.has(block._id))throw Error("Invalid or duplicate Chai id");
  if(block._parent!==undefined&&block._parent!==null&&(typeof block._parent!=="string"||!/^[-_a-z0-9]{1,100}$/i.test(block._parent)))throw Error("Invalid Chai parent id");
  ids.add(block._id);
  let n:BuilderNode;
  if(block._type==="NuvoraNode"){
   const raw=asObject(JSON.parse(typeof block.source==="string"?block.source:"null"));
   if(!raw||raw.id!==block._id||typeof raw.type!=="string"||!getDefinition(raw.type))throw Error("Nuvora source is not a valid legacy component");
   const props=asObject(raw.props),style=asObject(raw.style);
   if(!props||!style)throw Error("Legacy component props or styles missing");
   n={id:block._id,type:raw.type,props:{...(props as Record<string,string>)},style:{...(style as Record<string,string>)},children:[]};
   const edited=typeof block.content==="string"?block.content.slice(0,12000):null;
   // Only apply changes to fields represented by the original component.
   // An absent Chai content property is not an instruction to erase text.
   if(edited!==null){
    if(n.props.text!==undefined){if(edited!==n.props.text)n.props.text=edited;}
    else if(n.props.label!==undefined&&edited!==n.props.label)n.props.label=edited;
   }
  }else{
   if(!eligible.has(block._type))throw Error("Unsupported Chai block: "+String(block._type));
   if(block.content!==undefined&&typeof block.content!=="string")throw Error("Invalid Chai content type");
   if(block.link!==undefined&&(!asObject(block.link)||(block.link.href!==undefined&&typeof block.link.href!=="string")))throw Error("Invalid Chai link");
   for(const field of ["image","alt","name","placeholder"] as const){
    if(block[field]!==undefined&&typeof block[field]!=="string")throw Error("Invalid Chai "+field);
   }
   const kind:Record<string,string>={Box:"container",Row:"row",Column:"column",Heading:"heading",Text:"text",Paragraph:"paragraph",Button:"button",Link:"link",Image:"image",Divider:"divider",Form:"form",Input:"input",TextArea:"textarea",Checkbox:"checkbox",Select:"select"};
   n=createBuilderNode(kind[block._type]);
   n.id=block._id;n.children=[];
   if(["heading","text","paragraph","button","link"].includes(n.type))n.props.text=(block.content??"").slice(0,12000);
   if(n.type==="link"||n.type==="button")n.props.href=(block.link?.href??"").slice(0,2048);
   if(n.type==="image"){n.props.src=(block.image??"").slice(0,2048);n.props.alt=(block.alt??"").slice(0,300);}
   if(["input","textarea","select","checkbox"].includes(n.type))n.props.name=(block.name??"").slice(0,100);
   if(n.type==="input"||n.type==="textarea")n.props.placeholder=(block.placeholder??"").slice(0,1200);
  }
  mapped.set(block._id,n);
 }
 const roots:BuilderNode[]=[];
 for(const b of flat){
  const n=mapped.get(b._id)!;
  if(b._parent){
   const parent=mapped.get(b._parent);
   if(!parent)throw Error("Chai block references a missing parent.");
   parent.children.push(n);
  }else roots.push(n);
 }
 const seen=new Set<string>();const visit=(nodes:BuilderNode[],depth:number)=>{if(depth>24)throw Error("Chai tree too deep");for(const n of nodes){if(seen.has(n.id))throw Error("Chai parent graph contains a cycle");seen.add(n.id);visit(n.children,depth+1);}};visit(roots,0);if(seen.size!==flat.length)throw Error("Disconnected Chai blocks would be lost");
 if(!validateUiTree(roots)||JSON.stringify(roots).length>600000)throw Error("Chai changes are incompatible with legacy output (possibly a cycle, too much nesting or unsupported child). Existing page was not overwritten.");
 return roots;
}
