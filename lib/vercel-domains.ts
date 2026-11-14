import "server-only";

type VercelChallenge={type?:string;domain?:string;value?:string};
export type VercelDomain={name:string;verified:boolean;verification?:VercelChallenge[];configured?:boolean;misconfigured?:boolean};
function options(){
 const token=process.env.VERCEL_TOKEN;
 const projectId=process.env.VERCEL_PROJECT_ID;
 const teamId=process.env.VERCEL_TEAM_ID;
 if(!token || !projectId || !teamId)throw new Error("Cần cấu hình VERCEL_TOKEN, VERCEL_PROJECT_ID và VERCEL_TEAM_ID trên Vercel.");
 return {token,projectId,teamId};
}
export function normalizeDomain(input:string):string {
 const name=input.trim().toLowerCase().replace(/\.$/,"");
 if(name.length>253||name.length<4||name.includes("..")||!name.includes(".")||
    !name.split(".").every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part)) ||
    !/[a-z]/.test(name.split(".").at(-1)??"") ||
    name==="localhost"||name.endsWith(".localhost")||name.endsWith(".vercel.app")||
    name.endsWith(".supabase.co")||name.endsWith(".local")||name.endsWith(".internal"))
   throw new Error("Tên miền không hợp lệ. Hãy dùng domain bạn sở hữu, ví dụ shop.example.com.");
 return name;
}
async function vercel<T>(path:string,method:"GET"|"POST",body?:unknown):Promise<T> {
 const {token,teamId}=options();
 const query=(path.includes("?")?"&":"?")+"teamId="+encodeURIComponent(teamId);
 const res=await fetch("https://api.vercel.com"+path+query,{
   method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
   body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",
   signal:AbortSignal.timeout(12000)
 });
 const data:unknown=await res.json().catch(()=>({}));
 if(!res.ok){
   const r=data as {error?:{message?:string}};
   throw new Error("Vercel ("+res.status+"): "+(r?.error?.message?.slice(0,250)||"Không thể xử lý tên miền."));
 }
 return data as T;
}
function ref(){return encodeURIComponent(options().projectId);}
export async function addVercelProjectDomain(domain:string):Promise<VercelDomain>{
 const name=normalizeDomain(domain);
 return vercel<VercelDomain>("/v10/projects/"+ref()+"/domains","POST",{name});
}
export async function inspectVercelProjectDomain(domain:string):Promise<VercelDomain>{
 const name=normalizeDomain(domain);
 const project=await vercel<VercelDomain>("/v9/projects/"+ref()+"/domains/"+encodeURIComponent(name),"GET");
 let config:{misconfigured?:boolean}|null=null;
 try{config=await vercel<{misconfigured?:boolean}>("/v6/domains/"+encodeURIComponent(name)+"/config","GET");}catch{ /* Project verification response is still authoritative for ownership. */ }
 return {...project,misconfigured:config?.misconfigured};
}
export async function verifyVercelProjectDomain(domain:string):Promise<VercelDomain>{
 const name=normalizeDomain(domain);
 // Vercel's project-domain verify endpoint is documented at v9; add-domain is v10.
 await vercel<unknown>("/v9/projects/"+ref()+"/domains/"+encodeURIComponent(name)+"/verify","POST");
 return inspectVercelProjectDomain(name);
}
