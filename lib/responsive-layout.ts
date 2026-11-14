/** Classes stay consistent between the editor, published pages and exports. */
export function responsiveLayoutClass(type: string, prefix: "studio-responsive" | "studio-export"): string {
  if (type === "grid" || type.endsWith("-grid")) return `${prefix}-grid`;
  if (type === "row" || type === "flex") return `${prefix}-row`;
  return "";
}

// The media-query fallback covers browsers without container-query support.
const mobileRules = `.studio-export-grid{grid-template-columns:minmax(0,1fr)!important}.studio-export-grid>*,.studio-export-row>*{min-width:0;max-width:100%;overflow-wrap:anywhere}.studio-export-row{flex-wrap:wrap!important}.studio-export-row>*{flex:1 1 min(100%,15rem)!important;width:auto!important}`;
export const EXPORT_RESPONSIVE_CSS = `@container (max-width:620px){${mobileRules}}@supports not (container-type:inline-size){@media (max-width:620px){${mobileRules}}}`;
