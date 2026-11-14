"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
function getCredentials(formData:FormData){
 const email=String(formData.get("email")??"").trim();
 const password=String(formData.get("password")??"");
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||password.length<8||password.length>128)redirect("/login?error=invalid");
 return {email,password};
}
export async function signIn(formData:FormData){
 const db=await createClient();
 const {error}=await db.auth.signInWithPassword(getCredentials(formData));
 if(error)redirect("/login?error=signin");
 redirect("/dashboard");
}
export async function signUp(formData:FormData){
 const db=await createClient();
 const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
 if(!siteUrl||!/^https?:\/\//.test(siteUrl))redirect("/login?mode=register&error=config");
 const {data,error}=await db.auth.signUp({
  ...getCredentials(formData),options:{emailRedirectTo:siteUrl.replace(/\/$/,"")+"/auth/callback"}
 });
 if(error)redirect("/login?mode=register&error=signup");
 if(data.session)redirect("/dashboard");
 redirect("/login?message=confirm");
}
export async function signOut(){
 const db=await createClient();await db.auth.signOut();redirect("/login");
}
