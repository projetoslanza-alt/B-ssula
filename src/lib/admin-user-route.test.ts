import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { platformRoutes } from "@/lib/routes";

describe("rota de detalhe de usuário — consistência com App Router", () => {
  it("platformRoutes.admin.user gera /administracao/usuarios/{id}", () => {
    expect(platformRoutes.admin.user("abc-123")).toBe("/administracao/usuarios/abc-123");
  });

  it("a rota base da listagem aponta para /administracao/usuarios", () => {
    expect(platformRoutes.admin.users).toBe("/administracao/usuarios");
  });

  it("o segmento dinâmico [userId] existe no App Router", () => {
    const dir = resolve(
      process.cwd(),
      "src/app/(platform)/administracao/usuarios/[userId]/page.tsx",
    );
    expect(existsSync(dir)).toBe(true);
  });

  it("o parâmetro dinâmico chama-se userId (mesmo nome usado pela query)", () => {
    // platformRoutes.admin.user(userId) preenche o segmento [userId]
    const generated = platformRoutes.admin.user("membership-42");
    expect(generated.startsWith(platformRoutes.admin.users + "/")).toBe(true);
    expect(generated.split("/").pop()).toBe("membership-42");
  });
});
