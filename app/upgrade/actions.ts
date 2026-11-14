"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type UpgradeActionState={ok:boolean;message:string};
const initialError=(e:unknown):UpgradeActionState=>({ok:false,message:e instanceof Error?e.message:"Không thể gửi yêu cầu."});
export async function requestUpgrade(_previous:UpgradeActionState,form:FormData):Promise<UpgradeActionState>{
 try{
  const plan=String(form.get("requested_plan")??"");
  const message=String(form.get("message")??"").trim();
  if(!["pro","agency"].includes(plan))return {ok:false,message:"Gói nâng cấp không hợp lệ."};
  if(message.length>1000)return {ok:false,message:"Nội dung không được quá 1000 ký tự."};
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(!user||authError)return {ok:false,message:"Bạn cần đăng nhập trước khi yêu cầu nâng cấp."};
  const {data:profile}=await db.from("profiles").select("role,plan").eq("id",user.id).single();
  if(profile?.role==="admin"||profile?.plan==="agency"||profile?.plan===plan||profile?.plan==="pro"&&plan==="pro")
   return {ok:false,message:"Tài khoản hiện đã có quyền sử dụng gói này."};
  const {error}=await db.from("upgrade_requests").insert({user_id:user.id,requested_plan:plan,message});
  if(error){
   if(error.code==="23505")return {ok:false,message:"Bạn đang có một yêu cầu chờ Admin xử lý. Không thể gửi trùng."};
   return {ok:false,message:error.message};
  }
  revalidatePath("/upgrade");revalidatePath("/admin/requests");
  return {ok:true,message:"Đã gửi yêu cầu. Admin sẽ thấy yêu cầu trong Trung tâm quản trị. Chưa có khoản thanh toán nào được thu."};
 }catch(e){return initialError(e);}
}
export async function decideUpgradeRequest(_previous:UpgradeActionState,form:FormData):Promise<UpgradeActionState>{
 try{
  const id=String(form.get("request_id")??"");
  const decision=String(form.get("decision")??"");
  const note=String(form.get("note")??"").trim();
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["approve","reject"].includes(decision)||note.length>500)
   return {ok:false,message:"Yêu cầu hoặc ghi chú không hợp lệ."};
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return {ok:false,message:"Cần đăng nhập."};
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return {ok:false,message:"Chỉ Admin được duyệt nâng cấp."};
  const {error}=await db.rpc("admin_decide_upgrade",{p_request_id:id,p_approve:decision==="approve",p_note:note});
  if(error)throw new Error(error.message);
  revalidatePath("/admin/requests");revalidatePath("/admin");revalidatePath("/upgrade");
  return {ok:true,message:decision==="approve"?"Đã cấp quyền sử dụng gói thủ công, không ghi nhận giao dịch.":"Đã từ chối và lưu nhật ký."};
 }catch(e){return initialError(e);}
}
