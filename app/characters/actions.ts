"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {isCharacterModel} from "@/lib/character-model";
const uuid=/^[a-f0-9-]{36}$/i;
export async function saveCharacter(formData:FormData){
 const name=String(formData.get("name")??"").trim();
 const id=String(formData.get("id")??"").trim();
 const json=String(formData.get("model")??"");
 if(!name||name.length>100||json.length>32000||(id&&!uuid.test(id)))throw new Error("Thông tin nhân vật không hợp lệ.");
 let model:unknown;try{model=JSON.parse(json);}catch{throw new Error("Dữ liệu nhân vật không phải JSON hợp lệ.");}
 if(!isCharacterModel(model))throw new Error("Thông số nhân vật không hợp lệ.");
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 if(id){
  const {data,error}=await db.from("character_designs").update({name,model,updated_at:new Date().toISOString()})
   .eq("id",id).eq("owner_id",user.id).select("id").maybeSingle();
  if(error||!data)throw new Error(error?.message??"Không có quyền sửa nhân vật.");
  revalidatePath("/characters");redirect("/characters?selected="+id+"&saved=1");
 }
 const {data,error}=await db.from("character_designs").insert({owner_id:user.id,name,model}).select("id").single();
 if(error||!data)throw new Error(error?.message??"Không lưu được nhân vật.");
 revalidatePath("/characters");redirect("/characters?selected="+data.id+"&saved=1");
}
export async function deleteCharacter(formData:FormData){
 const id=String(formData.get("id")??"");
 if(!uuid.test(id))throw new Error("Mã nhân vật không hợp lệ.");
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await db.from("character_designs").delete().eq("id",id).eq("owner_id",user.id);
 if(error)throw new Error(error.message);
 revalidatePath("/characters");redirect("/characters");
}
