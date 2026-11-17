"use client";
import {createElement,type ReactNode,type CSSProperties} from "react";
import {getDefinition,nodeCss,safeUrl,type BuilderNode} from "@/lib/component-registry";
type Props={blockProps?:Record<string,unknown>;children?:ReactNode;source?:string;content?:string;styles?:Record<string,unknown>;inBuilder?:boolean};
export function NuvoraChaiBlock({blockProps,children,source,content,styles}:Props){
 let data:BuilderNode|null=null;
 try{const v=JSON.parse(source??"null") as Partial<BuilderNode>;if(v&&typeof v.type==="string"&&typeof v.id==="string"&&v.props&&v.style&&getDefinition(v.type))data={id:v.id,type:v.type,props:v.props,style:v.style,children:[]};}
 catch{/* no render until a valid source exists */}
 if(!data)return <div {...blockProps} className="rounded-xl border border-dashed border-slate-400 p-3 text-xs">Nuvora block: missing data</div>;
 const def=getDefinition(data.type)!;const css=nodeCss(data) as CSSProperties;
 const label=typeof content==="string"?content:data.props.text??data.props.label??data.type;
 if(def.kind==="text")return createElement(def.tag,{...blockProps,style:css},label);
 if(def.kind==="button")return <button {...blockProps} type="button" style={css}>{label}</button>;
 if(def.kind==="link")return <a {...blockProps} style={css} href={safeUrl(data.props.href??"")||"#"} onClick={e=>e.preventDefault()}>{label}</a>;
 if(def.kind==="image")return <div {...blockProps} style={css}>{safeUrl(data.props.src??"")?<img src={safeUrl(data.props.src)} alt={data.props.alt??""} style={{maxWidth:"100%"}}/>:"Image: "+(data.props.alt??"")}</div>;
 if(def.kind==="divider")return <hr {...blockProps} style={css}/>;
 if(def.kind==="container")return createElement("div",{...blockProps,style:css},<>{children??null}</>);
 if(def.kind==="input"||def.kind==="textarea"||def.kind==="checkbox"||def.kind==="range")return <div {...blockProps} style={css} className="rounded-md border border-dashed p-2 text-xs">{data.type}: {data.props.placeholder??label}</div>;
 return <div {...blockProps} style={css} className="rounded-lg border border-slate-200 p-3"><div style={{fontSize:12,opacity:.5}}>{data.type} · retained legacy component</div><div>{label}</div>{children}</div>;
}
