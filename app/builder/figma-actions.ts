"use server";
import {createClient} from "@/lib/supabase/server";
import {extractFigmaFileLink,figmaToUiTree} from "@/lib/figma-import";
import {validateUiTree} from "@/lib/component-registry";
import {savePageTree} from "@/app/builder/actions";
export type FigmaImportResult={ok:true;count:number}|{ok:false;error:string};
export async function importFigmaToPage(projectId:string,pageId:string,link:string):Promise<FigmaImportResult>{
 if(!/^[a-f0-9-]{36}$/i.test(projectId)||!/^[a-f0-9-]{36}$/i.test(pageId))return {ok:false,error:"Invalid project/page"};
 let file:{fileKey:string;nodeId?:string};
 try{file=extractFigmaFileLink(link);}catch(e){return {ok:false,error:e instanceof Error?e.message:"Invalid Figma link"};}
 const token=process.env.FIGMA_ACCESS_TOKEN;
 if(!token)return {ok:false,error:"Figma importer is not configured. Admin must configure a read-only Figma API token."};
 try{
  const db=await createClient();const {data:{user},error:auth}=await db.auth.getUser();
  if(auth||!user)return {ok:false,error:"Sign in before importing."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"You do not own this project."};
  const {data:page}=await db.from("pages").select("id,version,ui_tree").eq("id",pageId).eq("project_id",projectId).maybeSingle();
  if(!page||!validateUiTree(page.ui_tree))return {ok:false,error:"Project page is missing or invalid."};
  const endpoint=new URL("https://api.figma.com/v1/files/"+file.fileKey+(file.nodeId?"/nodes":""));
  if(file.nodeId)endpoint.searchParams.set("ids",file.nodeId);else endpoint.searchParams.set("depth","6");
  const response=await fetch(endpoint,{headers:{"X-Figma-Token":token,accept:"application/json"},signal:AbortSignal.timeout(17000),cache:"no-store"});
  if(!response.ok)return {ok:false,error:"Figma API HTTP "+response.status+". Check file access and token permissions."};
  const size=Number(response.headers.get("content-length")??0);
  if(size>2500000)return {ok:false,error:"Figma file too large. Select a smaller frame."};
  const body:unknown=await response.json();
  const obj=body&&typeof body==="object"&&!Array.isArray(body)?body as Record<string,unknown>:null;
  let source:unknown=obj?.document;
  if(file.nodeId){
   const map=obj?.nodes;
   const nodeMap=map&&typeof map==="object"&&!Array.isArray(map)?map as Record<string,unknown>:null;
   const entry=nodeMap?.[file.nodeId],record=entry&&typeof entry==="object"&&!Array.isArray(entry)?entry as Record<string,unknown>:null;
   source=record?.document;
  }
  const imported=figmaToUiTree(source);
  const combined=[...page.ui_tree,...imported];
  if(!validateUiTree(combined)||JSON.stringify(combined).length>600000)return {ok:false,error:"Imported page exceeds builder limits."};
  const saved=await savePageTree(pageId,combined,page.version,page.ui_tree);
  return saved.ok?{ok:true,count:imported.length}:{ok:false,error:saved.error};
 }catch(e){return {ok:false,error:e instanceof Error?e.message:"Figma importer failed"};}
}
