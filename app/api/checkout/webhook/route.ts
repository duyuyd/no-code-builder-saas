import {NextRequest,NextResponse} from "next/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {verifyPayOsWebhook} from "@/lib/payments/payos";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const raw=await req.text();if(raw.length>30000)return new Response("Request too large",{status:413});
 let event:unknown;try{event=JSON.parse(raw);}catch{return new Response("Invalid JSON",{status:400});}
 if(!verifyPayOsWebhook(event))return new Response("Invalid PayOS signature",{status:401});
 const {data,code,success}=event;
 if(code!=="00"||success!==true)return NextResponse.json({ok:true});
 const admin=privilegedSupabase();
 const {data:order}=await admin.from("commerce_orders").select("id,amount_vnd,status").eq("provider_order_code",data.orderCode).maybeSingle();
 if(!order||Number(order.amount_vnd)!==data.amount)return new Response("Order mismatch",{status:422});
 if(order.status==="pending"){
  const {error}=await admin.from("commerce_orders").update({status:"paid"}).eq("id",order.id).eq("status","pending");
  if(error)return new Response("Status write failed",{status:503});
 }
 return NextResponse.json({ok:true});
}
