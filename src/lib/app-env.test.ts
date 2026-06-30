import { describe, expect, it } from "vitest";
import {
  assertProductionRoutineRequiresProduction,
  assertStagingFixturesNotInProduction,
  parseAppEnv,
  productionRoutineAllowed,
  stagingFixturesAllowed,
} from "./app-env";

describe("APP_ENV", () => {
  it("aceita staging", () => {
    expect(parseAppEnv("staging")).toBe("staging");
    expect(stagingFixturesAllowed("staging")).toBe(true);
  });

  it("rejeita valor inválido", () => {
    expect(() => parseAppEnv("homologacao")).toThrow();
    expect(() => parseAppEnv(undefined)).toThrow();
  });

  it("produção não permite fixture staging", () => {
    expect(stagingFixturesAllowed("production")).toBe(false);
    expect(() => assertStagingFixturesNotInProduction("production")).toThrow(
      /Fixtures de staging bloqueadas/,
    );
  });

  it("staging não permite rotina de produção", () => {
    expect(productionRoutineAllowed("staging")).toBe(false);
    expect(() => assertProductionRoutineRequiresProduction("staging")).toThrow(
      /Rotinas de produção exigem APP_ENV=production/,
    );
  });
});
