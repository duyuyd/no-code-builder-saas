"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type BillingState={ok:boolean;message:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function failure(e:unknown):BillingState{return {ok:false,message:e instanceof Error?e.message:"Không xử lý được yêu cầu."};}
async function signedIn(){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw new Error("Hãy đăng nhập trước.");
 return {db,user};
}
async function admin(){
 const {db,user}=await signedIn();
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).single();
 if(profile?.role!=="admin")throw new Error("Chỉ Admin được thay đổi ngân hàng và duyệt đơn.");
 return {db,user};
}
export async function saveManualBilling(_previous:BillingState,form:FormData):Promise<BillingState>{
 try{
  const {db}=await admin();
  const bankCode=String(form.get("bankCode")??"").trim().toUpperCase();
  const accountNumber=String(form.get("accountNumber")??"").trim();
  const accountName=String(form.get("accountName")??"").trim();
  const notice=String(form.get("notice")??"").trim();
  const enabled=form.get("enabled")==="on";
  const pro=Number(form.get("proVnd")??0),agency=Number(form.get("agencyVnd")??0);
  if(!Number.isSafeInteger(pro)||!Number.isSafeInteger(agency)||pro<0||agency<0||pro>100_000_000||agency>100_000_000||
    notice.length>400)return {ok:false,message:"Giá hoặc thông báo không hợp lệ."};
  if(enabled&&(!/^[A-Z0-9]{2,20}$/.test(bankCode)||!/^[0-9]{6,22}$/.test(accountNumber)||accountName.length<3||accountName.length>100||
    pro<1000||agency<1000))return {ok:false,message:"Cần nhập mã ngân hàng, số tài khoản, người nhận và giá của cả hai gói (từ 1.000 ₫) trước khi bật nhận đơn."};
  const {data:pricing,error:prError}=await db.from("platform_settings").select("value").eq("key","saas_pricing").single();
  if(prError||!Array.isArray(pricing?.value))throw new Error(prError?.message??"Thiếu cấu hình gói.");
  const plans=pricing.value.map(p=>p&&typeof p==="object"&&p.code==="pro"?{...p,priceVnd:pro,priceLabel:pro?pro.toLocaleString("vi-VN")+" ₫ / lần cấp gói":"Chưa mở bán"}:
    p&&typeof p==="object"&&p.code==="agency"?{...p,priceVnd:agency,priceLabel:agency?agency.toLocaleString("vi-VN")+" ₫ / lần cấp gói":"Chưa mở bán"}:p);
  const config={enabled,bankCode,accountNumber,accountName,notice};
  const {error:configErr}=await db.from("platform_settings").upsert({key:"saas_billing",value:config},{onConflict:"key"});
  if(configErr)throw new Error(configErr.message);
  const {error:priceErr}=await db.from("platform_settings").update({value:plans}).eq("key","saas_pricing");
  if(priceErr)throw new Error(priceErr.message);
  revalidatePath("/admin/billing");revalidatePath("/pricing");revalidatePath("/checkout");
  return {ok:true,message:enabled?"Đã bật nhận đơn chuyển khoản thủ công. Bạn cần tự đối chiếu giao dịch trước khi cấp quyền.":"Đã lưu. Nhận đơn thanh toán vẫn đang tắt."};
 }catch(e){return failure(e);}
}
export async function createManualOrder(_previous:BillingState,form:FormData):Promise<BillingState>{
 try{
  const plan=String(form.get("plan")??"");
  if(!["pro","agency"].includes(plan))return {ok:false,message:"Gói không hợp lệ."};
  const {db}=await signedIn();
  const {error}=await db.rpc("create_manual_billing_order",{p_plan:plan});
  if(error)throw new Error(error.message);
  revalidatePath("/checkout");
  revalidatePath("/admin/billing");
  return {ok:true,message:"Đã tạo mã chuyển khoản riêng. Hãy chuyển đúng số tiền và nội dung được hiển thị bên dưới."};
 }catch(e){return failure(e);}
}
export async function markManualOrderSent(_previous:BillingState,form:FormData):Promise<BillingState>{
 try{
  const id=String(form.get("order_id")??"");
  if(!uuid.test(id))return {ok:false,message:"Mã đơn hàng không hợp lệ."};
  const {db}=await signedIn();
  const {error}=await db.rpc("mark_manual_transfer_sent",{p_order_id:id});
  if(error)throw new Error(error.message);
  revalidatePath("/checkout");revalidatePath("/admin/billing");
  return {ok:true,message:"Đã gửi thông báo cho Admin. Đây chưa phải xác nhận đã nhận tiền; Admin phải kiểm tra sao kê."};
 }catch(e){return failure(e);}
}
export async function cancelManualOrder(_previous:BillingState,form:FormData):Promise<BillingState>{
 try{
  const id=String(form.get("order_id")??"");
  if(!uuid.test(id))return {ok:false,message:"Mã đơn hàng không hợp lệ."};
  const {db}=await signedIn();
  const {error}=await db.rpc("cancel_manual_billing_order",{p_order_id:id});
  if(error)throw new Error(error.message);
  revalidatePath("/checkout");revalidatePath("/admin/billing");
  return {ok:true,message:"Đã hủy đơn chưa chuyển khoản."};
 }catch(e){return failure(e);}
}
export async function reviewManualOrder(_previous:BillingState,form:FormData):Promise<BillingState>{
 try{
  const id=String(form.get("order_id")??""),decision=String(form.get("decision")??""),note=String(form.get("note")??"").trim();
  if(!uuid.test(id)||!["paid","rejected"].includes(decision)||note.length>500)return {ok:false,message:"Yêu cầu không hợp lệ."};
  if(decision==="paid"&&note.length<5)return {ok:false,message:"Hãy ghi mã giao dịch hoặc thông tin đối soát ngân hàng (ít nhất 5 ký tự) trước khi xác nhận tiền đã nhận."};
  const {db}=await admin();
  const {error}=await db.rpc("admin_review_manual_order",{p_order_id:id,p_paid:decision==="paid",p_note:note});
  if(error)throw new Error(error.message);
  revalidatePath("/admin/billing");revalidatePath("/checkout");revalidatePath("/admin");
  return {ok:true,message:decision==="paid"?"Đã ghi nhận đối soát thủ công và cấp gói. Không có webhook ngân hàng tự động.":"Đã từ chối đơn và lưu nhật ký."};
 }catch(e){return failure(e);}
}
