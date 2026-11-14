const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

async function main() {
 const out = mkdtempSync(path.join(tmpdir(), "studio-ai-test-"));
 try {
  execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "--target", "ES2022", "--module", "commonjs", "--skipLibCheck", "--outDir", out, "lib/studio-ai.ts"], { stdio: "pipe" });
  const { askProvider, readAiConfig } = require(path.join(out, "studio-ai.js"));
  process.env.ORCAROUTER_API_KEY = "test-placeholder";
  const config = readAiConfig({ enabled:true, provider:"orcarouter", model:"orcarouter/free" });
  let request;
  global.fetch = async (url, options) => {
   request = { url, body: JSON.parse(options.body) };
   return new Response(JSON.stringify({ choices:[{message:{content:"Kết nối hoạt động"}}] }), { status:200, headers:{"content-type":"application/json"} });
  };
  const answer = await askProvider(config, "Kiểm tra", [{role:"user",content:"Alo"}]);
  assert.equal(answer, "Kết nối hoạt động");
  assert.equal(request.url, "https://api.orcarouter.ai/v1/chat/completions");
  assert.equal(request.body.model, "orcarouter/free");
  await assert.rejects(() => askProvider({...config,model:"paid/model"}, "", []), /miễn phí/);
  global.fetch = async () => new Response("", {status:401});
  await assert.rejects(() => askProvider(config, "", []), /API key/);
  console.log("PASS: free model request, response parsing and provider error handling");
 } finally {
  delete process.env.ORCAROUTER_API_KEY;
  rmSync(out, {recursive:true,force:true});
 }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
