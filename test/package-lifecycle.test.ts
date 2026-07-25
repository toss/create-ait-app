import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

describe("package lifecycle", () => {
  it("keeps build and pack from recursively invoking each other", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string | undefined>;
    };
    const tsdownConfig = readFileSync(path.join(repositoryRoot, "tsdown.config.ts"), "utf8");
    const entrySource = readFileSync(path.join(repositoryRoot, "src", "index.ts"), "utf8");

    expect(packageJson.scripts.build).toBe("tsdown");
    expect(packageJson.scripts.prepack).toBeUndefined();
    expect(packageJson.scripts.prepare).toBeUndefined();
    expect(packageJson.scripts.prepublishOnly).toBeUndefined();
    expect(packageJson.scripts.release).toBeUndefined();
    expect(packageJson.scripts["release:beta"]).toBeUndefined();
    expect(packageJson.scripts["release:rc"]).toBeUndefined();
    expect(entrySource).toBe('#!/usr/bin/env node\n\nimport "./cli.js";\n');
    expect(tsdownConfig).toContain('cli: "src/index.ts"');
    expect(tsdownConfig).not.toMatch(/\bindex\s*:/);
    expect(tsdownConfig).toContain("dts: false");
    expect(tsdownConfig).not.toMatch(/\bpublint\s*:/);
  });
});
