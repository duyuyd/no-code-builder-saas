"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get("email")??"").trim();
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)redirect("/reset-password?error=invalid");
 const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
 if(!siteUrl||!/^https:\/\//.test(siteUrl))redirect("/reset-password?error=config");
 const db=await createClient();
 const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:siteUrl.replace(/\/$/,"")+"/auth/callback?next=%2Freset-password%3Fmode%3Dupdate"});
 if(error)redirect("/reset-password?error=send");
 redirect("/reset-password?message=sent");
}
export async function updatePassword(formData:FormData){
 const password=String(formData.get("password")??"");
 const confirm=String(formData.get("confirm")??"");
 if(password.length<8||password.length>128||password!==confirm)redirect("/reset-password?mode=update&error=mismatch");
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/reset-password?error=expired");
 const {error}=await db.auth.updateUser({password});
 if(error)redirect("/reset-password?mode=update&error=update");
 redirect("/dashboard?password=updated");
}
