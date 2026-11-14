export type GameObjectKind="coin"|"wall"|"goal"|"enemy";
export type GameObject={id:string;kind:GameObjectKind;x:number;y:number;w:number;h:number;label:string;imageUrl?:string;hp?:number};
export type GameScene={title:string;mode?:"collection"|"combat"|"moba";mobaCode?:string;background:string;backgroundImageUrl?:string;player:{x:number;y:number;emoji:string;speed:number;imageUrl?:string};objects:GameObject[]};
const allowedKinds=new Set<GameObjectKind>(["coin","wall","goal","enemy"]);
const validCoord=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;
function validAssetUrl(value:unknown):boolean{
 if(value===undefined||value==="")return true;
 if(typeof value!=="string"||value.length>2048)return false;
 try{
  const uri=new URL(value);
  return uri.protocol==="https:" && !uri.username && !uri.password && uri.hostname.length>0;
 }catch{return false;}
}
function gameObject(value:unknown):value is GameObject{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.id==="string"&&v.id.length>0&&v.id.length<=80&&/^[a-z0-9_-]+$/i.test(v.id) &&
 allowedKinds.has(v.kind as GameObjectKind)&&
 validCoord(v.x)&&validCoord(v.y)&&validCoord(v.w)&&validCoord(v.h)&&v.w>=2&&v.h>=2&&
 v.x+v.w<=100.001&&v.y+v.h<=100.001&&
 typeof v.label==="string"&&v.label.length<=16&&validAssetUrl(v.imageUrl)&&
 (v.hp===undefined||(Number.isInteger(v.hp)&&Number(v.hp)>=1&&Number(v.hp)<=10));
}
export function validateGameScene(value:unknown):value is GameScene{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const s=value as Record<string,unknown>;
 if((s.mode!==undefined&&s.mode!=="collection"&&s.mode!=="combat"&&s.mode!=="moba")||
 (s.mobaCode!==undefined&&(typeof s.mobaCode!=="string"||!/^[-a-z0-9]{3,80}$/.test(s.mobaCode)))||
 typeof s.title!=="string"||s.title.trim().length<3||s.title.length>120 ||
 typeof s.background!=="string"||!/^#[a-f0-9]{6}$/i.test(s.background) || !validAssetUrl(s.backgroundImageUrl) ||
 !s.player||typeof s.player!=="object"||Array.isArray(s.player) ||
 !Array.isArray(s.objects)||s.objects.length>80||s.objects.length<2)return false;
 const p=s.player as Record<string,unknown>;
 if(!validCoord(p.x)||!validCoord(p.y)||p.x>95||p.y>93||
 typeof p.emoji!=="string"||p.emoji.length>16||!validAssetUrl(p.imageUrl)||
 typeof p.speed!=="number"||p.speed<0.4||p.speed>5||!Number.isFinite(p.speed))return false;
 if(!s.objects.every(gameObject))return false;
 const ids=new Set((s.objects as GameObject[]).map(o=>o.id));
 if(ids.size!==s.objects.length)return false;
 const kinds=(s.objects as GameObject[]).map(o=>o.kind);
 if(s.mode==="moba")return typeof s.mobaCode==="string"&&/^[a-z0-9-]{3,80}$/.test(s.mobaCode)&&JSON.stringify(value).length<=36000;
 if(!kinds.includes("goal")||(s.mode==="combat"?!kinds.includes("enemy"):!kinds.includes("coin")))return false;
 return JSON.stringify(value).length<=36000;
}
export const gameSize={playerW:5,playerH:7} as const;
export function boxesOverlap(
 a:{x:number;y:number;w:number;h:number},
 b:{x:number;y:number;w:number;h:number}
):boolean{
 return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

export type GameSceneTemplate={code:string;name:string;genre:string;description:string;scene:GameScene};
