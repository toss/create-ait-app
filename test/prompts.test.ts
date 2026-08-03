import { describe, expect, it } from "vitest";
import type { CliArgs } from "../src/cli/args.js";
import { choosePackageManager } from "../src/cli/prompts.js";

function baseArgs(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    _: [],
    help: false,
    inline: false,
    listTemplates: false,
    sample: [],
    skills: false,
    skipInstall: false,
    tds: false,
    ...overrides,
  };
}

describe("choosePackageManager", () => {
  it("prefers an explicit --pm over the preferred package manager", async () => {
    await expect(choosePackageManager(baseArgs({ pm: "npm" }), "pnpm")).resolves.toBe("npm");
  });

  it("uses the preferred package manager when --pm is not set", async () => {
    await expect(choosePackageManager(baseArgs(), "pnpm")).resolves.toBe("pnpm");
  });
});
