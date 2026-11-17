const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const filename = "packages/engine-4d/src/index.ts";
const source = fs.readFileSync(filename, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict: true },
  fileName: filename,
  reportDiagnostics: true
});
const diagnostics = transpiled.diagnostics || [];
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
 getCanonicalFileName: x => x, getCurrentDirectory: () => process.cwd(), getNewLine: () => "\n"
}));
const exports = {};
vm.runInNewContext(transpiled.outputText, { exports, require, Map, Set, Error, TypeError });
const { evaluateTimeline, validateTimeline } = exports;
const timeline = {
 schemaVersion: 1, durationMs: 1000,
 keyframes: [
  { id: "a", objectId: "cube", path: "position.x", timeMs: 0, value: 0, interpolation: "linear" },
  { id: "b", objectId: "cube", path: "position.x", timeMs: 1000, value: 10, interpolation: "linear" },
  { id: "c", objectId: "cube", path: "rotation.y", timeMs: 0, value: 0, interpolation: "step" },
  { id: "d", objectId: "cube", path: "rotation.y", timeMs: 1000, value: 2, interpolation: "linear" }
 ]
};
assert.equal(validateTimeline(timeline), true);
assert.equal(evaluateTimeline(timeline, 500)["cube:position.x"], 5);
assert.equal(evaluateTimeline(timeline, -100)["cube:position.x"], 0);
assert.equal(evaluateTimeline(timeline, 1100)["cube:position.x"], 10);
assert.equal(evaluateTimeline(timeline, 500)["cube:rotation.y"], 0);
assert.equal(evaluateTimeline(timeline, 1000)["cube:rotation.y"], 2);
assert.equal(validateTimeline({...timeline, keyframes: [...timeline.keyframes, {...timeline.keyframes[0], value: Infinity}]}), false);
assert.throws(() => evaluateTimeline(timeline, Number.NaN), /Invalid time/);
console.log("Timeline runtime regression tests passed.");
