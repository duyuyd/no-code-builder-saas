import "server-only";
import JSZip from "jszip";
import {createClient} from "@/lib/supabase/server";
import {generateHtmlCode} from "@/lib/code-generator";
import {validateUiTree,type BuilderNode} from "@/lib/component-registry";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validPath=/^\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)?$/i;
function cloneLinks(nodes:BuilderNode[],fromPath:string,valid:Set<string>):BuilderNode[]{
 const depth=fromPath.split("/").filter(Boolean).length;
 return nodes.map(node=>{
  const props={...node.props};
  if(typeof props.href==="string" && valid.has(props.href)){
   props.href="../".repeat(depth)+(props.href==="/"? "index.html":props.href.slice(1)+"/index.html");
  }
  return {...node,props,style:{...node.style},children:cloneLinks(node.children,fromPath,valid)};
 });
}
export async function GET(_request:Request,{params}:{params:Promise<{projectId:string}>}){
 const {projectId}=await params;
 if(!uuid.test(projectId))return new Response("Mã dự án không hợp lệ.",{status:400});
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return new Response("Hãy đăng nhập để tải dự án.",{status:401});
 const {data:project,error:projectError}=await db.from("projects").select("id,name,owner_id,archived_at").eq("id",projectId).maybeSingle();
 if(projectError||!project||project.owner_id!==user.id||project.archived_at!==null)
  return new Response("Dự án không tồn tại hoặc không được phép xuất.",{status:403});
 const {data:pages,error:pagesError}=await db.from("pages").select("path,ui_tree").eq("project_id",projectId).order("path");
 if(pagesError||!pages||!pages.length||pages.length>50)
  return new Response("Dự án không có trang hoặc vượt giới hạn 50 trang.",{status:400});
 if(pages.some(p=>!validPath.test(p.path)||!validateUiTree(p.ui_tree)))
  return new Response("Đường dẫn hoặc nội dung trang không hợp lệ.",{status:400});
 const paths=new Set(pages.map(p=>p.path));
 if(!paths.has("/"))return new Response("Thiếu trang chủ /.",{status:400});
 const zip=new JSZip();
 let total=0;
 for(const page of pages){
  const tree=cloneLinks(page.ui_tree,page.path,paths);
  const html=generateHtmlCode(tree,project.name);
  total+=html.length;
  if(total>12_000_000)return new Response("Dự án quá lớn để xuất ZIP.",{status:413});
  const filename=page.path==="/"? "index.html":page.path.slice(1)+"/index.html";
  zip.file(filename,html,{createFolders:true});
 }
 zip.file("HUONG-DAN.txt","BẢN XUẤT NO-CODE BUILDER\n\nMở index.html bằng trình duyệt để xem website và chơi game.\nNút điều hướng nội bộ mở các trang HTML trong thư mục tương ứng.\nTrò chơi Lật thẻ và Đố vui hoạt động bằng JavaScript được đóng gói bên trong HTML.\nCác ảnh, video và liên kết bên ngoài vẫn cần kết nối Internet.\nBiểu mẫu liên hệ sử dụng ứng dụng email trên thiết bị (mailto); không có máy chủ lưu thư.\n");
 const bytes=await zip.generateAsync({type:"uint8array",compression:"DEFLATE",compressionOptions:{level:6}});
 const filename="no-code-project-"+projectId.slice(0,8)+".zip";
 return new Response(Uint8Array.from(bytes).buffer,{
  status:200,headers:{
   "Content-Type":"application/zip",
   "Content-Disposition":"attachment; filename=\""+filename+"\"",
   "Cache-Control":"no-store, private",
   "X-Content-Type-Options":"nosniff"
  }
 });
}
