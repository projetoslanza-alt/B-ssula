import { describe, expect, it } from "vitest";
import { PLATFORM_MODULES, filterNavItems } from "@/lib/navigation";
import { collectNavHrefs } from "@/lib/routes";

describe("navigation registry", () => {
  it("menu links apontam para rotas conhecidas", () => {
    const known = new Set(collectNavHrefs());
    const basePath = (href: string) => href.split("?")[0];
    for (const mod of PLATFORM_MODULES) {
      expect(known.has(basePath(mod.href))).toBe(true);
      for (const item of mod.items) {
        expect(known.has(basePath(item.href))).toBe(true);
        expect(item.href).not.toBe("#");
        expect(item.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("filtra itens por permissão do aluno", () => {
    const studentPerms = ["learning.catalog.read", "learning.progress.read_own", "support.view", "support.ticket.create"];
    const dashboardsItems = filterNavItems(
      PLATFORM_MODULES.find((m) => m.id === "dashboards")!.items,
      studentPerms,
    );
    expect(dashboardsItems).toHaveLength(0);
    const learningItems = filterNavItems(
      PLATFORM_MODULES.find((m) => m.id === "learning")!.items,
      studentPerms,
    );
    expect(learningItems.length).toBeGreaterThan(0);
  });

  it("não inclui módulo CRM interno", () => {
    expect(PLATFORM_MODULES.find((m) => m.id === "crm")).toBeUndefined();
  });
});
