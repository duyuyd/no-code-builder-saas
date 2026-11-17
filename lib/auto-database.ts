import type {BuilderNode} from "@/lib/component-registry";
export type FormField={name:string;kind:"text"|"email"|"number"|"checkbox"};
export type FormSchema={nodeId:string;fields:FormField[]};
export function formFieldName(node:BuilderNode):string{
 const configured=node.props.name?.trim().toLowerCase();
 if(configured && /^[a-z][a-z0-9_]{0,39}$/.test(configured) && !["id","submitted_by","created_at"].includes(configured))return configured;
 return "field_"+node.id.replace(/[^a-z0-9]/gi,"").slice(0,20).toLowerCase();
}
export function extractFormSchemas(tree:BuilderNode[]):FormSchema[]{
 const forms:FormSchema[]=[];
 const formTypes=new Set(["form","contact-form","newsletter-form"]);
 const ignore=new Set(["password-input","file-input"]);
 const fieldKinds=new Set(["input","email-input","number-input","phone-input","currency-input","search-input","date-input","time-input","textarea","checkbox","radio","toggle","select"]);
 const walk=(nodes:BuilderNode[],active:FormSchema|null,depth:number)=>{
  if(depth>24)return;
  for(const n of nodes){
   if(formTypes.has(n.type)){
    const next:FormSchema={nodeId:n.id,fields:[]};forms.push(next);walk(n.children,next,depth+1);continue;
   }
   if(active&&fieldKinds.has(n.type)&&!ignore.has(n.type)){
    const kind:FormField["kind"]=n.type==="email-input"?"email":n.type==="number-input"||n.type==="currency-input"?"number":n.type==="checkbox"||n.type==="radio"||n.type==="toggle"?"checkbox":"text";
    const name=formFieldName(n);
    if(!active.fields.some(f=>f.name===name))active.fields.push({name,kind});
   }
   walk(n.children,active,depth+1);
  }
 };
 walk(tree,null,0);
 return forms.filter(f=>f.fields.length>0 && f.fields.length<=16).slice(0,25);
}
