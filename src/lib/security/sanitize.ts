import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
  "pre", "code", "span", "div", "hr", "sub", "sup",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel", "src", "alt", "width", "height", "class",
  "colspan", "rowspan",
];

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer");
    const href = node.getAttribute("href") ?? "";
    if (href.toLowerCase().startsWith("javascript:")) {
      node.removeAttribute("href");
    }
  }
  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") ?? "";
    if (src.toLowerCase().startsWith("javascript:")) {
      node.removeAttribute("src");
    }
  }
});

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty?.trim()) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
  });
}
