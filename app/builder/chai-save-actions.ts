"use server";
import {createClient} from "@/lib/supabase/server";
import {fromUnifiedChai} from "@/lib/unified-chai-bridge";
import {validateUiTree,type BuilderNode} from "@/lib/component-registry";
import {savePageTree,type SaveResult} from "@/app/builder/actions";
export type ChaiSaveResult=SaveResult;
export async function saveUnifiedChai(projectId:string,pageId:string,blocks:unknown,expectedVersion:number,baseTree:BuilderNode[]):Promise<ChaiSaveResult>{
 if(!/^[0-9a-f-]{36}$/i.test(projectId)||!/^[0-9a-f-]{36}$/i.test(pageId))
  return {ok:false,reason:"invalid",error:"Invalid project"};
 if(!validateUiTree(baseTree))return {ok:false,reason:"invalid",error:"Invalid base tree"};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return {ok:false,reason:"forbidden",error:"Sign in required"};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,reason:"forbidden",error:"This project is not owned by your account."};
  const {data:page}=await db.from("pages").select("id").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page)return {ok:false,reason:"forbidden",error:"Page unavailable"};
  return await savePageTree(pageId,fromUnifiedChai(blocks),expectedVersion,baseTree);
 }catch(e){return {ok:false,reason:"invalid",error:e instanceof Error?e.message:"Could not convert Chai blocks"};}
}
