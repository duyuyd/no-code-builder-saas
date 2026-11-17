import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import PlayCanvasStudio from "@/components/playcanvas/PlayCanvasStudio";
export const metadata={title:"PlayCanvas 3D Game Builder | NuvoraCraft",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{project?:string}>}){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const projectId=(await searchParams).project;
 const {data:project}=await db.from("projects").select("id,name,kind").eq("id",projectId??"").eq("owner_id",user.id).eq("kind","game").is("archived_at",null).maybeSingle();
 if(!project)notFound();
 const {data:page,error}=await db.from("pages").select("id").eq("project_id",project.id).order("path").limit(1).maybeSingle();
 if(error||!page)throw Error("Game project has no editable page.");
 return <PlayCanvasStudio key={project.id} projectId={project.id} pageId={page.id} projectName={project.name}/>;
}
