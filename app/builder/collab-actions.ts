"use server";
import {createClient} from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function inviteCollaborator(projectId:string,email:string):Promise<{ok:true}|{ok:false;error:string}>{
 if(!uuid.test(projectId)||typeof email!=="string"||email.trim().length<5||email.length>254)
  return {ok:false,error:"Invalid invitation data."};
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(auth||!user)return {ok:false,error:"Sign in to invite collaborators."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).maybeSingle();
  if(!project)return {ok:false,error:"Only the project owner can invite editors."};
  const {error}=await db.rpc("invite_project_collaborator",{p_project_id:projectId,p_email:email.trim()});
  return error?{ok:false,error:error.message}:{ok:true};
 }catch{return {ok:false,error:"Could not invite collaborator."};}
}
