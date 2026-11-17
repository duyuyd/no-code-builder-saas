import {createClient} from "@/lib/supabase/server";
import {toUnifiedChai} from "@/lib/unified-chai-bridge";
import {validateUiTree} from "@/lib/component-registry";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{projectId:string}>}){
 const {projectId}=await params;const pageId=new URL(request.url).searchParams.get("page");
 if(!/^[0-9a-f-]{36}$/i.test(projectId)||!pageId||!/^[0-9a-f-]{36}$/i.test(pageId))return Response.json({error:"Invalid project/page"},{status:400});
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return Response.json({error:"Login required"},{status:401});
 const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)return Response.json({error:"Not owner"},{status:403});
 const {data:page}=await db.from("pages").select("id,ui_tree,version").eq("project_id",projectId).eq("id",pageId).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))return Response.json({error:"Page not found or corrupt"},{status:404});
 return Response.json({pageId,version:page.version,blocks:toUnifiedChai(page.ui_tree),format:"nuvora-chai-bridge-v1"},{headers:{"Cache-Control":"private, no-store"}});
}
