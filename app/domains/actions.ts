"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {addVercelProjectDomain,inspectVercelProjectDomain,normalizeDomain,verifyVercelProjectDomain,type VercelDomain} from "@/lib/vercel-domains";
export type TenantActionState={ok:boolean;message:string;checks?:Array<{type:string;domain:string;value:string}>;domain?:string;verified?:boolean};
async function current(){
 const db=await createClient();
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw new Error("Vui lòng đăng nhập để quản lý tên miền.");
 const {data:profile}=await db.from("profiles").select("role,plan").eq("id",user.id).single();
 return {db,user,profile};
}
function errorState(error:unknown):TenantActionState {return {ok:false,message:error instanceof Error?error.message:"Không thể thực hiện."};}
function checks(d:VercelDomain){return (d.verification??[]).filter(x=>x.type&&x.domain&&x.value).map(x=>({type:x.type!,domain:x.domain!,value:x.value!}));}
function licensed(p:{role?:string|null;plan?:string|null}|null){return p?.role==="admin"||p?.plan==="pro"||p?.plan==="agency";}
export async function saveTenantBranding(_prev:TenantActionState,form:FormData):Promise<TenantActionState>{
 try{
 const {db,user}=await current();
 const name=String(form.get("name")??"").trim();
 const color=String(form.get("primary_color")??"");
 const logo=String(form.get("logo_url")??"").trim();
 const projectId=String(form.get("project_id")??"");
 if(name.length<2||name.length>120)return {ok:false,message:"Tên thương hiệu phải từ 2 đến 120 ký tự."};
 if(!/^#[0-9a-f]{6}$/i.test(color))return {ok:false,message:"Màu chủ đạo không hợp lệ."};
 if(logo && (!/^https:\/\//.test(logo)||logo.length>600))return {ok:false,message:"Logo phải là địa chỉ HTTPS hợp lệ."};
 if(projectId && !/^[a-f0-9-]{36}$/i.test(projectId))return {ok:false,message:"Dự án không hợp lệ."};
 if(projectId){
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).maybeSingle();
  if(!project)return {ok:false,message:"Dự án không thuộc tài khoản của bạn."};
 }
 const branding={name,primary_color:color,logo_url:logo||null,project_id:projectId||null};
 const {data:old}=await db.from("tenants").select("id").eq("owner_id",user.id).maybeSingle();
 const {error}=old?await db.from("tenants").update(branding).eq("id",old.id).eq("owner_id",user.id):await db.from("tenants").insert({...branding,owner_id:user.id});
 if(error)throw new Error(error.message);
 revalidatePath("/domains");
 return {ok:true,message:"Đã lưu thương hiệu vào Supabase."};
 }catch(e){return errorState(e);}
}
export async function registerTenantDomain(_prev:TenantActionState,form:FormData):Promise<TenantActionState>{
 try{
 const {db,user,profile}=await current();
 if(!licensed(profile))return {ok:false,message:"Tên miền riêng dành cho gói Pro/Agency. Thanh toán chưa được kích hoạt; quản trị viên có thể thử nghiệm."};
 const domain=normalizeDomain(String(form.get("domain")??""));
 const {data:tenant}=await db.from("tenants").select("id,custom_domain").eq("owner_id",user.id).maybeSingle();
 if(!tenant)return {ok:false,message:"Vui lòng lưu thông tin thương hiệu trước."};
 if(tenant.custom_domain && tenant.custom_domain!==domain)return {ok:false,message:"Bạn đã gắn tên miền khác. Hãy xử lý việc thay tên miền trong quản trị trước khi thêm tên miền mới."};
 const privileged=privilegedSupabase();
 const {data:existing}=await privileged.from("tenants").select("owner_id").eq("custom_domain",domain).maybeSingle();
 if(existing&&existing.owner_id!==user.id)return {ok:false,message:"Tên miền đã được gắn với một tài khoản khác."};
 let result:VercelDomain;
 try{result=await addVercelProjectDomain(domain);}
 catch(err){
   // Vercel may already have assigned this hostname to the same project.
   result=await inspectVercelProjectDomain(domain).catch(()=>{throw err});
 }
 const verified=result.verified===true && result.misconfigured!==true;
 const {error}=await privileged.from("tenants").update({
    custom_domain:domain,domain_status:verified?"verified":"pending",
    domain_verification:checks(result)
 }).eq("id",tenant.id).eq("owner_id",user.id);
 if(error)throw new Error(error.message);
 revalidatePath("/domains");
 return {ok:true,message:verified?"Tên miền đã xác minh.":"Đã thêm tên miền. Cập nhật bản ghi DNS và nhấn Kiểm tra DNS.",domain,verified,checks:checks(result)};
 }catch(e){return errorState(e);}
}
export async function verifyTenantDomain(_prev:TenantActionState,_form:FormData):Promise<TenantActionState>{
 try{
 const {db,user,profile}=await current();
 if(!licensed(profile))return {ok:false,message:"Chỉ gói Pro/Agency được sử dụng tên miền riêng."};
 const {data:tenant}=await db.from("tenants").select("id,custom_domain").eq("owner_id",user.id).maybeSingle();
 if(!tenant?.custom_domain)return {ok:false,message:"Chưa có tên miền để kiểm tra."};
 const domain=normalizeDomain(tenant.custom_domain);
 let result:VercelDomain;
 try{result=await verifyVercelProjectDomain(domain);}
 catch{
   result=await inspectVercelProjectDomain(domain);
 }
 const verified=result.verified===true && result.misconfigured!==true;
 const {error}=await privilegedSupabase().from("tenants").update({
   domain_status:verified?"verified":"pending",domain_verification:checks(result)
 }).eq("id",tenant.id).eq("owner_id",user.id);
 if(error)throw new Error(error.message);
 revalidatePath("/domains");
 return {ok:true,domain,verified,checks:checks(result),message:verified?"Đã xác minh domain với Vercel; trang công khai có thể truy cập qua tên miền.":"DNS hoặc quyền sở hữu chưa được xác minh. Kiểm tra TXT/CNAME/A tại nhà cung cấp domain rồi bấm lại."};
 }catch(e){return errorState(e);}
}
