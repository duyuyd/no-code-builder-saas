import {test,expect,type Page,type TestInfo} from "@playwright/test";

const projectId=process.env.E2E_PROJECT_ID;
const pageId=process.env.E2E_PAGE_ID;
const email=process.env.E2E_LOGIN_EMAIL;
const password=process.env.E2E_LOGIN_PASSWORD;
const missing=[
 ["E2E_LOGIN_EMAIL",email],["E2E_LOGIN_PASSWORD",password],
 ["E2E_PROJECT_ID",projectId],["E2E_PAGE_ID",pageId]
].filter(([,value])=>!value).map(([name])=>name);
const authenticatedConfigured=missing.length===0;
let seq=0;
async function capture(page:Page,info:TestInfo,label:string){
 const filename=String(++seq).padStart(2,"0")+"-"+label+".png";
 const path=info.outputPath(filename);
 await page.screenshot({path,fullPage:true,animations:"disabled"});
 await info.attach(label,{path,contentType:"image/png"});
}

test("public production: real homepage, founder marker, protected builder",async({page},info)=>{
 const result=await page.goto("/",{waitUntil:"domcontentloaded"});
 expect(result?.status(),"Production homepage HTTP status").toBe(200);
 await expect(page.locator("body")).toContainText("OTP-FOUNDER-999");
 await capture(page,info,"production-home");
 const check=await page.request.post("/api/figma",{
  data:{figmaUrl:"https://www.figma.com/design/ABCDEFGH/demo",figmaToken:"invalid",
   projectId:"00000000-0000-0000-0000-000000000000",
   pageId:"00000000-0000-0000-0000-000000000000"}
 });
 expect(check.status()).toBe(401);
 expect(check.headers()["x-founder-otp"]).toBe("OTP-FOUNDER-999");
 await page.goto("/builder",{waitUntil:"domcontentloaded"});
 await expect(page).toHaveURL(/\/login(?:\?|$)/);
 await capture(page,info,"builder-auth-required");
});

test("signed-in production E2E: create Form table, import feedback and submit published Form",async({page},info)=>{
 test.skip(!authenticatedConfigured,
  "Not executed: protected production E2E requires "+missing.join(", ")+" in a dedicated test account, project and saved Form.");
 await page.goto("/login",{waitUntil:"domcontentloaded"});
 await capture(page,info,"login-before");
 await page.locator("#account-email").fill(email!);
 await page.locator("#account-password").fill(password!);
 await page.getByRole("button",{name:/Đăng nhập vào Studio/}).click();
 await expect(page).toHaveURL(/\/dashboard(?:\?|$)/,{timeout:30000});
 await capture(page,info,"signed-in-dashboard");
 const url="/builder?project="+encodeURIComponent(projectId!)+"&page="+encodeURIComponent(pageId!);
 await page.goto(url,{waitUntil:"domcontentloaded"});
 await expect(page.getByText("ChaiBuilder",{exact:false}).first()).toBeVisible({timeout:30000});
 await capture(page,info,"chai-builder-open");
 await page.getByText("Form Database",{exact:true}).click();
 await capture(page,info,"form-database-panel");
 const button=page.getByTestId("create-database-table");
 await expect(button,"A real Form with input fields must exist on the saved page").toBeVisible();
 await button.click();
 await expect(page.getByTestId("api-toast")).toContainText("Tạo bảng thành công",{timeout:30000});
 await capture(page,info,"postgres-table-created");

 await page.getByText("Import Figma",{exact:true}).click();
 await page.getByLabel("Liên kết Figma").fill("https://www.figma.com/design/ABCDEFGH/e2e-read-only");
 await page.getByLabel("Figma Personal Access Token").fill("deliberately-invalid-e2e-token");
 await page.getByTestId("figma-import-submit").click();
 await expect(page.getByTestId("api-toast")).toContainText("Lỗi",{timeout:30000});
 await capture(page,info,"figma-invalid-token-toast");

 await page.goto("/s/"+encodeURIComponent(projectId!),{waitUntil:"domcontentloaded"});
 const form=page.locator("main form").first();
 await expect(form,"The E2E project must have an actually published Form on its home path").toBeVisible({timeout:30000});
 await capture(page,info,"published-form-open");
 const fields=form.locator("input:not([type=hidden]),textarea,select");
 const count=await fields.count();
 expect(count,"Saved published Form must expose editable fields").toBeGreaterThan(0);
 for(let i=0;i<count;i++){
  const field=fields.nth(i),tag=await field.evaluate(el=>el.tagName.toLowerCase());
  const kind=(await field.getAttribute("type")??"text").toLowerCase();
  if(tag==="select"){const values=await field.locator("option").evaluateAll(opts=>opts.map(o=>(o as HTMLOptionElement).value));if(values.length)await field.selectOption(values[0]);continue;}
  if(kind==="checkbox"){await field.check();continue;}
  if(kind==="radio"){await field.check();continue;}
  if(kind==="file")throw Error("E2E Form needs E2E file upload support; no test file will be fabricated");
  if(kind==="submit"||kind==="button"||kind==="range")continue;
  const value=kind==="email"?"nuvora-e2e@example.com":
   kind==="number"?"15":kind==="date"?"2026-11-19":kind==="time"?"12:00":
   "Nuvora E2E "+new Date().toISOString();
  await field.fill(value);
 }
 await capture(page,info,"published-form-filled");
 await form.getByRole("button",{name:/Submit|Gửi|Đăng ký|Liên hệ/i}).click();
 await expect(form).toContainText("Đã lưu thông tin thành công.",{timeout:30000});
 await capture(page,info,"form-submitted-success");
});
