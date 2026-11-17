"use server";
import {createClient} from "@/lib/supabase/server";
import {privilegedSupabase} from "@/lib/supabase/admin";
import {validateUiTree,type BuilderNode} from "@/lib/component-registry";
export type MarketResult={ok:true;id:string}|{ok:false;error:string};
const uuid=/^[a-f0-9-]{36}$/i;
export async function publishMarketplaceItem(form:FormData):Promise<MarketResult>{
 const title=String(form.get("title")??"").trim(),summary=String(form.get("summary")??"").trim();
 const type=String(form.get("type")??"website"),projectId=String(form.get("projectId")??"");
 const price=Number(form.get("priceVnd")??0);
 if(!uuid.test(projectId)||title.length<5||title.length>120||summary.length>2000||
  !["website","app","game","component"].includes(type)||!Number.isSafeInteger(price)||price<0||price>100000000)
  return {ok:false,error:"Invalid marketplace listing."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return {ok:false,error:"Sign in as a Creator."};
  const {data:project}=await db.from("projects").select("id,kind").eq("id",projectId).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
  if(!project)return {ok:false,error:"Select a project you own."};
  const {data:pages}=await db.from("published_pages").select("ui_tree").eq("project_id",projectId).eq("is_live",true).limit(1);
  if(!pages?.length||!validateUiTree(pages[0].ui_tree))return {ok:false,error:"Publish your project website first."};
  let tree:BuilderNode[]|null=null;
  if(type==="component"){tree=pages[0].ui_tree.slice(0,1);if(!tree.length)return {ok:false,error:"No component to sell."};}
  const {data:item,error}=await db.from("marketplace_items").insert({creator_id:user.id,project_id:projectId,
   title,summary,item_type:type,price_vnd:price,component_tree:tree,status:"draft"}).select("id").single();
  if(error||!item)return {ok:false,error:error?.message??"Failed to create listing."};
  const {error:published}=await db.from("marketplace_items").update({status:"published"}).eq("id",item.id).eq("creator_id",user.id);
  return published?{ok:false,error:"Listing saved as draft: "+published.message}:{ok:true,id:item.id};
 }catch{return {ok:false,error:"Could not publish listing."};}
}
export async function acquireFreeTemplate(itemId:string):Promise<MarketResult>{
 if(!uuid.test(itemId))return {ok:false,error:"Invalid listing."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in to acquire a template."};
  const {data:item}=await db.from("marketplace_items").select("id,title,project_id,item_type,price_vnd,component_tree,status").eq("id",itemId).eq("status","published").maybeSingle();
  if(!item||Number(item.price_vnd)!==0)return {ok:false,error:"This item is not available for free."};
  const {data:pages,error:fetchError}=await db.from("published_pages").select("path,ui_tree").eq("project_id",item.project_id).eq("is_live",true).limit(25);
  if(fetchError||!pages?.length||pages.some(p=>!validateUiTree(p.ui_tree)))return {ok:false,error:"Published template is missing."};
  const kind=["website","app","game"].includes(item.item_type)?item.item_type:"website";
  const {data:project,error:insert}=await db.from("projects").insert({owner_id:user.id,kind,name:item.title.slice(0,110)}).select("id").single();
  if(insert||!project)return {ok:false,error:"Could not create project."};
  const clone=(nodes:BuilderNode[]):BuilderNode[]=>nodes.map(n=>({...n,id:crypto.randomUUID(),props:{...n.props},style:{...n.style},children:clone(n.children)}));
  const copy=item.item_type==="component"&&validateUiTree(item.component_tree)?
   [{path:"/",ui_tree:clone(item.component_tree)}]:pages.map(p=>({path:p.path,ui_tree:clone(p.ui_tree)}));
  const {error:pageError}=await db.from("pages").insert(copy.map(p=>({...p,project_id:project.id})));
  if(pageError){await db.from("projects").delete().eq("id",project.id);return {ok:false,error:"Unable to clone template."};}
  return {ok:true,id:project.id};
 }catch{return {ok:false,error:"Marketplace unavailable."};}
}
export async function deliverPurchasedItem(orderId:string):Promise<MarketResult>{
 if(!uuid.test(orderId))return {ok:false,error:"Invalid order."};
 try{
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in first."};
  const {data:order}=await db.from("marketplace_orders").select("id,item_id,buyer_id,amount_vnd,status").eq("id",orderId).eq("buyer_id",user.id).maybeSingle();
  if(!order||order.status!=="paid")return {ok:false,error:"Order payment has not been confirmed by webhook."};
  const {data:item}=await db.from("marketplace_items").select("title,project_id,item_type").eq("id",order.item_id).maybeSingle();
  if(!item?.project_id)return {ok:false,error:"Template source is missing."};
  const {data:pages}=await db.from("published_pages").select("path,ui_tree").eq("project_id",item.project_id).eq("is_live",true).limit(25);
  if(!pages?.length||pages.some(p=>!validateUiTree(p.ui_tree)))return {ok:false,error:"Creator has not delivered a valid published project."};
  const {data:project,error:created}=await db.from("projects").insert({owner_id:user.id,name:item.title.slice(0,100),kind:["website","app","game"].includes(item.item_type)?item.item_type:"website"}).select("id").single();
  if(created||!project)return {ok:false,error:"Unable to deliver project."};
  const clone=(nodes:BuilderNode[]):BuilderNode[]=>nodes.map(n=>({...n,id:crypto.randomUUID(),props:{...n.props},style:{...n.style},children:clone(n.children)}));
  const {error:copyErr}=await db.from("pages").insert(pages.map(p=>({project_id:project.id,path:p.path,ui_tree:clone(p.ui_tree)})));
  if(copyErr){await db.from("projects").delete().eq("id",project.id);return {ok:false,error:"Project delivery failed."};}
  const admin=privilegedSupabase();
  const {data:updated,error:markError}=await admin.from("marketplace_orders").update({status:"delivered",delivered_at:new Date().toISOString()}).eq("id",order.id).eq("buyer_id",user.id).eq("status","paid").select("id").maybeSingle();
  if(markError||!updated)return {ok:false,error:"Order delivery recorded unsuccessfully; contact support with project ID "+project.id};
  await admin.from("marketplace_ledger").upsert({order_id:order.id,entry_type:"receipt",amount_vnd:Number(order.amount_vnd)},{onConflict:"order_id,entry_type"});
  return {ok:true,id:project.id};
 }catch{return {ok:false,error:"Unable to complete delivery."};}
}
export async function reviewMarketplaceItem(itemId:string,rating:number,comment:string):Promise<{ok:boolean;error?:string}>{
 if(!uuid.test(itemId)||!Number.isInteger(rating)||rating<1||rating>5||comment.length>2000)return {ok:false,error:"Invalid review."};
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return {ok:false,error:"Sign in."};
 const {data:order}=await db.from("marketplace_orders").select("id").eq("item_id",itemId).eq("buyer_id",user.id).in("status",["delivered","released"]).limit(1).maybeSingle();
 if(!order)return {ok:false,error:"Only verified buyers can review this item."};
 const {error}=await db.from("marketplace_reviews").upsert({item_id:itemId,reviewer_id:user.id,rating,comment},{onConflict:"item_id,reviewer_id"});
 return error?{ok:false,error:error.message}:{ok:true};
}
