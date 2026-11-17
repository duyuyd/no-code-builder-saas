"use server";
import {createClient} from "@/lib/supabase/server";
export async function setPluginEnabled(id:string,enabled:boolean):Promise<{ok:boolean;error?:string}>{
 if(!/^[a-f0-9-]{36}$/i.test(id)||typeof enabled!=="boolean")return {ok:false,error:"Invalid plugin ID"};
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in required"};
 const {error}=await db.from("studio_plugins").update({enabled}).eq("id",id).eq("owner_id",user.id);
 return error?{ok:false,error:error.message}:{ok:true};
}
