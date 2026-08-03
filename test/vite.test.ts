import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/system/command.js";
import { templatesDirectory } from "../src/system/paths.js";
import {
  getBundledViteTemplates,
  getCreateViteVersion,
  getSupportedViteTemplates,
  pnpBootstrapArgs,
  resolveViteTemplate,
  scaffoldWithCreateVite,
} from "../src/vite/create-vite.js";

const require = createRequire(import.meta.url);

vi.mock("../src/system/command.js", () => ({
  runCommand: vi.fn(),
}));

describe("pinned create-vite", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    // The process may itself be running under Yarn PnP (with NODE_OPTIONS set),
    // which would otherwise prefix the args with PnP bootstrap flags (see
    // pnpBootstrapArgs below) and make this exact-match assertion environment
    // dependent. Pin it to "no PnP bootstrap" so the argv contract is exact.
    vi.stubEnv("NODE_OPTIONS", "");

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
      env: undefined,
      quiet: undefined,
      unsetEnv: ["NODE_OPTIONS"],
    });
  });

  it("keeps the create-vite template picker but skips starting the dev server", () => {
    vi.stubEnv("NODE_OPTIONS", "");

    scaffoldWithCreateVite("/tmp/my-app");

    expect(runCommand).toHaveBeenCalledWith({
      args: [
        expect.stringContaining(path.join("create-vite", "index.js")),
        "my-app",
        "--no-immediate",
      ],
      command: process.execPath,
      cwd: "/tmp",
      env: undefined,
      quiet: undefined,
      unsetEnv: ["NODE_OPTIONS"],
    });
  });

  it("prefixes argv with the Yarn PnP bootstrap flags derived from NODE_OPTIONS", () => {
    vi.stubEnv(
      "NODE_OPTIONS",
      "--require /project/.pnp.cjs --experimental-loader file:///project/.pnp.loader.mjs",
    );

    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    const call = vi.mocked(runCommand).mock.calls.at(-1)?.[0];
    expect(call?.args?.slice(0, 4)).toEqual([
      "--require",
      "/project/.pnp.cjs",
      "--experimental-loader",
      "file:///project/.pnp.loader.mjs",
    ]);
  });

  it("synthesizes npm_config_user_agent when the selected package manager differs from the invoked one", () => {
    vi.stubEnv("npm_config_pm", "");
    vi.stubEnv("npm_config_user_agent", "npm/9.0.0");
    vi.stubEnv("npm_execpath", "");

    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { packageManager: "pnpm" });

    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        env: { npm_config_user_agent: "pnpm/0.0.0" },
      }),
    );
  });

  it("preserves the real npm_config_user_agent when it already matches the selected package manager", () => {
    vi.stubEnv("npm_config_pm", "");
    vi.stubEnv("npm_config_user_agent", "yarn/1.22.19");
    vi.stubEnv("npm_execpath", "");

    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { packageManager: "yarn" });

    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        env: undefined,
      }),
    );
  });

  it("synthesizes npm_config_user_agent when no invoking package manager can be detected", () => {
    vi.stubEnv("npm_config_pm", "");
    vi.stubEnv("npm_config_user_agent", "");
    vi.stubEnv("npm_execpath", "");
    vi.stubEnv("PNPM_PACKAGE_NAME", "");
    vi.stubEnv("PNPM_STORE_PATH", "");

    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { packageManager: "pnpm" });

    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        env: { npm_config_user_agent: "pnpm/0.0.0" },
      }),
    );
  });

  it("passes the quiet option through to runCommand", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { quiet: true });

    expect(runCommand).toHaveBeenCalledWith(expect.objectContaining({ quiet: true }));
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

describe("pnpBootstrapArgs", () => {
  it("returns no argv when NODE_OPTIONS is unset", () => {
    expect(pnpBootstrapArgs(undefined)).toEqual([]);
    expect(pnpBootstrapArgs("")).toEqual([]);
  });

  it("returns no argv when NODE_OPTIONS carries unrelated flags", () => {
    expect(pnpBootstrapArgs("--max-old-space-size=4096")).toEqual([]);
  });

  it("extracts a space-separated --require .pnp.cjs flag", () => {
    expect(pnpBootstrapArgs("--require /project/.pnp.cjs")).toEqual([
      "--require",
      "/project/.pnp.cjs",
    ]);
  });

  it("extracts an =-joined --require=.pnp.cjs flag", () => {
    expect(pnpBootstrapArgs("--require=/project/.pnp.cjs")).toEqual([
      "--require",
      "/project/.pnp.cjs",
    ]);
  });

  it("extracts a space-separated --experimental-loader file:// URL", () => {
    expect(pnpBootstrapArgs("--experimental-loader file:///project/.pnp.loader.mjs")).toEqual([
      "--experimental-loader",
      "file:///project/.pnp.loader.mjs",
    ]);
  });

  it("extracts an =-joined --experimental-loader file:// URL", () => {
    expect(pnpBootstrapArgs("--experimental-loader=file:///project/.pnp.loader.mjs")).toEqual([
      "--experimental-loader",
      "file:///project/.pnp.loader.mjs",
    ]);
  });

  it("extracts both flags in a fixed require-then-loader order regardless of source order", () => {
    expect(
      pnpBootstrapArgs(
        "--experimental-loader file:///project/.pnp.loader.mjs --require /project/.pnp.cjs",
      ),
    ).toEqual([
      "--require",
      "/project/.pnp.cjs",
      "--experimental-loader",
      "file:///project/.pnp.loader.mjs",
    ]);
  });

  it("ignores --require flags that do not point at a .pnp.cjs file", () => {
    expect(pnpBootstrapArgs("--require /project/other-preload.cjs")).toEqual([]);
  });
});

describe("create-vite package manager guidance", () => {
  const temporaryDirectories = new Set<string>();

  afterEach(() => {
    for (const directory of temporaryDirectories) {
      rmSync(directory, { force: true, recursive: true });
    }
    temporaryDirectories.clear();
  });

  it("reflects npm_config_user_agent in its own console guidance", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "create-ait-vite-contract-"));
    temporaryDirectories.add(cwd);
    const entry = require.resolve("create-vite");

    const result = spawnSync(
      process.execPath,
      [entry, "contract-app", "--no-immediate", "--template", "vanilla-ts", "--no-interactive"],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, npm_config_user_agent: "pnpm/0.0.0" },
      },
    );

    expect(result.stdout).toContain("pnpm install");
    expect(result.stdout).toContain("pnpm dev");
  });
});
