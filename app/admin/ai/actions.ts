"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {providerKey,validAiModel,type AiProvider,type AiConfig} from "@/lib/studio-ai";

export type AiAdminState={ok:boolean;message:string};
export async function saveStudioAiConfig(_prev:AiAdminState,form:FormData):Promise<AiAdminState>{
 try{
  const provider=String(form.get("provider")??"");
  const model=String(form.get("model")??"").trim();
  const enabled=form.get("enabled")==="on";
  const dailyUserLimit=Number(form.get("dailyUserLimit"));
  const dailyGlobalLimit=Number(form.get("dailyGlobalLimit"));
  const maxOutputTokens=Number(form.get("maxOutputTokens"));
  if(!["gemini","deepseek","openai"].includes(provider))throw new Error("Nhà cung cấp không hợp lệ.");
  if(!validAiModel(model))throw new Error("Tên model không hợp lệ (3–80 ký tự).");
  if(!Number.isInteger(dailyUserLimit)||dailyUserLimit<1||dailyUserLimit>20)throw new Error("Hạn mức mỗi người: 1–20 lượt/ngày.");
  if(!Number.isInteger(dailyGlobalLimit)||dailyGlobalLimit<1||dailyGlobalLimit>300)throw new Error("Hạn mức toàn nền tảng: 1–300 lượt/ngày.");
  if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<250||maxOutputTokens>1500)throw new Error("Giới hạn trả lời: 250–1.500 token.");
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)throw new Error("Phiên đăng nhập hết hạn.");
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")throw new Error("Chỉ quản trị viên được cấu hình AI.");
  if(enabled&&!providerKey(provider as AiProvider))throw new Error("Chưa có "+provider.toUpperCase()+"_API_KEY trong Vercel Production. Hãy thêm khóa và Redeploy trước khi bật.");
  const next:AiConfig={enabled,provider:provider as AiProvider,model,dailyUserLimit,dailyGlobalLimit,maxOutputTokens};
  const {data:updated,error}=await db.from("platform_settings").update({value:next}).eq("key","studio_ai_config").select("key").maybeSingle();
  if(error||!updated)throw new Error(error?.message??"Không lưu được cấu hình. Kiểm tra quyền Admin/RLS.");
  revalidatePath("/admin/ai");
  return {ok:true,message:enabled?"Đã bật "+provider+" cho Studio. API key chỉ lưu trong Vercel; lượt gọi được giới hạn.":"Đã lưu cấu hình. Các yêu cầu trả lời AI tính phí đang tắt."};
 }catch(error){return {ok:false,message:error instanceof Error?error.message:"Không lưu được cấu hình AI."};}
}
