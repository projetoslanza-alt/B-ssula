import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { getReturnPath, isSafeReturnPath, withReturnPath } from "@/lib/navigation-utils";

describe("navigation-utils", () => {
  it("rejeita return externo", () => {
    expect(isSafeReturnPath("https://evil.com")).toBe(false);
    expect(isSafeReturnPath("/chamados")).toBe(true);
  });

  it("anexa return seguro", () => {
    expect(withReturnPath("/chamados/tk1", "/chamados?status=open")).toContain("return=%2Fchamados");
  });

  it("lê return de searchParams", () => {
    expect(getReturnPath({ return: "/inicio" })).toBe("/inicio");
    expect(getReturnPath({ return: "//evil" })).toBeNull();
  });
});

describe("breadcrumbs", () => {
  it("gera trilha para chamado", () => {
    const crumbs = buildBreadcrumbs("/chamados/tk1", { tk1: "CH-2026-0042" });
    expect(crumbs.at(-1)?.label).toBe("CH-2026-0042");
    expect(crumbs.some((c) => c.label === "Chamados" && c.href)).toBe(true);
  });
});
