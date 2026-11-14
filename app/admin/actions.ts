"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type AdminActionState={ok:boolean;message:string};

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function error(e:unknown):AdminActionState{return {ok:false,message:e instanceof Error?e.message:"Có lỗi không xác định."};}
async function requireAdmin(){
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error("Cần đăng nhập.");
 const {data:profile,error:profileError}=await db.from("profiles").select("role").eq("id",user.id).single();
 if(profileError||profile?.role!=="admin")throw new Error("Chỉ quản trị viên mới có quyền thực hiện.");
 return {db,user};
}

export async function changeUserPlan(_previous:AdminActionState,form:FormData):Promise<AdminActionState>{
 try{
  const target=String(form.get("user_id")??"");
  const plan=String(form.get("plan")??"");
  if(!uuid.test(target)||!["free","pro","agency"].includes(plan))return {ok:false,message:"Tài khoản hoặc gói không hợp lệ."};
  const {db}=await requireAdmin();
  const {error:dbError}=await db.rpc("admin_change_user_plan",{p_user_id:target,p_new_plan:plan});
  if(dbError)throw new Error(dbError.message);
  revalidatePath("/admin");
  return {ok:true,message:"Đã cập nhật gói. Đây là quyền sử dụng được cấp thủ công, không ghi nhận thanh toán."};
 }catch(e){return error(e);}
}

type Plan={code:string;name:string;priceLabel:string;description:string;features:string[];available:boolean;visible?:boolean};
function validPlan(v:unknown):v is Plan{
 if(!v||typeof v!=="object")return false;
 const p=v as Partial<Plan>;
 return typeof p.code==="string"&&typeof p.name==="string"&&typeof p.priceLabel==="string"&&
 typeof p.description==="string"&&typeof p.available==="boolean"&&Array.isArray(p.features)&&
 p.features.every(f=>typeof f==="string")&&(p.visible===undefined||typeof p.visible==="boolean");
}
export async function updatePricingPlan(_previous:AdminActionState,form:FormData):Promise<AdminActionState>{
 try{
  const code=String(form.get("code")??"");
  const name=String(form.get("name")??"").trim();
  const priceLabel=String(form.get("priceLabel")??"").trim();
  const description=String(form.get("description")??"").trim();
  const features=String(form.get("features")??"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const visible=form.get("visible")==="on";
  if(!["free","pro","agency"].includes(code)||name.length<2||name.length>50||
   priceLabel.length<1||priceLabel.length>80||description.length<5||description.length>500||
   features.length<1||features.length>15||features.some(f=>f.length>180))
    return {ok:false,message:"Tên gói, mô tả, giá hiển thị hoặc quyền lợi không hợp lệ."};
  const {db}=await requireAdmin();
  const {data, error:loadError}=await db.from("platform_settings").select("value").eq("key","saas_pricing").single();
  if(loadError)throw new Error(loadError.message);
  if(!Array.isArray(data.value)||!data.value.every(validPlan))throw new Error("Cấu hình gói hiện tại không hợp lệ.");
  if(!data.value.some(p=>p.code===code))throw new Error("Không tìm thấy gói.");
  const revised=data.value.map((p:Plan)=>p.code===code?
      {...p,name,priceLabel,description,features,visible,available:p.code==="free"&&p.available===true}
     :p);
  const {error:writeError}=await db.from("platform_settings").update({value:revised}).eq("key","saas_pricing");
  if(writeError)throw new Error(writeError.message);
  revalidatePath("/admin");
  revalidatePath("/pricing");
  return {ok:true,message:"Đã lưu bảng giá công khai. Chưa kích hoạt thu tiền hoặc cấp gói tự động."};
 }catch(e){return error(e);}
}

export async function changeProjectLifecycle(_previous:AdminActionState,form:FormData):Promise<AdminActionState>{
 try{
  const id=String(form.get("project_id")??"");
  const operation=String(form.get("operation")??"");
  const confirmation=String(form.get("confirmation")??"");
  if(!uuid.test(id)||!["archive","restore","delete"].includes(operation))return {ok:false,message:"Yêu cầu không hợp lệ."};
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)throw new Error("Cần đăng nhập.");
  // Final ownership/admin checks, confirmation, audit and unpublish are performed atomically inside PostgreSQL RPC.
  const {error:dbError}=await db.rpc("manage_project_lifecycle",{
    p_project_id:id,p_operation:operation,p_confirmation:operation==="delete"?confirmation:null
  });
  if(dbError)throw new Error(dbError.message);
  revalidatePath("/admin");revalidatePath("/projects");revalidatePath("/builder");
  return {ok:true,message:operation==="archive"?"Đã chuyển dự án vào Thùng rác và ngừng công khai.":operation==="restore"?"Đã khôi phục dự án. Muốn công khai lại cần xuất bản.":"Đã xóa vĩnh viễn dự án và các trang liên quan."};
 }catch(e){return error(e);}
}
