export type FieldType = "text" | "textarea" | "url" | "color" | "number" | "boolean";
export type ComponentCategory = "basic" | "layout" | "form" | "media" | "data";
export type RenderKind = "text" | "button" | "link" | "image" | "video" | "audio" | "divider" | "input" | "textarea" | "select" | "checkbox" | "range" | "table" | "chart" | "progress" | "list" | "iframe" | "container";
export type FieldSchema = { label: string; type: FieldType; defaultValue: string };
export type ComponentDefinition = {
  type: string;
  label: string;
  category: ComponentCategory;
  kind: RenderKind;
  tag: string;
  allowsChildren: boolean;
  propsSchema: Record<string, FieldSchema>;
  styleSchema: Record<string, FieldSchema>;
};
export type BuilderNode = {
  id: string;
  type: string;
  props: Record<string, string>;
  style: Record<string, string>;
  children: BuilderNode[];
};

const field = (label: string, type: FieldType, defaultValue = ""): FieldSchema => ({ label, type, defaultValue });
const propsByKind: Record<RenderKind, Record<string, FieldSchema>> = {
  text: { text: field("Nội dung", "textarea", "Nội dung") },
  button: { text: field("Nhãn nút", "text", "Nút bấm") },
  link: { text: field("Nhãn liên kết", "text", "Liên kết"), href: field("URL", "url") },
  image: { src: field("URL ảnh", "url"), alt: field("Mô tả ảnh", "text") },
  video: { src: field("URL video", "url") },
  audio: { src: field("URL âm thanh", "url") },
  divider: {},
  input: { placeholder: field("Placeholder", "text"), name: field("Tên trường", "text") },
  textarea: { placeholder: field("Placeholder", "text"), name: field("Tên trường", "text") },
  select: { options: field("Tùy chọn, mỗi dòng một mục", "textarea"), name: field("Tên trường", "text") },
  checkbox: { text: field("Nhãn", "text", "Đồng ý"), checked: field("Mặc định chọn", "boolean", "false") },
  range: { min: field("Tối thiểu", "number", "0"), max: field("Tối đa", "number", "100") },
  table: { csv: field("Dữ liệu CSV", "textarea") },
  chart: { values: field("Dữ liệu số, cách nhau bằng dấu phẩy", "textarea") },
  progress: { value: field("Giá trị", "number", "0"), max: field("Tổng", "number", "100") },
  list: { items: field("Một dòng cho mỗi mục", "textarea") },
  iframe: { src: field("URL nhúng", "url"), title: field("Tiêu đề", "text", "Embedded Content") },
  container: { label: field("Nhãn vùng chứa", "text") },
};
const baseStyles = {
  color: field("Màu chữ", "color", "#1e293b"),
  backgroundColor: field("Màu nền", "color", "#ffffff"),
  fontSize: field("Cỡ chữ (px)", "number", "16"),
  padding: field("Padding (px)", "number", "12"),
  borderRadius: field("Bo góc (px)", "number", "8"),
  gap: field("Khoảng cách (px)", "number", "8"),
};
function define(type: string, label: string, category: ComponentCategory, kind: RenderKind, tag = "div", allowsChildren = false): ComponentDefinition {
  return {
    type, label, category, kind, tag, allowsChildren,
    propsSchema: Object.fromEntries(Object.entries(propsByKind[kind]).map(([k,v]) => [k, {...v}])),
    styleSchema: Object.fromEntries(Object.entries(baseStyles).map(([k,v]) => [k, {...v}])),
  };
}

// Static component definitions, NOT fake application records.
// All user projects, pages, component values and styles live in Supabase.
export const COMPONENT_REGISTRY: readonly ComponentDefinition[] = [
  define("text", "Text", "basic", "text", "span"),
  define("heading", "Heading", "basic", "text", "h2"),
  define("h1", "Heading H1", "basic", "text", "h1"),
  define("h3", "Heading H3", "basic", "text", "h3"),
  define("h4", "Heading H4", "basic", "text", "h4"),
  define("paragraph", "Paragraph", "basic", "text", "p"),
  define("caption", "Caption", "basic", "text", "small"),
  define("label", "Label", "basic", "text", "label"),
  define("badge", "Badge", "basic", "text", "span"),
  define("tag", "Tag", "basic", "text", "span"),
  define("button", "Button", "basic", "button", "button"),
  define("submit-button", "Submit Button", "basic", "button", "button"),
  define("link", "Link", "basic", "link", "a"),
  define("image", "Image", "basic", "image", "img"),
  define("avatar", "Avatar", "basic", "image", "img"),
  define("divider", "Divider", "basic", "divider", "hr"),
  define("spacer", "Spacer", "basic", "divider", "div"),
  define("code", "Code", "basic", "text", "code"),
  define("pre", "Code Block", "basic", "text", "pre"),
  define("quote", "Quote", "basic", "text", "blockquote"),
  define("mark", "Highlight", "basic", "text", "mark"),
  define("strong", "Strong", "basic", "text", "strong"),
  define("emphasis", "Emphasis", "basic", "text", "em"),
  define("list", "List", "basic", "list", "ul"),
  define("ordered-list", "Ordered List", "basic", "list", "ol"),
  define("container", "Container", "layout", "container", "div", true),
  define("section", "Section", "layout", "container", "section", true),
  define("row", "Row", "layout", "container", "div", true),
  define("column", "Column", "layout", "container", "div", true),
  define("grid", "Grid", "layout", "container", "div", true),
  define("flex", "Flex", "layout", "container", "div", true),
  define("stack", "Stack", "layout", "container", "div", true),
  define("card", "Card", "layout", "container", "article", true),
  define("hero", "Hero", "layout", "container", "section", true),
  define("header", "Header", "layout", "container", "header", true),
  define("footer", "Footer", "layout", "container", "footer", true),
  define("navigation", "Navigation", "layout", "container", "nav", true),
  define("sidebar", "Sidebar", "layout", "container", "aside", true),
  define("article", "Article", "layout", "container", "article", true),
  define("main", "Main", "layout", "container", "main", true),
  define("figure", "Figure", "layout", "container", "figure", true),
  define("form", "Form", "form", "container", "form", true),
  define("fieldset", "Fieldset", "form", "container", "fieldset", true),
  define("input", "Input", "form", "input", "input"),
  define("email-input", "Email Input", "form", "input", "input"),
  define("password-input", "Password Input", "form", "input", "input"),
  define("number-input", "Number Input", "form", "input", "input"),
  define("search-input", "Search Input", "form", "input", "input"),
  define("date-input", "Date Input", "form", "input", "input"),
  define("time-input", "Time Input", "form", "input", "input"),
  define("file-input", "File Input", "form", "input", "input"),
  define("textarea", "Textarea", "form", "textarea", "textarea"),
  define("select", "Select", "form", "select", "select"),
  define("checkbox", "Checkbox", "form", "checkbox", "input"),
  define("radio", "Radio", "form", "checkbox", "input"),
  define("toggle", "Toggle", "form", "checkbox", "input"),
  define("slider", "Slider", "form", "range", "input"),
  define("range", "Range", "form", "range", "input"),
  define("progress", "Progress", "data", "progress", "progress"),
  define("meter", "Meter", "data", "progress", "meter"),
  define("table", "Table", "data", "table", "table"),
  define("chart", "Chart", "data", "chart", "div"),
  define("bar-chart", "Bar Chart", "data", "chart", "div"),
  define("stats", "Statistics", "data", "text", "output"),
  define("output", "Output", "data", "text", "output"),
  define("video", "Video", "media", "video", "video"),
  define("audio", "Audio", "media", "audio", "audio"),
  define("embed", "Embed", "media", "iframe", "iframe"),
  define("iframe", "IFrame", "media", "iframe", "iframe"),
  define("gallery", "Gallery", "media", "container", "div", true),
  define("picture", "Picture", "media", "container", "picture", true),
  define("details", "Details", "layout", "container", "details", true),
  define("dialog-shell", "Dialog Shell", "layout", "container", "div", true),
  define("toolbar", "Toolbar", "layout", "container", "div", true),
];

const REGISTRY_MAP = new Map(COMPONENT_REGISTRY.map((def) => [def.type, def]));
export function getDefinition(type: string): ComponentDefinition | undefined { return REGISTRY_MAP.get(type); }
export function createBuilderNode(type: string): BuilderNode {
  const def = getDefinition(type);
  if (!def) throw new Error(`Unknown component type: ${type}`);
  return {
    id: crypto.randomUUID(), type,
    props: Object.fromEntries(Object.entries(def.propsSchema).map(([key, field]) => [key, field.defaultValue])),
    style: Object.fromEntries(Object.entries(def.styleSchema).map(([key, field]) => [key, field.defaultValue])),
    children: [],
  };
}

const SAFE_HEX = /^#[0-9a-f]{6}$/i;
export function validateUiTree(value: unknown): value is BuilderNode[] {
  if (!Array.isArray(value)) return false;
  let count = 0;
  const walk = (nodes: unknown[], depth: number): boolean => {
    if (depth > 24) return false;
    for (const raw of nodes) {
      if (++count > 1500 || !raw || typeof raw !== "object") return false;
      const node = raw as Record<string, unknown>;
      if (typeof node.id !== "string" || node.id.length > 100 ||
          typeof node.type !== "string" || !getDefinition(node.type)) return false;
      for (const propKey of ["props", "style"] as const) {
        const obj = node[propKey];
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
        const def = getDefinition(node.type)!;
        const schema = propKey === "props" ? def.propsSchema : def.styleSchema;
        for (const [key, val] of Object.entries(obj)) {
          if (!(key in schema) || typeof val !== "string" || val.length > 12000) return false;
          if (schema[key].type === "color" && !SAFE_HEX.test(val)) return false;
          if (schema[key].type === "number" && (val.trim() !== "" && (!Number.isFinite(Number(val)) || Math.abs(Number(val)) > 10000))) return false;
        }
      }
      const def = getDefinition(node.type)!;
      if (!Array.isArray(node.children) || (!def.allowsChildren && node.children.length > 0)) return false;
      if (!walk(node.children, depth + 1)) return false;
    }
    return true;
  };
  if (!walk(value, 0)) return false;
  const ids = new Set<string>();
  function unique(nodes: BuilderNode[]): boolean {
    for (const node of nodes) {
      if (ids.has(node.id)) return false;
      ids.add(node.id);
      if (!unique(node.children)) return false;
    }
    return true;
  }
  return unique(value as BuilderNode[]);
}

export function safeUrl(value: string): string {
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try { const parsed = new URL(url); if (parsed.protocol === "https:" || parsed.protocol === "http:") return url; } catch { /* invalid */ }
  return "";
}
export function sanitizeNumeric(value: string, fallback: number, min = 0, max = 2000): number {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
export function nodeCss(node: BuilderNode): Record<string, string | number> {
  const s = node.style;
  const def = getDefinition(node.type);
  const css: Record<string, string | number> = {
    color: SAFE_HEX.test(s.color ?? "") ? s.color : "inherit",
    backgroundColor: SAFE_HEX.test(s.backgroundColor ?? "") ? s.backgroundColor : "transparent",
    fontSize: sanitizeNumeric(s.fontSize ?? "", 16, 8, 120),
    padding: sanitizeNumeric(s.padding ?? "", 0, 0, 200),
    borderRadius: sanitizeNumeric(s.borderRadius ?? "", 0, 0, 200),
  };
  if (def?.allowsChildren) {
    css.display = node.type === "grid" ? "grid" : "flex";
    css.flexDirection = node.type === "row" || node.type === "flex" || node.type === "navigation" || node.type === "toolbar" ? "row" : "column";
    if (node.type === "grid") css.gridTemplateColumns = "repeat(2, minmax(0,1fr))";
    css.gap = sanitizeNumeric(s.gap ?? "", 8, 0, 200);
  }
  return css;
}
