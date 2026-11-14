export type CharacterModel={
 skin:string;outfit:string;hair:string;pants:string;
 headSize:number;bodyWidth:number;armLength:number;legLength:number;
 eyeStyle:"round"|"square";
 scene?:"studio"|"forest"|"arena"|"castle"|"stadium";
 pose?:"idle"|"run"|"combat"|"victory";
 equipment?:"none"|"sword"|"staff"|"shield";
 aura?:"none"|"flame"|"electric"|"heal";
 strength?:number;agility?:number;defense?:number;
 timelineSpeed?:number;
};
const HEX=/^#[0-9a-fA-F]{6}$/;
const options={
 scene:["studio","forest","arena","castle","stadium"],
 pose:["idle","run","combat","victory"],
 equipment:["none","sword","staff","shield"],
 aura:["none","flame","electric","heal"]
} as const;
export function isCharacterModel(value:unknown):value is CharacterModel{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const m=value as Record<string,unknown>;
 const allowed=["skin","outfit","hair","pants","headSize","bodyWidth","armLength","legLength","eyeStyle","scene","pose","equipment","aura","strength","agility","defense","timelineSpeed"];
 if(Object.keys(m).some(key=>!allowed.includes(key)))return false;
 if(!(["skin","outfit","hair","pants"] as const).every(key=>typeof m[key]==="string"&&HEX.test(m[key] as string)))return false;
 if(!(["headSize","bodyWidth","armLength","legLength"] as const).every(key=>typeof m[key]==="number"&&Number.isFinite(m[key])&&Number(m[key])>=0.55&&Number(m[key])<=1.65))return false;
 if(m.eyeStyle!=="round"&&m.eyeStyle!=="square")return false;
 for(const [key,choices] of Object.entries(options)){
  if(m[key]!==undefined&&!choices.includes(m[key] as never))return false;
 }
 for(const key of ["strength","agility","defense"]){
  if(m[key]!==undefined&&(!Number.isInteger(m[key])||Number(m[key])<0||Number(m[key])>100))return false;
 }
 if(m.timelineSpeed!==undefined&&(typeof m.timelineSpeed!=="number"||m.timelineSpeed<0.25||m.timelineSpeed>3||!Number.isFinite(m.timelineSpeed)))return false;
 return true;
}
