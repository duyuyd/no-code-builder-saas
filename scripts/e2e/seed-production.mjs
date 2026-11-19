import {createClient} from "@supabase/supabase-js";
import {randomBytes} from "node:crypto";
import {appendFileSync} from "node:fs";

const SUPABASE_URL=process.env.E2E_SUPABASE_URL;
const SERVICE_ROLE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const environmentFile=process.env.GITHUB_ENV;
if(!SUPABASE_URL||!SERVICE_ROLE_KEY||!environmentFile){
 throw new Error("Missing E2E_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or GITHUB_ENV: cannot create real test account");
}
const host=new URL(SUPABASE_URL);
if(host.protocol!=="https:"||!host.hostname.endsWith(".supabase.co"))
 throw new Error("E2E_SUPABASE_URL is not a valid HTTPS Supabase endpoint");
const runTag=(process.env.GITHUB_RUN_ID??"local").replace(/[^0-9a-z]/gi,"").slice(0,24);
const suffix=randomBytes(6).toString("hex");
const email=`nuvoracraft-e2e-${runTag}-${suffix}@example.com`;
const password=`E2e-${randomBytes(32).toString("base64url")}!a9`;
console.log("::add-mask::"+password);
console.log("::add-mask::"+email);
const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const {data:created,error:userError}=await admin.auth.admin.createUser({
 email,password,email_confirm:true,
 app_metadata:{nuvoracraft_e2e:true},
 user_metadata:{display_name:"NuvoraCraft E2E verification"}
});
if(userError||!created.user?.id)throw new Error("Supabase Admin createUser failed: "+(userError?.message??"missing user id"));
const ownerId=created.user.id;
const formNodeId="e2e_form_"+suffix;
const emailNodeId="e2e_email_"+suffix;
const sendNodeId="e2e_send_"+suffix;
const tree=[{
 id:formNodeId,type:"form",props:{},style:{},children:[
  {id:emailNodeId,type:"email-input",props:{name:"email",placeholder:"Email"},style:{},children:[]},
  {id:sendNodeId,type:"submit-button",props:{text:"Gửi"},style:{},children:[]}
 ]
}];
const {data:project,error:projectError}=await admin.from("projects").insert({
 owner_id:ownerId,name:"NuvoraCraft E2E "+suffix,kind:"website"
}).select("id").single();
if(projectError||!project?.id)throw new Error("E2E project creation failed: "+(projectError?.message??"missing id"));
const {data:page,error:pageError}=await admin.from("pages").insert({
 project_id:project.id,path:"/",ui_tree:tree
}).select("id,ui_tree").single();
if(pageError||!page?.id)throw new Error("E2E saved Form page creation failed: "+(pageError?.message??"missing id"));
const {data:published,error:publishedError}=await admin.from("published_pages").insert({
 project_id:project.id,path:"/",ui_tree:tree,site_title:"NuvoraCraft E2E "+suffix,is_live:true
}).select("project_id,path").single();
if(publishedError||!published)throw new Error("E2E public Form publish failed: "+(publishedError?.message??"missing published page"));
const {data:verified,error:verifyError}=await admin.from("pages").select("id,ui_tree").eq("id",page.id).eq("project_id",project.id).single();
if(verifyError||!verified||verified.ui_tree?.[0]?.id!==formNodeId)
 throw new Error("Real Supabase Form fixture could not be read back");
for(const [key,value] of Object.entries({
 E2E_LOGIN_EMAIL:email,
 E2E_LOGIN_PASSWORD:password,
 E2E_PROJECT_ID:String(project.id),
 E2E_PAGE_ID:String(page.id)
})){
 appendFileSync(environmentFile,`${key}=${value}\n`,{mode:0o600});
}
console.log(JSON.stringify({fixture:"created-and-verified",auth_user_created:true,project_id:project.id,page_id:page.id,published_path:"/",form_node_id:formNodeId,source:"supabase-admin-real-records"}));
