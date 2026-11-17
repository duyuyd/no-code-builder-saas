const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const source=fs.readFileSync("lib/npc-behavior.ts","utf8");
const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
const exportsObj={};
vm.runInNewContext(result.outputText,{exports:exportsObj,Set,TypeError});
const {validateNpcBehavior,compileNpcBehavior}=exportsObj;
const graph={schemaVersion:1,initialState:"patrol",states:[{id:"patrol",action:"patrol"},{id:"combat",action:"attack"},{id:"flee",action:"retreat"}],
 transitions:[{from:"patrol",to:"combat",event:"enemy_seen"},{from:"combat",to:"patrol",event:"enemy_lost"},{from:"combat",to:"flee",event:"low_health"}]};
assert.equal(validateNpcBehavior(graph),true);
assert.equal(validateNpcBehavior({...graph,states:[{id:"bad",action:"exec"}]}),false);
assert.equal(validateNpcBehavior({...graph,transitions:[{from:"patrol",to:"hacked",event:"enemy_seen"}]}),false);
assert.throws(()=>compileNpcBehavior({...graph,initialState:"unknown"}),/Invalid/);
const code=compileNpcBehavior(graph);
(async()=>{
 const runtime=await import("data:text/javascript,"+encodeURIComponent(code));
 let npc=runtime.createNpc();
 assert.equal(npc.state,"patrol");
 npc=runtime.stepNpc(npc,"enemy_seen");
 assert.equal(npc.state,"combat");
 assert.equal(npc.action,"attack");
 npc=runtime.stepNpc(npc,"low_health");
 assert.equal(npc.state,"flee");
 assert.equal(npc.action,"retreat");
 console.log("NPC production state graph regression passed");
})().catch(e=>{console.error(e);process.exitCode=1});
