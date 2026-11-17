"use server";
import {createClient} from "@/lib/supabase/server";
import {validateUiTree} from "@/lib/component-registry";
import {treeToChaiBlocks,type ChaiBlockData} from "@/lib/chaibuilder-adapter";
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export type ExportResult={ok:true;blocks:ChaiBlockData[]}|{ok:false;error:string};
export async function exportChaiBlocks(projectId:string,pageId:string):Promise<ExportResult>{
 if(!uuid.test(projectId)||!uuid.test(pageId))return {ok:false,error:"Invalid page or project."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return {ok:false,error:"Please sign in."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"You must own this project."};
  const {data:page}=await db.from("pages").select("ui_tree").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page||!validateUiTree(page.ui_tree))return {ok:false,error:"Invalid page content."};
  return {ok:true,blocks:treeToChaiBlocks(page.ui_tree)};
 }catch(e){return {ok:false,error:e instanceof Error?e.message:"Cannot export page."};}
}
