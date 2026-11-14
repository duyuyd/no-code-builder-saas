import type { BuilderNode } from "./component-registry";
export type ComponentPreset={
 component_type:string;variant_key:string;label_vi:string;context_vi:string;
 props_override:Record<string,string>;style_override:Record<string,string>;children_template:BuilderNode[];sort_order:number;
};
