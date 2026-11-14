import type { BuilderNode } from "./component-registry";
import { getDefinition, nodeCss, safeUrl, sanitizeNumeric, validateUiTree } from "./component-registry";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const escapeJsx = (value: string) => escapeHtml(value).replace(/{/g, "&#123;").replace(/}/g, "&#125;");
const jsxAttr = (value: string) => `{${JSON.stringify(value)}}`;
const toCssName = (name: string) => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const styleHtml = (node: BuilderNode) => Object.entries(nodeCss(node))
  .map(([key, value]) => `${toCssName(key)}:${typeof value === "number" && !["opacity", "zIndex"].includes(key) ? `${value}px` : value}`).join(";");
const styleJsx = (node: BuilderNode) => JSON.stringify(nodeCss(node));
const csvRows = (value: string): string[][] => value.split(/\r?\n/).filter(Boolean).slice(0, 100)
  .map(line => line.split(",").slice(0, 40));
const values = (value: string) => value.split(",").map(Number).filter(v => Number.isFinite(v) && v >= 0).slice(0, 50);
const inputType = (type: string) => {
  if (type === "email-input") return "email";
  if (type === "password-input") return "password";
  if (type === "number-input") return "number";
  if (type === "search-input") return "search";
  if (type === "date-input") return "date";
  if (type === "time-input") return "time";
  if (type === "file-input") return "file";
  return "text";
};

function nodeToHtml(node: BuilderNode): string {
  const def = getDefinition(node.type);
  if (!def) return "";
  const p = node.props;
  const style = ` style="${escapeHtml(styleHtml(node))}"`;
  switch (def.kind) {
    case "image": return `<img${style} src="${escapeHtml(safeUrl(p.src ?? ""))}" alt="${escapeHtml(p.alt ?? "")}" />`;
    case "link": return `<a${style} href="${escapeHtml(safeUrl(p.href ?? "") || "#")}">${escapeHtml(p.text ?? "")}</a>`;
    case "video":
    case "audio": return `<${def.tag}${style} controls src="${escapeHtml(safeUrl(p.src ?? ""))}"></${def.tag}>`;
    case "divider": return def.tag === "hr" ? `<hr${style} />` : `<div${style}></div>`;
    case "input": return `<input${style} type="${inputType(node.type)}" name="${escapeHtml(p.name ?? "")}" placeholder="${escapeHtml(p.placeholder ?? "")}" />`;
    case "textarea": return `<textarea${style} name="${escapeHtml(p.name ?? "")}" placeholder="${escapeHtml(p.placeholder ?? "")}"></textarea>`;
    case "select": return `<select${style} name="${escapeHtml(p.name ?? "")}">${(p.options ?? "").split(/\r?\n/).filter(Boolean).map(v => `<option>${escapeHtml(v)}</option>`).join("")}</select>`;
    case "checkbox": return `<label${style}><input type="${node.type === "radio" ? "radio" : "checkbox"}" ${p.checked === "true" ? "checked " : ""}/>${escapeHtml(p.text ?? "")}</label>`;
    case "range": return `<input${style} type="range" min="${sanitizeNumeric(p.min ?? "", 0)}" max="${sanitizeNumeric(p.max ?? "", 100)}" />`;
    case "progress": {
      const tag = def.tag;
      return `<${tag}${style} value="${sanitizeNumeric(p.value ?? "", 0)}" max="${sanitizeNumeric(p.max ?? "", 100, 1, 10000)}"></${tag}>`;
    }
    case "table": {
      const rows = csvRows(p.csv ?? "");
      return `<table${style}>${rows.map((row, i) => `<tr>${row.map(cell => `<${i === 0 ? "th" : "td"}>${escapeHtml(cell)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>`;
    }
    case "chart": {
      const vals = values(p.values ?? ""); const max = Math.max(1, ...vals);
      return `<div${style} role="img" aria-label="Bar chart">${vals.map(v => `<div style="display:inline-block;vertical-align:bottom;background:currentColor;margin:2px;width:18px;height:${Math.round(v / max * 160)}px"></div>`).join("")}</div>`;
    }
    case "list": return `<${def.tag}${style}>${(p.items ?? "").split(/\r?\n/).filter(Boolean).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</${def.tag}>`;
    case "iframe": return `<iframe${style} src="${escapeHtml(safeUrl(p.src ?? ""))}" title="${escapeHtml(p.title ?? "")}" sandbox="allow-scripts allow-forms" loading="lazy"></iframe>`;
    case "container": return `<${def.tag}${style}>${node.children.map(nodeToHtml).join("\n")}</${def.tag}>`;
    case "button": return p.href && safeUrl(p.href) ? `<a${style} href="${escapeHtml(safeUrl(p.href))}">${escapeHtml(p.text ?? "")}</a>` : `<button type="${node.type === "submit-button" ? "submit" : "button"}"${style}>${escapeHtml(p.text ?? "")}</button>`;
    case "text": return `<${def.tag}${style}>${escapeHtml(p.text ?? "")}</${def.tag}>`;
  }
}
function nodeToJsx(node: BuilderNode): string {
  const def = getDefinition(node.type);
  if (!def) return "";
  const p = node.props;
  const style = ` style={${styleJsx(node)}}`;
  switch (def.kind) {
    case "image": return `<img${style} src=${jsxAttr(safeUrl(p.src ?? ""))} alt=${jsxAttr(p.alt ?? "")} />`;
    case "link": return `<a${style} href=${jsxAttr(safeUrl(p.href ?? "") || "#")}>${escapeJsx(p.text ?? "")}</a>`;
    case "video":
    case "audio": return `<${def.tag}${style} controls src=${jsxAttr(safeUrl(p.src ?? ""))} />`;
    case "divider": return def.tag === "hr" ? `<hr${style} />` : `<div${style} />`;
    case "input": return `<input${style} type=${jsxAttr(inputType(node.type))} name=${jsxAttr(p.name ?? "")} placeholder=${jsxAttr(p.placeholder ?? "")} />`;
    case "textarea": return `<textarea${style} name=${jsxAttr(p.name ?? "")} placeholder=${jsxAttr(p.placeholder ?? "")} />`;
    case "select": return `<select${style} name=${jsxAttr(p.name ?? "")}>${(p.options ?? "").split(/\r?\n/).filter(Boolean).map(v => `<option key=${jsxAttr(v)}>${escapeJsx(v)}</option>`).join("")}</select>`;
    case "checkbox": return `<label${style}><input type=${jsxAttr(node.type === "radio" ? "radio" : "checkbox")} defaultChecked={${p.checked === "true"}} />${escapeJsx(p.text ?? "")}</label>`;
    case "range": return `<input${style} type="range" min={${sanitizeNumeric(p.min ?? "", 0)}} max={${sanitizeNumeric(p.max ?? "", 100)}} />`;
    case "progress": return `<${def.tag}${style} value={${sanitizeNumeric(p.value ?? "", 0)}} max={${sanitizeNumeric(p.max ?? "", 100, 1, 10000)}} />`;
    case "table": return `<table${style}><tbody>${csvRows(p.csv ?? "").map((row,i) => `<tr key={${i}}>${row.map((cell,j) => `<${i === 0 ? "th" : "td"} key={${j}}>${escapeJsx(cell)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</tbody></table>`;
    case "chart": {
      const vals = values(p.values ?? ""); const max = Math.max(1, ...vals);
      return `<div${style} role="img" aria-label="Bar chart">${vals.map((v,i) => `<div key={${i}} style={{ display: "inline-block", verticalAlign: "bottom", background: "currentColor", margin: 2, width: 18, height: ${Math.round(v/max*160)} }} />`).join("")}</div>`;
    }
    case "list": return `<${def.tag}${style}>${(p.items ?? "").split(/\r?\n/).filter(Boolean).map((v,i) => `<li key={${i}}>${escapeJsx(v)}</li>`).join("")}</${def.tag}>`;
    case "iframe": return `<iframe${style} src=${jsxAttr(safeUrl(p.src ?? ""))} title=${jsxAttr(p.title ?? "")} sandbox="allow-scripts allow-forms" loading="lazy" />`;
    case "container": return `<${def.tag}${style}>${node.children.map(nodeToJsx).join("\n")}</${def.tag}>`;
    case "button": return p.href && safeUrl(p.href) ? `<a${style} href=${jsxAttr(safeUrl(p.href))}>${escapeJsx(p.text ?? "")}</a>` : `<button type="${node.type === "submit-button" ? "submit" : "button"}"${style}>${escapeJsx(p.text ?? "")}</button>`;
    case "text": return `<${def.tag}${style}>${escapeJsx(p.text ?? "")}</${def.tag}>`;
  }
}
export function generateReactCode(uiTree: BuilderNode[]): string {
  if (!validateUiTree(uiTree)) throw new Error("Invalid UI Tree");
  return `import type { CSSProperties } from "react";\n\nexport default function GeneratedPage() {\n  return (\n    <main>\n${uiTree.map(nodeToJsx).join("\n")}\n    </main>\n  );\n}\n`;
}
export function generateHtmlCode(uiTree: BuilderNode[], title = "Exported Page"): string {
  if (!validateUiTree(uiTree)) throw new Error("Invalid UI Tree");
  return `<!doctype html>\n<html lang="vi">\n<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(title)}</title></head>\n<body>\n${uiTree.map(nodeToHtml).join("\n")}\n</body>\n</html>\n`;
}
