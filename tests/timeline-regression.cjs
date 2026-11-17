const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("packages/engine-4d/src/index.ts","utf8");
assert.match(source, /export function evaluateTimeline/);
assert.match(source, /export function validateTimeline/);
assert.match(source, /interpolation === "step"/);
console.log("Timeline source contract checks OK; compile/runtime tests required before release.");
