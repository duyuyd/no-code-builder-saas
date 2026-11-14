export type CharacterModel={
 skin:string;outfit:string;hair:string;pants:string;
 headSize:number;bodyWidth:number;armLength:number;legLength:number;
 eyeStyle:"round"|"square";
};
const HEX=/^#[0-9a-fA-F]{6}$/;
export function isCharacterModel(value:unknown):value is CharacterModel{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const m=value as Record<string,unknown>;
 if(Object.keys(m).length!==9)return false;
 if(!(["skin","outfit","hair","pants"] as const).every(key=>typeof m[key]==="string"&&HEX.test(m[key] as string)))return false;
 if(!(["headSize","bodyWidth","armLength","legLength"] as const).every(key=>typeof m[key]==="number"&&Number.isFinite(m[key])&&Number(m[key])>=0.55&&Number(m[key])<=1.65))return false;
 return m.eyeStyle==="round"||m.eyeStyle==="square";
}
