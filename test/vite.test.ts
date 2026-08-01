import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/system/command.js";
import { templatesDirectory } from "../src/system/paths.js";
import {
  getBundledViteTemplates,
  getCreateViteVersion,
  getSupportedViteTemplates,
  resolveViteTemplate,
  scaffoldWithCreateVite,
} from "../src/vite/create-vite.js";

const require = createRequire(import.meta.url);

vi.mock("../src/system/command.js", () => ({
  runCommand: vi.fn(),
}));

describe("pinned create-vite", () => {
  it("uses an exact version and discovers its bundled templates", () => {
    expect(getCreateViteVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(getBundledViteTemplates()).toEqual(
      expect.arrayContaining(["vanilla", "react-ts", "vue-ts", "svelte-ts", "solid-ts"]),
    );
    expect(getSupportedViteTemplates()).toEqual(
      expect.arrayContaining(["qwik", "react-ts", "vue-ts", "svelte-ts", "solid-ts"]),
    );
    expect(getBundledViteTemplates()).toEqual(expect.arrayContaining(getSupportedViteTemplates()));
  });

  it("keeps the TDS template _gitignore identical to the react-ts preset", () => {
    const createViteRoot = path.dirname(require.resolve("create-vite"));

    expect(
      readFileSync(path.join(templatesDirectory, "projects", "react-ts-tds", "_gitignore"), "utf8"),
    ).toBe(readFileSync(path.join(createViteRoot, "template-react-ts", "_gitignore"), "utf8"));
  });

  it("keeps backward-compatible vanilla aliases", () => {
    expect(resolveViteTemplate("js")).toBe("vanilla");
    expect(resolveViteTemplate("ts")).toBe("vanilla-ts");
    expect(resolveViteTemplate("qwik-ts")).toBe("qwik-ts");
  });

  it("never lets create-vite install dependencies or start the dev server", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    expect(runCommand).toHaveBeenCalledWith({
      args: [
        expect.stringContaining(path.join("create-vite", "index.js")),
        "my-app",
        "--no-immediate",
        "--template",
        "react-ts",
        "--no-interactive",
      ],
      command: process.execPath,
      cwd: "/tmp",
    });
  });

  it("keeps the create-vite template picker but skips starting the dev server", () => {
    scaffoldWithCreateVite("/tmp/my-app");

    expect(runCommand).toHaveBeenCalledWith({
      args: [
        expect.stringContaining(path.join("create-vite", "index.js")),
        "my-app",
        "--no-immediate",
      ],
      command: process.execPath,
      cwd: "/tmp",
    });
  });

  it("creates missing parent directories for nested project paths", () => {
    const root = mkdtempSync(path.join(tmpdir(), "create-ait-vite-parent-"));
    const targetDirectory = path.join(root, "nested", "my-app");

    try {
      scaffoldWithCreateVite(targetDirectory, "react-ts");
      expect(existsSync(path.dirname(targetDirectory))).toBe(true);
      expect(runCommand).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cwd: path.dirname(targetDirectory),
        }),
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
