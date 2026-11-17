export type FieldType = "text" | "textarea" | "url" | "color" | "number" | "boolean" | "select";
export type ComponentCategory = "basic" | "layout" | "form" | "media" | "data" | "commerce";
export type RenderKind = "text" | "button" | "link" | "image" | "video" | "audio" | "divider" | "input" | "textarea" | "select" | "checkbox" | "range" | "table" | "chart" | "progress" | "list" | "iframe" | "container" | "quiz" | "memory";
export type FieldSchema = { label: string; type: FieldType; defaultValue: string; options?: readonly string[] };
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

const field = (label: string, type: FieldType, defaultValue = "", options?: readonly string[]): FieldSchema => ({ label, type, defaultValue, options });
const propsByKind: Record<RenderKind, Record<string, FieldSchema>> = {
  text: { text: field("Nội dung", "textarea", "Nội dung") },
  button: { text: field("Nhãn nút", "text", "Nút bấm"), href: field("Liên kết khi nhấn (/trang hoặc URL)", "text", "") },
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
  container: { label: field("Nhãn vùng chứa", "text"), recipientEmail: field("Email nhận biểu mẫu", "text", "") },
  quiz: { title: field("Tên trò chơi", "text", "Trắc nghiệm"), questions: field("Mỗi dòng: câu hỏi|A|B|C|D|đáp án (1-4)", "textarea", "") },
  memory: { title: field("Tên game", "text", "Lật thẻ trí nhớ"), symbols: field("Biểu tượng ghép cặp, ngăn bằng |", "textarea", "🎮|🚀|💎|🌙|⚡|🎯"), pairCount: field("Số cặp (3-10)", "number", "6") },
};
const baseStyles = {
  color: field("Màu chữ", "color", "#1e293b"),
  backgroundColor: field("Màu nền", "color", "#ffffff"),
  fontSize: field("Cỡ chữ (px)", "number", "16"),
  padding: field("Padding (px)", "number", "12"),
  borderRadius: field("Bo góc (px)", "number", "8"),
  gap: field("Khoảng cách (px)", "number", "8"),
  gridColumns: field("Số cột trong lưới", "number", "2"),
  textAlign: field("Căn chữ", "select", "left", ["left","center","right"]),
  justifyContent: field("Phân bố khối", "select", "start", ["start","center","end","space-between"]),
  alignItems: field("Căn khối", "select", "stretch", ["stretch","start","center","end"]),
  widthPct: field("Rộng (% - 0 tự động)", "number", "0"),
  borderWidth: field("Viền (px)", "number", "0"),
  borderColor: field("Màu viền", "color", "#e2e8f0"),
  fontWeight: field("Độ đậm", "select", "normal", ["normal","semibold","bold"]),
  shadow: field("Đổ bóng", "select", "none", ["none","sm","md","lg"]),
};
function define(type: string, label: string, category: ComponentCategory, kind: RenderKind, tag = "div", allowsChildren = false): ComponentDefinition {
  return {
    type, label, category, kind, tag, allowsChildren,
    propsSchema: Object.fromEntries(Object.entries(propsByKind[kind]).map(([k,v]) => [k, {...v}])),
    styleSchema: Object.fromEntries(Object.entries(baseStyles).map(([k,v]) => [k, {...v}])),
  };
}

function commerceDefine(type:string,label:string):ComponentDefinition{
 const def=define(type,label,"commerce","container","section",true);
 def.propsSchema={
  productName:field("Tên sản phẩm","text",""),
  priceVnd:field("Giá VND","number","1000"),
  imageUrl:field("Ảnh HTTPS","url",""),
  description:field("Mô tả","textarea",""),
  buttonText:field("Nhãn mua hàng","text","Mua ngay"),
  catalogId:field("ID sản phẩm (tự động)","text","")
 };
 return def;
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
  define("quiz", "Trắc nghiệm tương tác", "data", "quiz", "div"),
  define("memory", "Game lật thẻ trí nhớ", "data", "memory", "div"),
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
  define("announcement", "Thông báo nổi", "basic", "text", "aside", false),
  define("alert", "Cảnh báo", "basic", "text", "div", false),
  define("price-label", "Nhãn giá bán", "basic", "text", "span", false),
  define("discount-badge", "Giảm giá", "basic", "text", "span", false),
  define("rating-badge", "Đánh giá sao", "basic", "text", "span", false),
  define("breadcrumb", "Đường dẫn phân cấp", "basic", "text", "nav", false),
  define("eyebrow", "Chữ dẫn tiêu đề", "basic", "text", "span", false),
  define("subtitle", "Tiêu đề phụ", "basic", "text", "h3", false),
  define("cta-button", "Nút hành động CTA", "basic", "button", "button", false),
  define("outline-button", "Nút viền", "basic", "button", "button", false),
  define("download-link", "Liên kết tải xuống", "basic", "link", "a", false),
  define("feature-grid", "Lưới tính năng", "layout", "container", "div", true),
  commerceDefine("product-grid", "Lưới sản phẩm"),
  commerceDefine("product-card","Thẻ sản phẩm"),
  commerceDefine("cart","Giỏ hàng"),
  commerceDefine("checkout-form","Biểu mẫu thanh toán"),
  define("portfolio-grid", "Lưới dự án", "layout", "container", "div", true),
  define("game-hud", "HUD trò chơi", "layout", "container", "section", true),
  define("game-menu", "Menu game", "layout", "container", "nav", true),
  define("game-inventory", "Túi đồ nhân vật", "layout", "container", "section", true),
  define("quest-board", "Bảng nhiệm vụ RPG", "layout", "container", "section", true),
  define("team-lineup", "Đội hình bóng đá", "layout", "container", "section", true),
  define("match-scoreboard", "Bảng tỉ số", "layout", "container", "section", true),
  define("fashion-lookbook", "Lookbook thời trang", "layout", "container", "section", true),
  define("mobile-navigation", "Thanh điều hướng mobile", "layout", "container", "nav", true),
  define("pricing-grid", "Bảng gói giá", "layout", "container", "section", true),
  define("testimonial-panel", "Khách hàng nhận xét", "layout", "container", "section", true),
  define("faq-panel", "Khối câu hỏi FAQ", "layout", "container", "section", true),
  define("dashboard-panel", "Dashboard", "layout", "container", "section", true),
  define("login-panel", "Khối đăng nhập", "layout", "container", "section", true),
  define("landing-banner", "Banner landing page", "layout", "container", "section", true),
  define("contact-form", "Form liên hệ", "form", "container", "form", true),
  define("newsletter-form", "Form đăng ký tin", "form", "container", "form", true),
  define("phone-input", "Ô số điện thoại", "form", "input", "input", false),
  define("currency-input", "Ô tiền tệ", "form", "input", "input", false),
  define("fashion-photo", "Ảnh thời trang", "media", "image", "img", false),
  define("product-photo", "Ảnh sản phẩm", "media", "image", "img", false),
  define("character-sprite", "Sprite nhân vật", "media", "image", "img", false),
  define("background-scene", "Ảnh bối cảnh game", "media", "image", "img", false),
  define("video-hero", "Video giới thiệu", "media", "video", "video", false),
  define("game-audio", "Âm thanh game", "media", "audio", "audio", false),
  define("icon-grid", "Bộ sưu tập icon", "media", "container", "div", true),
  define("fashion-gallery", "Bộ sưu tập thời trang", "media", "container", "div", true),
  define("inventory-list", "Danh sách vật phẩm", "data", "list", "ul", false),
  define("match-fixtures", "Lịch thi đấu", "data", "table", "table", false),
  define("sales-report", "Bảng doanh thu", "data", "table", "table", false),
  define("player-stats", "Thống kê nhân vật", "data", "chart", "div", false),
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
          if (schema[key].type === "select" && schema[key].options && !schema[key].options.includes(val)) return false;
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
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^#[a-z][a-z0-9_-]*$/i.test(url)) return url;
  try { const parsed = new URL(url); if (["https:", "http:", "mailto:"].includes(parsed.protocol)) return url; } catch { /* invalid */ }
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
    textAlign: ["left","center","right"].includes(s.textAlign??"") ? s.textAlign : "left",
    fontWeight: s.fontWeight==="bold" ? 700 : s.fontWeight==="semibold" ? 600 : 400,
    borderWidth: sanitizeNumeric(s.borderWidth??"", 0, 0, 12),
    borderColor: SAFE_HEX.test(s.borderColor??"") ? s.borderColor : "#e2e8f0",
    borderStyle: sanitizeNumeric(s.borderWidth??"", 0, 0, 12) > 0 ? "solid" : "none",
  };
  const shadows: Record<string,string>={sm:"0 2px 6px rgba(15,23,42,.08)",md:"0 8px 16px rgba(15,23,42,.12)",lg:"0 20px 38px rgba(15,23,42,.2)"};
  if(s.shadow && shadows[s.shadow])css.boxShadow=shadows[s.shadow];
  const width=sanitizeNumeric(s.widthPct??"",0,0,100);
  if(width>0)css.width=width+"%";
  if (def?.allowsChildren) {
    const align=s.alignItems??"stretch";
    css.alignItems=["stretch","start","center","end"].includes(align) ? (align==="start"?"flex-start":align==="end"?"flex-end":align) : "stretch";
    const justify=s.justifyContent??"start";
    css.justifyContent=["start","center","end","space-between"].includes(justify) ? (justify==="start"?"flex-start":justify==="end"?"flex-end":justify) : "flex-start";
  }
  if (def?.allowsChildren) {
    css.display = node.type === "grid" || node.type.endsWith("-grid") ? "grid" : "flex";
    css.flexDirection = node.type === "row" || node.type === "flex" || node.type === "navigation" || node.type === "toolbar" ? "row" : "column";
    if (node.type === "grid" || node.type.endsWith("-grid")) css.gridTemplateColumns = "repeat("+sanitizeNumeric(s.gridColumns??"",2,1,6)+", minmax(0,1fr))";
    css.gap = sanitizeNumeric(s.gap ?? "", 8, 0, 200);
    if (css.flexDirection === "row") css.flexWrap = "wrap";
  }
  return css;
}
