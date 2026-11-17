import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
export type PaymentLink={checkoutUrl:string;paymentLinkId:string;orderCode:number;amount:number};
function credentials(){
 const clientId=process.env.PAYOS_CLIENT_ID,apiKey=process.env.PAYOS_API_KEY,checksum=process.env.PAYOS_CHECKSUM_KEY;
 if(!clientId||!apiKey||!checksum)throw new Error("PayOS has not been enabled by the owner.");
 return {clientId,apiKey,checksum};
}
export function signPayOsObject(obj:Record<string,unknown>,checksum:string){
 const input=Object.keys(obj).sort().map(k=>k+"="+(obj[k]??"")).join("&");
 return createHmac("sha256",checksum).update(input).digest("hex");
}
export function verifyPayOsWebhook(payload:unknown):payload is {code:string;success:boolean;data:{orderCode:number;amount:number};signature:string}{
 if(!payload||typeof payload!=="object")return false;
 const v=payload as Record<string,unknown>,data=v.data;
 if(!data||typeof data!=="object"||!v.signature||typeof v.signature!=="string")return false;
 const check=process.env.PAYOS_CHECKSUM_KEY;
 if(!check)return false;
 const expected=signPayOsObject(data as Record<string,unknown>,check);
 const signature=v.signature.toLowerCase();
 return /^[a-f0-9]{64}$/.test(signature)&&timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(signature,"hex"))&&typeof (data as {orderCode?:unknown}).orderCode==="number";
}
export async function createPayOsLink(orderCode:number,amount:number,description:string,baseUrl:string):Promise<PaymentLink>{
 const {clientId,apiKey,checksum}=credentials();
 if(!Number.isSafeInteger(orderCode)||!Number.isSafeInteger(amount)||amount<1000||amount>2000000000)throw new Error("Invalid payment amount.");
 const host=new URL(baseUrl);
 if(host.protocol!=="https:")throw new Error("Payment return URL must be HTTPS.");
 const body={orderCode,amount,description:description.slice(0,25),cancelUrl:new URL("/payment-status?cancelled=1",host).href,
  returnUrl:new URL("/payment-status?orderCode="+orderCode,host).href};
 const signature=signPayOsObject(body,checksum);
 const response=await fetch("https://api-merchant.payos.vn/v2/payment-requests",{
  method:"POST",headers:{"x-client-id":clientId,"x-api-key":apiKey,"content-type":"application/json"},
  body:JSON.stringify({...body,signature}),signal:AbortSignal.timeout(12000),cache:"no-store"});
 const payload=await response.json().catch(()=>null) as {code?:string;desc?:string;data?:{checkoutUrl?:string;paymentLinkId?:string;orderCode?:number;amount?:number}}|null;
 if(!response.ok||payload?.code!=="00"||!payload.data?.checkoutUrl||!/^https:\/\/pay\.payos\.vn\//.test(payload.data.checkoutUrl))
  throw new Error("PayOS checkout unavailable (HTTP "+response.status+").");
 return {checkoutUrl:payload.data.checkoutUrl,paymentLinkId:String(payload.data.paymentLinkId??""),orderCode,amount};
}
