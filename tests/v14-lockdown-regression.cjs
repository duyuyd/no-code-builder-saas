const fs=require("node:fs"),assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const pkg=JSON.parse(read("package.json"));
for(const group of ["dependencies","devDependencies"]){
 for(const [name,version] of Object.entries(pkg[group]))
  assert.match(version,/^(?![~^*><])[^\s]+$/,"Dependency must be exactly pinned: "+name);
}
for(const name of ["remotion","@remotion/player","@remotion/web-renderer","@remotion/bundler","@remotion/renderer"])
 assert.equal(pkg.dependencies[name],"4.0.543","Remotion package mismatch: "+name);
for(const name of ["figma-api","@figma/rest-api-spec"]){
 assert.ok(pkg.dependencies[name]||pkg.devDependencies[name],"Missing "+name);
}
const bridge=read("lib/unified-chai-bridge.ts");
assert.match(bridge,/export function migrateToChai\(tree:BuilderNode\[\]\)/);
assert.match(bridge,/validateUiTree\(tree\)/);
assert.match(read("components/chaibuilder/UnifiedChaiEditor.tsx"),/migrateToChai\(initialNodes\)/);
assert.match(read("app/builder/page.tsx"),/query\.mode==="inspect"/);
const figma=read("app/api/figma/route.ts");
assert.match(figma,/X-Founder-OTP/);
assert.match(figma,/OTP-FOUNDER-999/);
assert.match(figma,/response\.status===401\|\|response\.status===403/);
assert.match(figma,/savePageTree/);
assert.match(figma,/owner_id/);
assert.match(read("components/studio/FigmaPageImporter.tsx"),/figmaToken/);
const video=read("app/api/render-video/route.ts");
assert.match(video,/renderMedia/);
assert.match(video,/selectComposition/);
assert.match(video,/video\/mp4/);
assert.match(video,/durationInFrames!==450/);
assert.match(read("scripts/remotion-entry.tsx"),/durationInFrames=\{450\}/);
assert.match(read("components/video/NuvoraVideoStudio.tsx"),/durationInFrames=\{450\}/);
const forms=read("app/api/create-table/route.ts");
assert.match(forms,/extractFormSchemas/);
assert.match(forms,/owner_id/);
assert.match(forms,/ensure_nuvora_form/);
assert.match(forms,/private_forms/);
assert.match(read("components/chaibuilder/FormDatabasePanel.tsx"),/Tạo bảng Database/);
for(const file of ["app/api/figma/route.ts","app/api/render-video/route.ts","app/api/create-table/route.ts"]){
 const content=read(file);
 assert.doesNotMatch(content,/\bTODO\b|Not implemented|return null|<div>Mock<\/div>/i);
}
console.log("PASS v14 dependency lock, Chai migration, Figma 401, Remotion 15s, and form DDL contracts");
