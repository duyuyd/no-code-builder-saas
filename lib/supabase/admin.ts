import "server-only";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";

export function privilegedSupabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.");
 return createSupabaseClient(url,key,{
  auth:{autoRefreshToken:false,persistSession:false}
 });
}
