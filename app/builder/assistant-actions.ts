"use server";
import {createClient} from "@/lib/supabase/server";
import {getDefinition,validateUiTree,type BuilderNode} from "@/lib/component-registry";
import {findNode} from "@/lib/builder-tree";
import {validateGameScene} from "@/lib/game-scene";
import {diagnosePage,explainMobileLayout} from "@/lib/studio-diagnostics";

export type AssistantResponse={ok:true;mode:"guidance"|"gemini";answer:string;context:string}|{ok:false;error:string};
type Input={projectId:string;pageId:string;question:string;selectedId?:string|null;contextKind?:"builder"|"game"};
function answerOffline(question:string,context:string):string{
 const q=question.trim().toLocaleLowerCase("vi-VN");
 const normalized=q.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
 if(/^(alo+|hello+|hi+|chao|xin chao|hey+)[!?. ]*$/.test(normalized))
  return "Chào bạn. Tôi là trợ lý bên trong No-Code Studio. Tôi đang xem: "+context+". Bạn có thể hỏi tôi sửa bố cục đang xem, chèn ảnh, sắp xếp khối trên Android hoặc mở màn thiết kế game. Tôi chưa tự nhấn nút hay thay đổi dữ liệu của bạn.";
 if(/(ban la ai|may la ai|tro ly la ai|ai day|ten gi|la chatgpt hay gemini)/.test(normalized))
  return "Tôi là Trợ lý Studio, không phải Google Gemini đang hoạt động. Tôi đọc loại dự án, trang, thành phần đã lưu và hướng dẫn thao tác bằng bộ quy tắc nội bộ. Tôi không tự sửa dự án hoặc trả lời như một chatbot AI tổng quát. Gemini chỉ được gọi nếu quản trị viên tự cấp khóa và bật chế độ ngoài.";
 if(/(preview|xem truoc|chay thu|3 cot|ba cot|vo bo cuc|chu bi be|chu bi xuong dong|bi hep|responsive|mobile).*(loi|hep|vo|cot|chu|anh|giao dien)|(?:loi|vo|hep).*(?:cot|preview|chay thu)/.test(normalized))
  return "Bản xem trước trên màn hình Android nên chuyển bố cục grid 2–6 cột thành 1 cột khi khung rộng dưới 620px. Tôi đã cập nhật cơ chế responsive ở Canvas và Chạy thử; điều chỉnh mẫu bằng cách chọn khối Grid → Thuộc tính. Nếu ảnh trắng có chữ khó nhìn, hãy chọn khối Hình ảnh và chọn ảnh trong Kho ảnh.";
 if(/(lien quan|lien minh|moba|5v5|ban do|tuong|tru|duong |jungle|lane)/.test(normalized))
  return "Bản đồ game dạng vật thể 2D cũ chưa phải MOBA. Một map MOBA thực cần ba làn đường, rừng, trụ, lính, hero AI, kỹ năng, HUD và điều kiện phá nhà chính. Đừng nhầm demo thu thập sao với 5v5. Mở /game-maps để xem mẫu hiện có; muốn chơi trận MOBA phải dùng core chuyên biệt, không chỉ đổi màu nền.";
 let reply="";
 if(/kéo|thả|chọn|bấm|thao tác|dính|mobile|điện thoại/.test(q))
 reply="1. Trên điện thoại, bấm Thêm và dấu + cạnh thành phần để chèn, không phải kéo bằng tay.\n2. Chạm khối trong Canvas: bảng Thuộc tính hiện ra. Chọn một trong 12 kiểu có sẵn.\n3. Trên Android có nút ↑ Lên, ↓ Xuống và Nhân đôi ngay trên khối. Muốn kéo, giữ tay cầm khoảng 0,26 giây rồi di chuyển.\n4. Đợi trạng thái Đã lưu vào Supabase rồi bấm Chạy thử.";
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
 reply="Tôi chưa hiểu ý định cụ thể của câu này khi chạy offline. Trang đang mở có "+context+". Hãy chọn khối đang bị lỗi và mô tả thao tác (ví dụ: Grid ba cột bị vỡ trên Android, nút không có liên kết hoặc ảnh chưa hiển thị). Tôi sẽ hướng dẫn dựa trên dữ liệu đã lưu, không tự nhận là AI hội thoại tổng quát.";
 return "Ngữ cảnh: "+context+"\n\n"+reply;
}
function countAndFind(tree:BuilderNode[],id:string|null|undefined){
 let count=0;let selected:string|null=null;
 const visit=(nodes:BuilderNode[])=>{for(const node of nodes){count++;if(node.id===id)selected=node.type;if(node.children.length)visit(node.children);}};
 visit(tree);return {count,selected};
}
export async function askStudioAssistant(input:Input):Promise<AssistantResponse>{
 if(!input||!/^[a-f0-9-]{36}$/i.test(input.projectId)||(input.contextKind!=="game"&&!/^[a-f0-9-]{36}$/i.test(input.pageId))||
 typeof input.question!=="string"||input.question.trim().length<2||input.question.length>600)
 return {ok:false,error:"Câu hỏi hoặc dự án không hợp lệ."};
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {ok:false,error:"Bạn cần đăng nhập để sử dụng trợ lý."};
 const {data:project}=await db.from("projects").select("id,kind").eq("id",input.projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
 if(!project)return {ok:false,error:"Không có quyền đọc dự án."};
 if(input.contextKind==="game"){
  if(project.kind!=="game")return {ok:false,error:"Đây không phải dự án game."};
  const {data:game}=await db.from("game_projects").select("scene").eq("project_id",project.id).maybeSingle();
  if(!game||!validateGameScene(game.scene))return {ok:false,error:"Hãy lưu màn game vào Supabase để trợ lý hiểu ngữ cảnh."};
  const scene=game.scene;
  if(scene.mode==="moba"){
   const {data:arena}=await db.from("moba_maps").select("name").eq("code",scene.mobaCode??"").eq("is_active",true).maybeSingle();
   const mapName=arena?.name??scene.mobaCode??"chưa xác định";
   const context="Dự án "+project.id+", MOBA 5v5 PvE trên bản đồ "+mapName+", 3 đường (top/mid/bot), 2 đội 5 hero AI, 12 trụ, 2 nhà chính";
   const q=input.question.trim().toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
   let answer="";
   if(/^(alo|hello|hi|chao|xin chao|hey)[!?. ]*$/.test(q))
    answer="Chào bạn. Tôi đang đọc bản đồ MOBA "+mapName+" của dự án đang lưu. Bạn có thể hỏi về chiến thuật 3 đường, cách chạy thử, thay bản đồ hay xuất bản.";
   else if(/ban la ai|may la ai|tro ly la ai/.test(q))
    answer="Tôi là Trợ lý Studio chạy theo dữ liệu đã lưu và quy tắc nội bộ; không phải Gemini đang hoạt động. Tôi có thể hướng dẫn về MOBA "+mapName+" nhưng chưa thể tự tạo hình ảnh hoặc tự điều khiển game cho bạn.";
   else if(/(ban do|map|cach choi|may cot|tru|jungle|rung|lane|duong)/.test(q))
    answer="Bản đồ "+mapName+" có 3 đường top/mid/bot, hai vùng rừng, bụi rậm, sông và 12 trụ. Bên xanh có một người chơi cùng 4 AI; bên đỏ có 5 AI. Hạ trụ đối phương để tiếp cận nhà chính. Đổi map trong Game Builder → Chọn chiến trường. Bạn không cần xây map từ các ô emoji.";
   else if(/(hero|tuong|skill|ky nang|danh|mau|coi|thao tac|android|dieu khien|joystick|buff)/.test(q))
    answer="Trên Android: xoay joystick bên trái để di chuyển, chạm mặt đất để tự chạy, nút ĐÁNH để đánh thường. Ba kỹ năng: Lốc kiếm Q (6s), Lướt W (5s), Hồi máu E (12s). Máu về 0 sẽ hồi sinh. Lính và trụ tự chiến đấu. Đây là 5v5 PvE, không phải multiplayer online.";
   else if(/(luu|xuat|cong khai|publish|web|link|chia se)/.test(q))
    answer="Chọn bản đồ, kiểm tra trạng thái đã lưu vào Supabase, bấm Xuất bản. Đường dẫn /play/[mã dự án] sẽ mở trận MOBA công khai không cần đăng nhập. Khi thay map, cần lưu và xuất bản lại.";
   else
    answer="Tôi đang làm việc ở chế độ MOBA trên "+mapName+". Trận có 10 hero, lính, trụ và kỹ năng. Hãy hỏi cụ thể về đường top/mid/bot, nhân vật, thao tác Android hoặc cách xuất bản. Tôi không tự nhận có hiểu biết như một AI tổng quát.";
   return {ok:true,mode:"guidance",answer:answer+"\n\nNgữ cảnh đã lưu: "+context,context};
  }
  const enemies=scene.objects.filter(o=>o.kind==="enemy").length;
  const stars=scene.objects.filter(o=>o.kind==="coin").length;
  const selected=scene.objects.find(o=>o.id===input.selectedId);
  const context="Màn game "+scene.title+", chế độ "+(scene.mode??"collection")+", "+scene.objects.length+" vật thể, "+enemies+" đối thủ, "+stars+" vật phẩm, đang chọn "+(selected?selected.label+" ("+selected.kind+")":"không có");
  const q=input.question.toLocaleLowerCase("vi-VN");
  let answer="";
  if(/đánh|quái|máu|chiến đấu|combat|skill|boss|fifa|3q|võ lâm|liên quân|liên minh|moba|rpg|đối thủ/.test(q))
   answer=scene.mode==="combat"
   ?"Core này có HP người chơi, quái AI đuổi theo, nút ĐÁNH/Space/J/K, thời gian hồi tấn công, vật phẩm và thắng/thua. Dùng công cụ 👹 để thêm quái; chọn quái để sửa HP. Trong Chơi thử, hãy hạ "+enemies+" đối thủ, nhặt "+stars+" vật phẩm rồi về đích. Đây là PvE offline, chưa phải MMO."
   :"Màn hiện đang ở chế độ Thu thập. Trong Thuộc tính màn chơi chọn Cơ chế chơi → Chiến đấu PvE. Game Builder sẽ thêm quái đầu tiên nếu còn thiếu. Chơi thử và sử dụng nút ĐÁNH trên Android.";
  else if(/map|bản đồ|mẫu|nền|ảnh|nhân vật|tài nguyên|model|sprite/.test(q))
   answer="Chọn mẫu bản đồ theo thể loại ở đầu Game Builder; các mẫu lấy từ Supabase. Dùng Kho ảnh để chọn ảnh nền, nhân vật, hoặc quái. Chạm Chọn & kéo để chỉnh vị trí; chọn Lưu để đồng bộ trước khi Xuất bản.";
  else
   answer="Đang làm việc với "+context+". Chọn vật thể cần chỉnh ở cột Kho vật thể. Dùng nút Chơi thử để test điều khiển, chiến đấu và điều kiện thắng/thua. Nhấn Undo nếu vị trí sai.";
  return {ok:true,mode:"guidance",answer:"Ngữ cảnh: "+context+"\n\n"+answer+"\n\nNguồn tài nguyên: /resources · Nhân vật WebGL 3D: /characters.",context};
 }
 const {data:page}=await db.from("pages").select("path,ui_tree").eq("id",input.pageId).eq("project_id",project.id).maybeSingle();
 if(!page||!validateUiTree(page.ui_tree))return {ok:false,error:"Không tải được trang hiện tại."};
 const {count,selected}=countAndFind(page.ui_tree as BuilderNode[],input.selectedId);
 const tree=page.ui_tree as BuilderNode[];
 const chosen=input.selectedId?findNode(tree,input.selectedId):null;
 const kinds=new Map<string,number>();
 const visit=(nodes:BuilderNode[])=>{for(const n of nodes){kinds.set(n.type,(kinds.get(n.type)??0)+1);visit(n.children);}};
 visit(tree);
 const groups=[...kinds.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([type,amount])=>type+"×"+amount).join(", ");
 const current=chosen?getDefinition(chosen.type):null;
 const summary=chosen&&(current?.kind==="image"||current?.kind==="container"||current?.kind==="button")?
   "; trạng thái: "+(current.kind==="image"?(chosen.props.src?"đã gắn ảnh":"chưa gắn ảnh"):current.kind==="container"?chosen.children.length+" khối con":"nút "+String(chosen.props.text??"").slice(0,30)):"";
 const context="Loại "+project.kind+", trang "+page.path+", "+count+" thành phần ("+groups+"), đang chọn "+(selected?getDefinition(selected)?.label??selected:"không có")+summary;
 const normalizedQuestion=input.question.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
 const diagnostics=diagnosePage(tree);
 if(/(xem truoc|chay thu|mobile|android|responsive|grid|bo cuc|3 cot|ba cot|be chu|chu vo|vuot le|bi hep|tran man hinh|loi anh|anh hong|anh trang)/.test(normalizedQuestion)){
  return {ok:true,mode:"guidance",answer:explainMobileLayout(diagnostics,page.path),context};
 }
 if(/(thieu anh|chua co anh|anh minh hoa|cho nao them anh)/.test(normalizedQuestion)){
  return {ok:true,mode:"guidance",answer:"Trang "+page.path+" đang có "+diagnostics.emptyImages+" khối hình ảnh chưa có URL, "+diagnostics.configuredImages+" khối đã gắn ảnh. Hãy chạm khối ảnh trống → Thuộc tính → Kho ảnh Supabase → Chọn ảnh → Lưu. Tôi không tự gắn ảnh không rõ nguồn.",context};
 }
 let resourceHint="";
 if(/ảnh|hình|icon|sprite|asset|texture|tài nguyên|model|3d|bản đồ|map/i.test(input.question)){
  const {data:sources}=await db.from("asset_sources").select("title,category,url").limit(100);
  const q=input.question.toLocaleLowerCase("vi-VN");
  const term=/3d|model|nhân vật/.test(q)?"3d":/map|bản đồ/.test(q)?"bản đồ":/icon/.test(q)?"icon":/sprite|game/.test(q)?"game":"website";
  const matches=(sources??[]).filter(row=>(row.category+" "+row.title).toLocaleLowerCase("vi-VN").includes(term)).slice(0,3);
  if(matches.length)resourceHint="\n\nTài nguyên đã lập chỉ mục (/resources):\n"+matches.map(row=>"- "+row.title+": "+row.url).join("\n");
 }
 const key=process.env.GEMINI_API_KEY;
 // Both flags must be explicitly provided by the owner to allow any external request.
 if(!key||process.env.STUDIO_AI_ENABLED!=="true")
 return {ok:true,mode:"guidance",answer:answerOffline(input.question,context)+resourceHint,context};
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
