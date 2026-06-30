import { describe, expect, it } from "vitest";
import { PLATFORM_MODULES, filterNavItems } from "@/lib/navigation";
import { collectNavHrefs } from "@/lib/routes";

describe("navigation registry", () => {
  it("menu links apontam para rotas conhecidas", () => {
    const known = new Set(collectNavHrefs());
    for (const mod of PLATFORM_MODULES) {
      expect(known.has(mod.href)).toBe(true);
      for (const item of mod.items) {
        expect(known.has(item.href)).toBe(true);
        expect(item.href).not.toBe("#");
        expect(item.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("filtra itens por permissão do aluno", () => {
    const studentPerms = ["learning.catalog.read", "learning.progress.read_own", "support.view", "support.ticket.create"];
    const crmItems = filterNavItems(
      PLATFORM_MODULES.find((m) => m.id === "crm")!.items,
      studentPerms,
    );
    expect(crmItems).toHaveLength(0);
    const learningItems = filterNavItems(
      PLATFORM_MODULES.find((m) => m.id === "learning")!.items,
      studentPerms,
    );
    expect(learningItems.length).toBeGreaterThan(0);
  });
});
