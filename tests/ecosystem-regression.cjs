const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript"),crypto=require("node:crypto");
function load(path,aliases={}){
 const code=fs.readFileSync(path,"utf8");
 const out=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 new Function("require","exports","module","crypto",out)((id)=>id in aliases?aliases[id]:require(id),module.exports,module,crypto.webcrypto);
 return module.exports;
}
const registry=load("lib/component-registry.ts");
for(const type of ["product-card","product-grid","cart","checkout-form","plugin-slot"]){
 const def=registry.getDefinition(type);
 assert.ok(def,"Missing commerce/plugin component: "+type);
 assert.ok(registry.validateUiTree([registry.createBuilderNode(type)]));
}
const manifests=load("lib/plugins/manifest.ts",{"@/lib/component-registry":registry});
const valid={name:"Creator plugin",version:"1.0.0",description:"Custom heading",
 component:{label:"Heading",nodes:[registry.createBuilderNode("heading")]},transform:{operation:"uppercase"}};
assert.ok(manifests.validatePluginManifest(valid));
assert.equal(manifests.validatePluginManifest({...valid,component:{label:"Danger",nodes:[registry.createBuilderNode("iframe")]}}),false);
assert.equal(manifests.validatePluginManifest({...valid,version:"untrusted"}),false);
const payos=load("lib/payments/payos.ts",{"server-only":{}});
process.env.PAYOS_CHECKSUM_KEY="unit-test-key-not-real";
const data={orderCode:123456789,amount:10000,currency:"VND",reference:"TEST"};
const signature=payos.signPayOsObject(data,process.env.PAYOS_CHECKSUM_KEY);
assert.equal(signature.length,64);
assert.ok(payos.verifyPayOsWebhook({code:"00",success:true,data,signature}));
assert.equal(payos.verifyPayOsWebhook({code:"00",success:true,data:{...data,amount:1},signature}),false);
delete process.env.PAYOS_CHECKSUM_KEY;
for(const file of ["app/screenshot-to-app/page.tsx","app/screenshot-to-app/actions.ts",
 "app/api/checkout/route.ts","app/api/checkout/webhook/route.ts",
 "app/marketplace/page.tsx","app/api/domain/add/route.ts","app/api/plugins/install/route.ts",
 "app/app-runtime/page.tsx","app/blog/page.tsx","app/blog/[slug]/page.tsx","app/sitemap.ts"]){
 assert.ok(fs.existsSync(file),file+" missing");
}
const rls=fs.readFileSync("supabase/migrations/20261117_god_tier_ecosystem.sql","utf8");
for(const name of ["products","commerce_orders","marketplace_items","marketplace_orders","marketplace_reviews","marketplace_ledger","studio_plugins","blog_posts"]){
 assert.ok(rls.includes("alter table public."+name+" enable row level security"),"Missing RLS "+name);
}
assert.ok(fs.readFileSync("app/api/cron/blog/route.ts","utf8").includes("AUTO_BLOG_ENABLED"));
assert.ok(fs.readFileSync("app/api/plugins/install/route.ts","utf8").includes("validatePluginManifest"));
assert.ok(fs.readFileSync("lib/tenant-branding.ts","utf8").includes("domain_status"));
console.log("Ecosystem component, signed webhook, plugin isolation, RLS, routes and gated cron regressions passed");
