"use server";
import {createClient} from "@/lib/supabase/server";
import {safeUrl,type BuilderNode} from "@/lib/component-registry";
export type CatalogResult={ok:true;id:string}|{ok:false;error:string};
export async function syncProductNode(projectId:string,node:BuilderNode):Promise<CatalogResult>{
 if(!/^[a-f0-9-]{36}$/i.test(projectId)||!["product-card","product-grid","checkout-form"].includes(node.type)||
  !/^[a-f0-9-]{36}$/i.test(node.id))return {ok:false,error:"Invalid product node."};
 const name=String(node.props.productName??"").trim(),price=Number(node.props.priceVnd);
 const image=String(node.props.imageUrl??"").trim();
 if(name.length<1||name.length>180||!Number.isSafeInteger(price)||price<1000||price>1000000000)
  return {ok:false,error:"Enter a name (1–180 characters) and price between 1,000 and 1,000,000,000 VND."};
 if(image&&(!/^https:\/\//i.test(image)||!safeUrl(image)||image.length>1500))
  return {ok:false,error:"Product image must be a valid HTTPS URL."};
 try{
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in again."};
  const {data:project}=await db.from("projects").select("id").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"Only the project owner may edit product catalogue."};
  const {data,error}=await db.from("products").upsert({project_id:projectId,builder_node_id:node.id,name,price_vnd:price,
   image_url:image,description:String(node.props.description??"").slice(0,2000),active:true},
   {onConflict:"project_id,builder_node_id"}).select("id").single();
  return error||!data?{ok:false,error:error?.message??"Could not save product"}:{ok:true,id:data.id};
 }catch{return {ok:false,error:"Cannot save to Supabase catalogue."};}
}
