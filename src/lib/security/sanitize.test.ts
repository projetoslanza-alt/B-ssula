import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitize";

describe("sanitizeHtml", () => {
  it("remove scripts", () => {
    const result = sanitizeHtml('<p>Ok</p><script>alert(1)</script>');
    expect(result).not.toContain("script");
    expect(result).toContain("Ok");
  });

  it("remove handlers em img", () => {
    const result = sanitizeHtml('<img src=x onerror=alert(1)>');
    expect(result).not.toContain("onerror");
  });

  it("remove javascript: em links", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">Abrir</a>');
    expect(result).not.toContain("javascript:");
  });

  it("remove iframes", () => {
    const result = sanitizeHtml('<iframe src="https://evil.com"></iframe><p>Texto</p>');
    expect(result).not.toContain("iframe");
    expect(result).toContain("Texto");
  });

  it("preserva HTML legítimo", () => {
    const input = "<h2>Título</h2><p>Parágrafo com <strong>negrito</strong>.</p><ul><li>Item</li></ul>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<strong>negrito</strong>");
    expect(result).toContain("<li>Item</li>");
  });

  it("adiciona rel em links", () => {
    const result = sanitizeHtml('<a href="https://example.com">Link</a>');
    expect(result).toContain('rel="noopener noreferrer"');
  });
});
