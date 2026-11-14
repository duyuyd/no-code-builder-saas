"use server";
import {createHash,randomUUID} from "node:crypto";
import {PDFDocument} from "pdf-lib";
import {createClient} from "@/lib/supabase/server";

export type SigningResult={ok:true;id:string;downloadUrl:string;sha256:string}|{ok:false;error:string};
async function authenticatedSigner(){
 const db=await createClient();
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user||!user.email)throw new Error("Bạn cần đăng nhập tài khoản có email để ký.");
 const {data:profile}=await db.from("profiles").select("role,plan").eq("id",user.id).single();
 if(profile?.role!=="admin" && !["pro","agency"].includes(profile?.plan??""))throw new Error("E-signature dành cho gói Pro/Agency. Thanh toán chưa được kích hoạt.");
 return {db,user};
}
export async function signPdf(form:FormData):Promise<SigningResult>{
 try{
  const {db,user}=await authenticatedSigner();
  const file=form.get("pdf");
  const signer=String(form.get("signer_name")??"").trim();
  const signature=String(form.get("signature")??"");
  const pageNumber=Number(form.get("page")??1);
  const x=Number(form.get("x")??0.5);
  const y=Number(form.get("y")??0.75);
  if(!(file instanceof File)||file.size>3_000_000||file.size<30||!file.name.toLowerCase().endsWith(".pdf"))throw new Error("Chỉ chấp nhận PDF tối đa 3 MB.");
  if(signer.length<2||signer.length>120)throw new Error("Họ tên người ký không hợp lệ.");
  if(!Number.isSafeInteger(pageNumber)||pageNumber<1||pageNumber>1000||![x,y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new Error("Vị trí ký không hợp lệ.");
  if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature)||signature.length>550000)throw new Error("Cần vẽ chữ ký bằng tay trước khi lưu.");
  const bytes=Buffer.from(await file.arrayBuffer());
  if(bytes.subarray(0,5).toString("ascii")!=="%PDF-")throw new Error("Tệp tải lên không phải PDF.");
  const pngBytes=Buffer.from(signature.split(",")[1],"base64");
  if(pngBytes.length<80||pngBytes.length>400000||pngBytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")throw new Error("Ảnh chữ ký không hợp lệ.");
  const pdf=await PDFDocument.load(bytes);
  if(pageNumber>pdf.getPageCount())throw new Error("Số trang vượt quá tài liệu.");
  const page=pdf.getPage(pageNumber-1);
  const image=await pdf.embedPng(pngBytes);
  const size=page.getSize();
  const width=size.width*0.28;
  const height=width*image.height/image.width;
  const atX=Math.max(0,Math.min(size.width-width,x*size.width));
  const atY=Math.max(0,Math.min(size.height-height,size.height-y*size.height-height));
  page.drawImage(image,{x:atX,y:atY,width,height});
  pdf.setTitle(file.name.slice(0,180));
  pdf.setAuthor(signer);
  pdf.setSubject("Electronic signature placed with user consent");
  pdf.setModificationDate(new Date());
  const signed=Buffer.from(await pdf.save());
  const id=randomUUID();
  const path=user.id+"/"+id+".pdf";
  const hash=(value:Buffer)=>createHash("sha256").update(value).digest("hex");
  const {error:uploadError}=await db.storage.from("signed-pdfs").upload(path,signed,{contentType:"application/pdf",upsert:false,cacheControl:"0"});
  if(uploadError)throw new Error("Không thể lưu PDF riêng tư: "+uploadError.message);
  const {error:metadataError}=await db.from("esign_documents").insert({
   id,owner_id:user.id,signer_name:signer,signer_email:user.email,
   original_filename:file.name.slice(0,180),source_sha256:hash(bytes),
   signed_sha256:hash(signed),storage_path:path,file_size:signed.length,
   page_number:pageNumber,x_fraction:x,y_fraction:y
  });
  if(metadataError){
    await db.storage.from("signed-pdfs").remove([path]);
    throw new Error("Không thể lưu nhật ký ký: "+metadataError.message);
  }
  const {data:urlData,error:urlError}=await db.storage.from("signed-pdfs").createSignedUrl(path,60);
  if(urlError||!urlData?.signedUrl)throw new Error("Đã lưu tài liệu nhưng không tạo được URL tải. Mở lịch sử để tải lại.");
  return {ok:true,id,downloadUrl:urlData.signedUrl,sha256:hash(signed)};
 }catch(error){return {ok:false,error:error instanceof Error?error.message:"Không thể ký tài liệu."};}
}
export async function getSignedPdfUrl(id:string):Promise<{ok:true;url:string}|{ok:false;error:string}>{
 try{
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error("Mã tài liệu không hợp lệ.");
  const {db,user}=await authenticatedSigner();
  const {data:record}=await db.from("esign_documents").select("storage_path").eq("id",id).eq("owner_id",user.id).maybeSingle();
  if(!record)throw new Error("Không tìm thấy tài liệu của bạn.");
  const {data,error}=await db.storage.from("signed-pdfs").createSignedUrl(record.storage_path,60);
  if(error||!data?.signedUrl)throw new Error(error?.message??"Không tạo được liên kết tải.");
  return {ok:true,url:data.signedUrl};
 }catch(error){return {ok:false,error:error instanceof Error?error.message:"Không thể tải tài liệu."};}
}
