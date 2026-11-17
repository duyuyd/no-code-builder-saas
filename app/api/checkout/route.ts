import {randomInt} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {createPayOsLink} from "@/lib/payments/payos";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:"Invalid JSON."},{status:400});}
 const data=body as {productId?:unknown;itemId?:unknown;quantity?:unknown}|null,productId=data?.productId,quantity=data?.quantity??1;
 if((typeof productId!=="string"||!/^[a-f0-9-]{36}$/i.test(productId)) && (typeof data?.itemId!=="string"||!/^[a-f0-9-]{36}$/i.test(data.itemId)) || !Number.isInteger(quantity)||Number(quantity)<1||Number(quantity)>30)
  return NextResponse.json({error:"Invalid product or quantity."},{status:400});
 if(typeof data?.itemId==="string"&&process.env.MARKETPLACE_SETTLEMENTS_ENABLED!=="true")
  return NextResponse.json({error:"Paid marketplace sales are disabled until the owner configures creator settlement and explicitly approves payments."},{status:503});
 if(typeof data?.productId==="string"&&process.env.COMMERCE_PAYMENTS_ENABLED!=="true")
  return NextResponse.json({error:"Store payments require explicit merchant approval and settlement setup."},{status:503});
 if(!process.env.PAYOS_CLIENT_ID||!process.env.PAYOS_API_KEY||!process.env.PAYOS_CHECKSUM_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)
  return NextResponse.json({error:"Checkout is not enabled. Merchant configuration is required."},{status:503});
 try{
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to continue."},{status:401});
  if(typeof data?.itemId==="string"&&/^[a-f0-9-]{36}$/i.test(data.itemId)){
   const {data:item}=await db.from("marketplace_items").select("id,project_id,title,creator_id,price_vnd,status")
     .eq("id",data.itemId).eq("status","published").maybeSingle();
   if(!item||!item.project_id||item.creator_id===user.id||Number(item.price_vnd)<1000)
    return NextResponse.json({error:"Paid listing unavailable."},{status:404});
   const {data:live}=await db.from("published_pages").select("project_id").eq("project_id",item.project_id).eq("is_live",true).limit(1).maybeSingle();
   if(!live)return NextResponse.json({error:"Creator delivery source not published."},{status:403});
   const admin=privilegedSupabase();let orderCode=0;let order:null|{id:string}=null;
   for(let attempt=0;attempt<3&&!order;attempt++){
    orderCode=randomInt(2000000000,2147483647);
    const {data:created,error}=await admin.from("marketplace_orders").insert({
      item_id:item.id,buyer_id:user.id,amount_vnd:Number(item.price_vnd),provider_order_code:orderCode,status:"pending"
    }).select("id").single();
    if(!error)order=created;else if(error.code!=="23505")return NextResponse.json({error:"Cannot create marketplace order."},{status:500});
   }
   if(!order)return NextResponse.json({error:"Order collision."},{status:503});
   try{
    const payment=await createPayOsLink(orderCode,Number(item.price_vnd),"Template "+orderCode,new URL(req.url).origin);
    return NextResponse.json({checkoutUrl:payment.checkoutUrl,orderId:order.id},{headers:{"cache-control":"no-store"}});
   }catch(e){
    await admin.from("marketplace_orders").update({status:"cancelled"}).eq("id",order.id).eq("status","pending");
    return NextResponse.json({error:e instanceof Error?e.message:"PayOS unavailable."},{status:502});
   }
  }
 const {data:product}=await db.from("products").select("id,project_id,name,price_vnd,active").eq("id",productId).eq("active",true).maybeSingle();
  if(!product)return NextResponse.json({error:"Product unavailable."},{status:404});
  const {data:live}=await db.from("published_pages").select("project_id").eq("project_id",product.project_id).eq("is_live",true).limit(1).maybeSingle();
  if(!live)return NextResponse.json({error:"Shop is not published."},{status:403});
  const amount=Number(product.price_vnd)*Number(quantity);
  if(!Number.isSafeInteger(amount)||amount>2000000000)return NextResponse.json({error:"Order exceeds amount limit."},{status:400});
  const admin=privilegedSupabase();let order:null|{id:string}=null;let orderCode=0;
  for(let attempt=0;attempt<3&&!order;attempt++){
   orderCode=randomInt(100000000,2000000000);
   const {data:created,error}=await admin.from("commerce_orders").insert({
    buyer_id:user.id,project_id:product.project_id,product_id:product.id,quantity,amount_vnd:amount,
    provider_order_code:orderCode,status:"pending",provider:"payos"}).select("id").single();
   if(!error)order=created;
   else if(error.code!=="23505")return NextResponse.json({error:"Could not record order."},{status:500});
  }
  if(!order)return NextResponse.json({error:"Order code collision, retry."},{status:503});
  try{
   const payment=await createPayOsLink(orderCode,amount,("Nuvora "+orderCode).slice(0,25),new URL(req.url).origin);
   await admin.from("commerce_orders").update({provider_link_id:payment.paymentLinkId}).eq("id",order.id).eq("status","pending");
   return NextResponse.json({checkoutUrl:payment.checkoutUrl,orderId:order.id},{headers:{"cache-control":"no-store"}});
  }catch(e){
   await admin.from("commerce_orders").update({status:"cancelled"}).eq("id",order.id).eq("status","pending");
   return NextResponse.json({error:e instanceof Error?e.message:"PayOS unavailable."},{status:502});
  }
 }catch{return NextResponse.json({error:"Checkout service unavailable."},{status:503});}
}
