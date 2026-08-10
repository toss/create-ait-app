import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/system/command.js";
import { templatesDirectory } from "../src/system/paths.js";
import {
  extractPnpBootstrapArgs,
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

// 이 저장소 자체가 Yarn PnP로 개발되어서, 테스트 실행 프로세스의
// NODE_OPTIONS에는 이미 실제 .pnp.cjs/.pnp.loader.mjs 훅이 들어 있어요.
// 대부분의 케이스는 그 훅이 섞여 들어오지 않는 결정적인 상태에서 검증해야
// 해서, 각 테스트 전후로 NODE_OPTIONS를 저장/복원해요.
const originalNodeOptions = process.env.NODE_OPTIONS;

beforeEach(() => {
  delete process.env.NODE_OPTIONS;
});

afterEach(() => {
  if (originalNodeOptions === undefined) {
    delete process.env.NODE_OPTIONS;
  } else {
    process.env.NODE_OPTIONS = originalNodeOptions;
  }
});

describe("extractPnpBootstrapArgs", () => {
  it("returns nothing when NODE_OPTIONS is unset or unrelated", () => {
    expect(extractPnpBootstrapArgs(undefined)).toEqual([]);
    expect(extractPnpBootstrapArgs("--max-old-space-size=4096")).toEqual([]);
  });

  it("extracts the Yarn PnP require hook", () => {
    expect(extractPnpBootstrapArgs("--require /repo/.pnp.cjs")).toEqual([
      "--require",
      "/repo/.pnp.cjs",
    ]);
  });

  it("extracts both the require and loader hooks Yarn injects together", () => {
    expect(
      extractPnpBootstrapArgs(
        "--require /repo/.pnp.cjs --experimental-loader file:///repo/.pnp.loader.mjs",
      ),
    ).toEqual([
      "--require",
      "/repo/.pnp.cjs",
      "--experimental-loader",
      "file:///repo/.pnp.loader.mjs",
    ]);
  });

  it("ignores unrelated flags mixed in with the PnP hooks", () => {
    expect(
      extractPnpBootstrapArgs(
        "--inspect --require /repo/.pnp.cjs --experimental-loader file:///repo/.pnp.loader.mjs --trace-warnings",
      ),
    ).toEqual([
      "--require",
      "/repo/.pnp.cjs",
      "--experimental-loader",
      "file:///repo/.pnp.loader.mjs",
    ]);
  });
});

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
      env: undefined,
      quiet: undefined,
      unsetEnv: ["NODE_OPTIONS"],
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
      env: undefined,
      quiet: undefined,
      unsetEnv: ["NODE_OPTIONS"],
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

  it("injects npm_config_user_agent so create-vite's guidance names the chosen package manager", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { packageManager: "pnpm" });

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        env: { npm_config_user_agent: "pnpm/0.0.0" },
      }),
    );
  });

  it("omits env injection when no package manager is given", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        env: undefined,
      }),
    );
  });

  it("always unsets NODE_OPTIONS so the invoking process's loader doesn't leak into create-vite", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        unsetEnv: ["NODE_OPTIONS"],
      }),
    );
  });

  it("re-injects the Yarn PnP hooks as argv before stripping NODE_OPTIONS from the env", () => {
    // require.resolve("create-vite")는 Yarn PnP에서 .zip 안의 가상 경로일 수
    // 있어서, unsetEnv로 NODE_OPTIONS를 지우기 전에 그 안의 PnP 훅만은
    // 명시적 인자로 되살려야 자식 node 프로세스가 그 경로를 읽을 수 있어요.
    process.env.NODE_OPTIONS =
      "--require /repo/.pnp.cjs --experimental-loader file:///repo/.pnp.loader.mjs";

    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          "--require",
          "/repo/.pnp.cjs",
          "--experimental-loader",
          "file:///repo/.pnp.loader.mjs",
          expect.stringContaining(path.join("create-vite", "index.js")),
          "my-app",
          "--no-immediate",
          "--template",
          "react-ts",
          "--no-interactive",
        ],
        unsetEnv: ["NODE_OPTIONS"],
      }),
    );
  });

  it("passes quiet through so --inline can suppress create-vite's own announcements", () => {
    scaffoldWithCreateVite("/tmp/my-app", "react-ts", { quiet: true });

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quiet: true,
      }),
    );

    scaffoldWithCreateVite("/tmp/my-app", "react-ts");

    expect(runCommand).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quiet: undefined,
      }),
    );
  });
});
