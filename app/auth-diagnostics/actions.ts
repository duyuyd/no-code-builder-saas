"use server";
import {createClient} from "@/lib/supabase/server";
export type AuthProbe={ok:boolean;auth:boolean;write:boolean;read:boolean;cleanup:boolean;message:string};
export async function runAuthRoundTrip():Promise<AuthProbe>{
 const result:AuthProbe={ok:false,auth:false,write:false,read:false,cleanup:false,message:""};
 try{
  const db=await createClient();const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)return {...result,message:"Chưa đăng nhập hoặc phiên hết hạn."};
  result.auth=true;
  const nonce=crypto.randomUUID();
  const {data:written,error:writeError}=await db.from("studio_auth_checks").insert({owner_id:user.id,nonce}).select("id").single();
  if(writeError||!written)return {...result,message:"WRITE: "+(writeError?.message??"failed")};
  result.write=true;
  const {data:loaded,error:readError}=await db.from("studio_auth_checks").select("nonce").eq("id",written.id).eq("owner_id",user.id).single();
  result.read=!readError&&loaded?.nonce===nonce;
  const {error:deleteError}=await db.from("studio_auth_checks").delete().eq("id",written.id).eq("owner_id",user.id);
  result.cleanup=!deleteError;
  result.ok=result.auth&&result.write&&result.read&&result.cleanup;
  result.message=result.ok?"Đăng nhập, ghi, đọc và dọn dẹp dữ liệu thành công.":"Một bước xác minh thất bại; kiểm tra Supabase RLS và mạng.";
  if(result.ok)console.info("STUDIO_AUTH_ROUNDTRIP_OK",JSON.stringify({auth:true,write:true,read:true,cleanup:true}));
  return result;
 }catch{return {...result,message:"Không kết nối được Supabase, chưa chứng minh auth hoạt động."};}
}
