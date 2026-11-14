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
  define("text", "Văn bản", "basic", "text", "span"),
  define("heading", "Tiêu đề", "basic", "text", "h2"),
  define("h1", "Tiêu đề H1", "basic", "text", "h1"),
  define("h3", "Tiêu đề H3", "basic", "text", "h3"),
  define("h4", "Tiêu đề H4", "basic", "text", "h4"),
  define("paragraph", "Đoạn văn", "basic", "text", "p"),
  define("caption", "Chú thích", "basic", "text", "small"),
  define("label", "Nhãn", "basic", "text", "label"),
  define("badge", "Huy hiệu", "basic", "text", "span"),
  define("tag", "Thẻ nhãn", "basic", "text", "span"),
  define("button", "Nút bấm", "basic", "button", "button"),
  define("submit-button", "Nút gửi", "basic", "button", "button"),
  define("link", "Liên kết", "basic", "link", "a"),
  define("image", "Hình ảnh", "basic", "image", "img"),
  define("avatar", "Ảnh đại diện", "basic", "image", "img"),
  define("divider", "Đường phân cách", "basic", "divider", "hr"),
  define("spacer", "Khoảng trống", "basic", "divider", "div"),
  define("code", "Mã nguồn", "basic", "text", "code"),
  define("pre", "Khối mã", "basic", "text", "pre"),
  define("quote", "Trích dẫn", "basic", "text", "blockquote"),
  define("mark", "Đánh dấu", "basic", "text", "mark"),
  define("strong", "Chữ đậm", "basic", "text", "strong"),
  define("emphasis", "Nhấn mạnh", "basic", "text", "em"),
  define("list", "Danh sách", "basic", "list", "ul"),
  define("ordered-list", "Danh sách đánh số", "basic", "list", "ol"),
  define("container", "Vùng chứa", "layout", "container", "div", true),
  define("section", "Phân đoạn", "layout", "container", "section", true),
  define("row", "Hàng", "layout", "container", "div", true),
  define("column", "Cột", "layout", "container", "div", true),
  define("grid", "Lưới", "layout", "container", "div", true),
  define("flex", "Bố cục linh hoạt", "layout", "container", "div", true),
  define("stack", "Xếp chồng", "layout", "container", "div", true),
  define("card", "Thẻ nội dung", "layout", "container", "article", true),
  define("hero", "Khối giới thiệu", "layout", "container", "section", true),
  define("header", "Đầu trang", "layout", "container", "header", true),
  define("footer", "Chân trang", "layout", "container", "footer", true),
  define("navigation", "Điều hướng", "layout", "container", "nav", true),
  define("sidebar", "Thanh bên", "layout", "container", "aside", true),
  define("article", "Bài viết", "layout", "container", "article", true),
  define("main", "Nội dung chính", "layout", "container", "main", true),
  define("figure", "Minh họa", "layout", "container", "figure", true),
  define("form", "Biểu mẫu", "form", "container", "form", true),
  define("fieldset", "Nhóm trường", "form", "container", "fieldset", true),
  define("input", "Ô nhập liệu", "form", "input", "input"),
  define("email-input", "Ô nhập email", "form", "input", "input"),
  define("password-input", "Ô mật khẩu", "form", "input", "input"),
  define("number-input", "Ô nhập số", "form", "input", "input"),
  define("search-input", "Ô tìm kiếm", "form", "input", "input"),
  define("date-input", "Ô chọn ngày", "form", "input", "input"),
  define("time-input", "Ô chọn giờ", "form", "input", "input"),
  define("file-input", "Tải tệp lên", "form", "input", "input"),
  define("textarea", "Vùng nhập văn bản", "form", "textarea", "textarea"),
  define("select", "Hộp chọn", "form", "select", "select"),
  define("checkbox", "Ô đánh dấu", "form", "checkbox", "input"),
  define("radio", "Chọn một", "form", "checkbox", "input"),
  define("toggle", "Công tắc", "form", "checkbox", "input"),
  define("slider", "Thanh trượt", "form", "range", "input"),
  define("range", "Thanh khoảng giá trị", "form", "range", "input"),
  define("progress", "Tiến trình", "data", "progress", "progress"),
  define("meter", "Thước đo", "data", "progress", "meter"),
  define("table", "Bảng dữ liệu", "data", "table", "table"),
  define("chart", "Biểu đồ", "data", "chart", "div"),
  define("bar-chart", "Biểu đồ cột", "data", "chart", "div"),
  define("stats", "Thống kê", "data", "text", "output"),
  define("output", "Kết quả", "data", "text", "output"),
  define("video", "Video", "media", "video", "video"),
  define("audio", "Âm thanh", "media", "audio", "audio"),
  define("embed", "Nội dung nhúng", "media", "iframe", "iframe"),
  define("iframe", "Khung nhúng", "media", "iframe", "iframe"),
  define("gallery", "Bộ sưu tập", "media", "container", "div", true),
  define("picture", "Khung hình", "media", "container", "picture", true),
  define("details", "Chi tiết mở rộng", "layout", "container", "details", true),
  define("dialog-shell", "Khung hộp thoại", "layout", "container", "div", true),
  define("toolbar", "Thanh công cụ", "layout", "container", "div", true),
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
