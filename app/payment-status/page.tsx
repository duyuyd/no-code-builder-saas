import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function PaymentStatus({searchParams}:{searchParams:Promise<{orderCode?:string;cancelled?:string}>}){
 const query=await searchParams;const db=await createClient(),{data:{user}}=await db.auth.getUser();let status="Not found";
 if(user&&query.orderCode&&/^\d{1,15}$/.test(query.orderCode)){
  const {data}=await db.from("commerce_orders").select("status").eq("provider_order_code",Number(query.orderCode)).eq("buyer_id",user.id).maybeSingle();
  status=data?.status??status;
 }
 return <main className="min-h-dvh bg-slate-950 p-7 text-white"><div className="mx-auto max-w-xl"><h1 className="mb-5 text-3xl font-bold">Payment status</h1><p role="status" className="mb-5">Status: {query.cancelled?"Cancelled by buyer":status}. Payment is confirmed only after the signed PayOS webhook is verified.</p><Link href="/dashboard" className="text-orange-300">Back to dashboard</Link></div></main>;
}
