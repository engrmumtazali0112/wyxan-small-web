import DOMPurify from "dompurify";
import { ADDRESS_RE } from "./address";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote", "pre",
  "a", "abbr", "b", "strong", "i", "em", "u", "s", "small", "sub", "sup",
  "mark", "code", "kbd", "samp", "cite", "q", "time", "span",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td",
  "div", "section", "article", "header", "footer", "nav", "main", "aside",
  "figure", "figcaption", "details", "summary",
];

const COLOR = /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|[a-z]{3,20})$/i;
const STYLE_RULES: Record<string, RegExp> = {
  color: COLOR,
  "background-color": COLOR,
  "text-align": /^(left|right|center|justify)$/,
  "font-weight": /^(normal|bold|[1-9]00)$/,
  "font-style": /^(normal|italic)$/,
  "text-decoration": /^(none|underline|line-through)$/,
};

function cleanStyle(value: string): string {
  return value
    .split(";")
    .map((d) => d.trim())
    .filter((d) => {
      const i = d.indexOf(":");
      if (i < 1) return false;
      const rule = STYLE_RULES[d.slice(0, i).trim().toLowerCase()];
      return !!rule && rule.test(d.slice(i + 1).trim());
    })
    .join("; ");
}

let hooked = false;

export function sanitizeClient(html: string): string {
  // DOMPurify requires a browser environment
  if (typeof window === "undefined") return html;

  if (!hooked) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (!(node instanceof Element)) return;
      const style = node.getAttribute("style");
      if (style === null) return;
      const kept = cleanStyle(style);
      if (kept) node.setAttribute("style", kept);
      else node.removeAttribute("style");
    });
    hooked = true;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title", "lang", "style"],
    ALLOWED_URI_REGEXP: ADDRESS_RE,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}