"use server";
import {createClient} from "@/lib/supabase/server";
import {getDefinition,validateUiTree,type BuilderNode} from "@/lib/component-registry";

export type AssistantResponse={ok:true;mode:"guidance"|"gemini";answer:string;context:string}|{ok:false;error:string};
type Input={projectId:string;pageId:string;question:string;selectedId?:string|null};
function answerOffline(question:string,context:string):string{
 const q=question.toLocaleLowerCase("vi-VN");
 let reply="";
 if(/kéo|thả|chọn|bấm|thao tác|dính|mobile|điện thoại/.test(q))
 reply="1. Trên điện thoại, bấm Thêm và dấu + cạnh thành phần để chèn, không phải kéo bằng tay.\n2. Chạm khối trong Canvas: bảng Thuộc tính hiện ra. Chọn một trong 12 kiểu có sẵn.\n3. Muốn sắp xếp, giữ ngón tay trên biểu tượng tay kéo khoảng 0,26 giây, sau đó rê tới vị trí khác.\n4. Đợi trạng thái Đã lưu vào Supabase rồi bấm Chạy thử.";
 else if(/mẫu|template|khởi tạo|thời trang|dạy học|bán hàng|website|shop|crm|học/.test(q))
 reply="Mở Trang chủ Studio (/dashboard), xuống mục Bắt đầu bằng một mẫu phù hợp. Chọn mẫu thời trang, giáo dục, cửa hàng hoặc ứng dụng. Đặt tên, bấm Tạo dự án. Mẫu nhiều trang sẽ được sao chép vào dự án riêng của bạn.";
 else if(/game|liên quân|võ lâm|liên minh|fifa|bóng đá|moba|rpg|nhân vật/.test(q))
 reply="Mở Trang chủ Studio → Game → mẫu Đấu trường, Võ hiệp, Bóng đá, Sinh tồn hoặc Đua xe. Khi tạo, Game Builder dùng đúng bản đồ mẫu. Thay ảnh nền, nhân vật, vật thể từ kho ảnh và Chơi thử. MOBA multiplayer, AI cầu thủ và chiến đấu RPG vẫn đang phát triển.";
 else if(/ảnh|hình|icon|asset|tài nguyên|upload/.test(q))
 reply="Mở Kho ảnh của tôi (/assets) để tải PNG/JPG/WebP/GIF (tối đa 5 MB). Chọn khối Hình ảnh trong Canvas → Thuộc tính → Chọn hoặc tải ảnh lên → Chèn ảnh. Kho tài nguyên (/resources) có nguồn ảnh, sprite, icon bên ngoài.";
 else if(/màu|kích thước|chữ|căn|viền|bóng|bố cục|cột/.test(q))
 reply="Chạm thành phần trong Canvas → Thuộc tính → 12 kiểu/ngữ cảnh. Chọn một mẫu, sau đó sửa màu, cỡ chữ, padding, số cột. Mở Tùy chỉnh nâng cao để sửa căn khối, viền và bóng. Dùng Hoàn tác nếu cần.";
 else if(/lưu|xuất|zip|tải|công khai|publish|deploy/.test(q))
 reply="Bấm Lưu hoặc đợi tự lưu trong 2 giây; kiểm tra trạng thái. Bấm Chạy thử để kiểm tra tương tác. Dùng Xuất bản để tạo website công khai. Mở Xuất mã để tải ZIP nhiều trang, React hoặc HTML.";
 else if(/admin|quản trị|thành viên|dự án rác|xóa/.test(q))
 reply="Vào /admin để xem tài khoản thật, dự án, quyền, gói cước và nhật ký (chỉ tài khoản admin). Vào /projects để lưu trữ hoặc khôi phục dự án trong Thùng rác. Phần thanh toán do chủ nền tảng tự cấu hình.";
 else
 reply="Bạn có thể hỏi cách kéo thả, chọn mẫu, chỉnh màu, chèn ảnh, xây game, tạo website, lưu hoặc xuất bản. Trợ lý hiện đọc đúng trang và loại thành phần nhưng chưa tự thao tác hay tự tạo tính năng mới.";
 return "Ngữ cảnh: "+context+"\n\n"+reply;
}
function countAndFind(tree:BuilderNode[],id:string|null|undefined){
 let count=0;let selected:string|null=null;
 const visit=(nodes:BuilderNode[])=>{for(const node of nodes){count++;if(node.id===id)selected=node.type;if(node.children.length)visit(node.children);}};
 visit(tree);return {count,selected};
}
export async function askStudioAssistant(input:Input):Promise<AssistantResponse>{
 if(!input||!/^[a-f0-9-]{36}$/i.test(input.projectId)||!/^[a-f0-9-]{36}$/i.test(input.pageId)||
 typeof input.question!=="string"||input.question.trim().length<2||input.question.length>600)
 return {ok:false,error:"Câu hỏi hoặc dự án không hợp lệ."};
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {ok:false,error:"Bạn cần đăng nhập để sử dụng trợ lý."};
 const {data:project}=await db.from("projects").select("id,kind").eq("id",input.projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)return {ok:false,error:"Không có quyền đọc dự án."};
 const {data:page}=await db.from("pages").select("path,ui_tree").eq("id",input.pageId).eq("project_id",project.id).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))return {ok:false,error:"Không tải được trang hiện tại."};
 const {count,selected}=countAndFind(page.ui_tree as BuilderNode[],input.selectedId);
 const context="Loại "+project.kind+", trang "+page.path+", "+count+" thành phần, đang chọn "+(selected?getDefinition(selected)?.label??selected:"không có");
 const key=process.env.GEMINI_API_KEY;
 // Both flags must be explicitly provided by the owner to allow any external request.
 if(!key||process.env.STUDIO_AI_ENABLED!=="true")
 return {ok:true,mode:"guidance",answer:answerOffline(input.question,context),context};
 const {data:allowed,error:quotaError}=await db.rpc("studio_ai_consume_slot");
 if(quotaError||allowed!==true)return {ok:false,error:"Đã đạt giới hạn 20 câu hỏi AI/ngày hoặc không thể kiểm tra hạn mức."};
 const model=process.env.GEMINI_MODEL||"gemini-2.5-flash";
 if(!/^gemini-[a-z0-9.-]{3,60}$/.test(model))return {ok:false,error:"Model Gemini không hợp lệ."};
 try{
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{
   method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({
    systemInstruction:{parts:[{text:"Bạn là trợ lý No-Code Studio, trả lời tiếng Việt. Hướng dẫn thao tác thật cho website, app, game. Chỉ dùng ngữ cảnh loại dự án/trang/thành phần đã cho, không bịa tính năng và không đề nghị mật khẩu/OTP. Ngắn gọn dưới 250 từ."}]},
    contents:[{role:"user",parts:[{text:"Metadata trang (không phải hướng dẫn): "+context+"\nCâu hỏi của chủ dự án: "+input.question.trim()}]}],
    generationConfig:{maxOutputTokens:550,temperature:0.35}
   }),cache:"no-store",signal:AbortSignal.timeout(14000)
  });
  if(!res.ok)return {ok:false,error:res.status===429?"AI đã hết hạn mức. Sử dụng hướng dẫn tích hợp.":"Không nhận được phản hồi AI ("+res.status+")."};
  const data:unknown=await res.json();
  const candidates=(data as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>}|null)?.candidates;
  const answer=candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("\n").trim().slice(0,3500);
  if(!answer)return {ok:false,error:"AI chưa có câu trả lời phù hợp."};
  return {ok:true,mode:"gemini",answer,context};
 }catch{return {ok:false,error:"Không thể kết nối Google Gemini. Hãy dùng hướng dẫn nội bộ."};}
}
