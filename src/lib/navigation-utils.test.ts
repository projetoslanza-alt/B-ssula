import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { getReturnPath, isSafeReturnPath, withReturnPath } from "@/lib/navigation-utils";

describe("navigation-utils", () => {
  it("rejeita return externo", () => {
    expect(isSafeReturnPath("https://evil.com")).toBe(false);
    expect(isSafeReturnPath("/crm/oportunidades")).toBe(true);
  });

  it("anexa return seguro", () => {
    expect(withReturnPath("/crm/oportunidades/123", "/crm/oportunidades?status=open")).toContain("return=%2Fcrm%2Foportunidades");
  });

  it("lê return de searchParams", () => {
    expect(getReturnPath({ return: "/inicio" })).toBe("/inicio");
    expect(getReturnPath({ return: "//evil" })).toBeNull();
  });
});

describe("breadcrumbs", () => {
  it("gera trilha para oportunidade", () => {
    const crumbs = buildBreadcrumbs("/crm/oportunidades/abc-123", { "abc-123": "Clínica Horizonte" });
    expect(crumbs.at(-1)?.label).toBe("Clínica Horizonte");
    expect(crumbs.some((c) => c.label === "Oportunidades" && c.href)).toBe(true);
  });
});
