const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

const out = mkdtempSync(path.join(tmpdir(), "studio-export-test-"));
try {
  execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "--target", "ES2022", "--module", "commonjs", "--skipLibCheck", "--outDir", out, "lib/code-generator.ts"], { stdio: "pipe" });
  const { createBuilderNode, safeUrl } = require(path.join(out, "component-registry.js"));
  const { generateHtmlCode, generateReactCode } = require(path.join(out, "code-generator.js"));
  const row = createBuilderNode("row");
  const card = createBuilderNode("card");
  card.style.widthPct = "33";
  row.children = [card];
  const memory = createBuilderNode("memory");
  const link = createBuilderNode("link");
  link.props.href = "/\\example.invalid";
  link.props.text = "<script>alert(1)</script>";
  const tree = [row, memory, link];
  const html = generateHtmlCode(tree);
  const react = generateReactCode(tree);
  assert.match(html, /class="studio-export-row"/);
  assert.match(react, /className="studio-export-row"/);
  assert.match(html, /@supports not \(container-type:inline-size\)/);
  assert.match(react, /@supports not \(container-type:inline-size\)/);
  assert.match(html, /data-memory=/, "HTML memory game must include its interactive runtime target");
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.equal(safeUrl("/\\example.invalid"), "");
  assert.equal(safeUrl("//example.invalid"), "");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("/danh-muc"), "/danh-muc");
  console.log("PASS: responsive exports, interactive memory markup and safe URLs");
} finally {
  rmSync(out, { recursive: true, force: true });
}
