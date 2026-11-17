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
 const credentials=getCredentials(formData);
 let errorType:"signin"|"network"|"config"|null=null;
 try{
  const db=await createClient();
  const {error}=await db.auth.signInWithPassword(credentials);
  if(error)errorType=error.name==="AuthRetryableFetchError"?"network":"signin";
 }catch(error){
  errorType=error instanceof Error&&error.message.includes("NEXT_PUBLIC_SUPABASE")?"config":"network";
 }
 if(errorType)redirect("/login?error="+errorType);
 redirect("/dashboard");
}
export async function signUp(formData:FormData){
 const credentials=getCredentials(formData);
 const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
 if(!siteUrl||!/^https?:\/\//.test(siteUrl))redirect("/login?mode=register&error=config");
 let result:"confirm"|"ok"|"network"|"signup"="network";
 try{
  const db=await createClient();
  const {data,error}=await db.auth.signUp({
   ...credentials,options:{emailRedirectTo:siteUrl.replace(/\/$/,"")+"/auth/callback"}
  });
  result=error?(error.name==="AuthRetryableFetchError"?"network":"signup"):(data.session?"ok":"confirm");
 }catch{result="network";}
 if(result==="ok")redirect("/dashboard");
 if(result==="confirm")redirect("/login?message=confirm");
 redirect("/login?mode=register&error="+result);
}
export async function signOut(){
 try{const db=await createClient();await db.auth.signOut();}catch{redirect("/login?error=network");}
 redirect("/login");
}
