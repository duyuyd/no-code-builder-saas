const fs=require("node:fs");
const assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
for(const file of ["components/CanvasNode.tsx","components/BuilderCanvas.tsx","components/BuilderWorkspace.tsx"]){
 assert.equal(fs.existsSync(file),false,"obsolete canvas file must be deleted: "+file);
 console.log("DELETED "+file);
}
const builder=fs.readFileSync("app/builder/page.tsx","utf8");
const chai=fs.readFileSync("components/chaibuilder/UnifiedChaiEditor.tsx","utf8");
assert.match(builder,/query\.mode==="inspect"\s*\?\s*<LegacyTreeInspector/);
assert.match(builder,/<UnifiedChaiEditor/);
assert.doesNotMatch(builder,/import BuilderWorkspace/);
assert.match(chai,/migrateToChai\(initialNodes\)/);
assert.match(chai,/mode=inspect/);
console.log("CHAIBUILDER_PRIMARY=PASS");
console.log("SAVED_JSON_INSPECTOR=PASS");
for(const phrase of ["No"+"-Code Builder","NPT Duy"+" Studio"]){
 const result=spawnSync("git",["grep","-n","-F",phrase,"--",":!tests/v15-execution-proof.cjs"],{encoding:"utf8"});
 if(result.error)throw result.error;
 if(result.status!==1){
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  throw Error("Retired brand found or grep failed: "+phrase+" (status "+result.status+")");
 }
 console.log("GREP_ZERO_MATCHES="+JSON.stringify(phrase));
}
console.log("PASS v15 - legacy canvas deleted, Chai is primary, no retired brand matches.");
