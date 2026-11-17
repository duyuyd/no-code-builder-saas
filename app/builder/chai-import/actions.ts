"use server";
import {createClient} from "@/lib/supabase/server";
import {chaiBlocksToTree} from "@/lib/chaibuilder-adapter";
import {validateUiTree} from "@/lib/component-registry";
import {savePageTree} from "@/app/builder/actions";
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export type ImportResult={ok:true;count:number;warnings:string[]}|{ok:false;error:string};
export async function importChaiBlocks(projectId:string,pageId:string,json:string):Promise<ImportResult>{
 if(!uuid.test(projectId)||!uuid.test(pageId)||typeof json!=="string"||json.length>120000)
  return {ok:false,error:"Invalid import size or project ID."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return {ok:false,error:"Please log in."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"Project does not belong to you."};
  const {data:page}=await db.from("pages").select("id,version,ui_tree").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page||!validateUiTree(page.ui_tree))return {ok:false,error:"Page unavailable."};
  const raw=JSON.parse(json) as unknown;
  const blocks=Array.isArray(raw)?raw:(raw&&typeof raw==="object"&&"blocks" in raw?(raw as {blocks:unknown}).blocks:null);
  const {tree,warning}=chaiBlocksToTree(blocks);
  if(!tree.length)return {ok:false,error:"No Chai blocks to import."};
  const combined=[...page.ui_tree,...tree];
  if(!validateUiTree(combined))return {ok:false,error:"Combined UI tree exceeds NuvoraCraft's limits."};
  const result=await savePageTree(pageId,combined,page.version,page.ui_tree);
  if(!result.ok)return {ok:false,error:result.error};
  return {ok:true,count:tree.length,warnings:warning};
 }catch(e){return {ok:false,error:e instanceof Error?e.message:"Import failed."};}
}
