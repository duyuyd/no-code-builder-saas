"use client";
import {useEffect,useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {BookOpen,CheckCircle2,ChevronLeft,ChevronRight,MousePointer2,Plus,Settings2,Smartphone,Undo2,X} from "lucide-react";
type Step={title:string;detail:string;hint:string};
const steps:Step[]=[
 {title:"1. Chọn thiết bị",detail:"Chuyển giữa Điện thoại, Máy tính bảng và Web ngay trên thanh của Builder. Canvas sẽ đổi chiều rộng để bạn xem thiết kế theo đúng màn hình.",hint:"Trên điện thoại, thanh chuyển thiết bị nằm phía trên Canvas."},
 {title:"2. Thêm thành phần",detail:"Bấm Thêm thành phần ở cuối màn hình, chọn nhóm, rồi bấm dấu + cạnh khối. Trên máy tính bạn có thể kéo từ thư viện bên trái.",hint:"Mẹo: chỉ bấm + là thêm được, không bắt buộc dùng kéo thả."},
 {title:"3. Chỉnh nội dung & màu",detail:"Chạm vào khối vừa thêm trên Canvas. Bảng Thuộc tính sẽ hiện ra. Chọn một trong 12 kiểu/ngữ cảnh, sau đó sửa chữ, viền, màu, độ rộng và số cột.",hint:"Nếu chưa chọn khối, hãy chạm vào khối trong Canvas trước."},
 {title:"4. Sắp xếp & lồng khối",detail:"Kéo bằng tay cầm ở góc trên của khối. Trên điện thoại giữ ngón tay trong khoảng 0,26 giây để tránh xung đột với cuộn. Thả vào vùng chứa để tạo khối lồng nhau.",hint:"Bấm nút Hoàn tác để lấy lại cấu trúc trước khi kéo."},
 {title:"5. Lưu, chạy thử, xuất bản",detail:"Mọi thay đổi tự lưu vào Supabase sau 2 giây. Kiểm tra dòng Đã lưu rồi bấm Chạy thử. Khi ổn, nhấn biểu tượng tên lửa để xuất bản hoặc mở Xuất mã để tải ZIP.",hint:"Không bấm Xuất bản khi màn hình báo Lưu thất bại."},
 {title:"6. Dùng mẫu để tiết kiệm thời gian",detail:"Truy cập Trang chủ Studio → thư viện mẫu để tạo website thời trang, dạy học, cửa hàng hoặc game có bản đồ. Dùng Kho ảnh để bổ sung hình và Trợ lý để hỏi vấn đề tại trang hiện tại.",hint:"Các mẫu là cấu trúc khởi tạo, bạn vẫn có thể chỉnh toàn bộ sau khi tạo."}
];
export default function BuilderTour({onOpenComponents,onOpenProperties}:{onOpenComponents:()=>void;onOpenProperties:()=>void}){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0);
 useEffect(()=>{try{if(localStorage.getItem("studio:tour:2026-11")!=="done")setOpen(true);}catch{/* optional storage */}},[]);
 const close=(next:boolean)=>{setOpen(next);if(!next){try{localStorage.setItem("studio:tour:2026-11","done");}catch{/* optional storage */}}};
 const step=steps[index];
 return <Dialog.Root open={open} onOpenChange={close}>
  <Dialog.Trigger asChild><button type="button" title="Hướng dẫn thao tác Builder" className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-2 text-xs font-bold text-slate-200 hover:border-orange-400 sm:h-10 sm:px-3"><BookOpen size={16}/><span className="hidden lg:inline">Hướng dẫn</span></button></Dialog.Trigger>
  <Dialog.Portal>
   <Dialog.Overlay className="fixed inset-0 z-[84] bg-slate-950/80 backdrop-blur-[2px]"/>
   <Dialog.Content className="fixed inset-x-3 top-1/2 z-[85] max-h-[92dvh] -translate-y-1/2 overflow-y-auto rounded-[24px] border border-slate-700 bg-[#16243a] p-5 text-white shadow-2xl outline-none sm:left-1/2 sm:w-[min(520px,calc(100vw-40px))] sm:-translate-x-1/2 sm:p-7">
    <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-black"><BookOpen size={21} className="text-orange-300"/> Học Builder trong 6 bước</div><Dialog.Close className="rounded-lg border border-slate-600 p-2" aria-label="Đóng hướng dẫn"><X size={17}/></Dialog.Close></div>
    <Dialog.Description className="sr-only">Hướng dẫn tương tác từ cơ bản đến xuất bản sản phẩm.</Dialog.Description>
    <div className="mb-6 grid grid-cols-6 gap-1.5">{steps.map((_,i)=><button type="button" key={i} aria-label={"Bước "+(i+1)} aria-current={i===index?"step":undefined} onClick={()=>setIndex(i)} className={"h-2.5 rounded-full "+(i<=index?"bg-orange-500":"bg-slate-700")}/>)}</div>
    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">{index===0?<Smartphone size={27}/>:index===1?<Plus size={27}/>:index===2?<Settings2 size={27}/>:index===3?<MousePointer2 size={27}/>:index===4?<Undo2 size={27}/>:<CheckCircle2 size={27}/>}</div>
    <Dialog.Title className="text-2xl font-black">{step.title}</Dialog.Title>
    <p className="mt-4 text-sm leading-7 text-slate-200">{step.detail}</p>
    <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">{step.hint}</p>
    <div className="mt-5 flex flex-wrap gap-2">
     {index===1&&<button type="button" onClick={()=>{close(false);onOpenComponents();}} className="rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white">Mở thư viện thành phần</button>}
     {index===2&&<button type="button" onClick={()=>{close(false);onOpenProperties();}} className="rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white">Mở bảng Thuộc tính</button>}
    </div>
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-700 pt-5"><button type="button" onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0} className="flex items-center gap-1 rounded-xl border border-slate-600 px-4 py-3 text-xs font-bold disabled:opacity-30"><ChevronLeft size={16}/> Quay lại</button>
     <span className="text-xs text-slate-400">{index+1} / {steps.length}</span>
     {index<steps.length-1?<button type="button" onClick={()=>setIndex(i=>i+1)} className="flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold">Tiếp theo <ChevronRight size={16}/></button>:<button type="button" onClick={()=>close(false)} className="rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold">Bắt đầu thiết kế</button>}
    </div>
   </Dialog.Content>
  </Dialog.Portal>
 </Dialog.Root>;
}
