import { describe, expect, it, vi } from "vitest";
import {
  aitInitCommand,
  assertConsoleAppName,
  formatAitInitCommand,
  runAitInit,
  toAitAppName,
  validateConsoleAppName,
} from "../src/apps-in-toss/ait-init.js";
import { runCommand } from "../src/system/command.js";

vi.mock("../src/system/command.js", () => ({
  runCommand: vi.fn(),
}));

describe("toAitAppName", () => {
  it("keeps kebab-case names as-is", () => {
    expect(toAitAppName("my-app")).toBe("my-app");
  });

  it("drops the npm scope", () => {
    expect(toAitAppName("@scope/my-app")).toBe("my-app");
  });

  it("replaces characters ait init rejects", () => {
    expect(toAitAppName("my.app_v2")).toBe("my-app-v2");
    expect(toAitAppName("._-")).toBe("my-app");
  });
});

describe("validateConsoleAppName", () => {
  it("accepts a compliant app name", () => {
    expect(validateConsoleAppName("hello-world")).toEqual([]);
  });

  it("rejects names containing 'toss'", () => {
    expect(validateConsoleAppName("hello-toss")).toEqual([
      '"toss"를 포함할 수 없어요 ("apps-in-toss"도 "toss"를 포함해서 걸려요).',
    ]);
  });

  it("rejects names containing 'apps-in-toss' via the same 'toss' substring check", () => {
    expect(validateConsoleAppName("my-apps-in-toss-app")).toEqual([
      '"toss"를 포함할 수 없어요 ("apps-in-toss"도 "toss"를 포함해서 걸려요).',
    ]);
  });

  it("rejects uppercase letters, underscores, and other disallowed characters", () => {
    expect(validateConsoleAppName("My_App")).toEqual([
      "영문 소문자·숫자·하이픈만 사용할 수 있고, 하이픈으로 시작하거나 끝날 수 없어요.",
    ]);
  });

  it("rejects a leading or trailing hyphen", () => {
    expect(validateConsoleAppName("-my-app")).toEqual([
      "영문 소문자·숫자·하이픈만 사용할 수 있고, 하이픈으로 시작하거나 끝날 수 없어요.",
    ]);
    expect(validateConsoleAppName("my-app-")).toEqual([
      "영문 소문자·숫자·하이픈만 사용할 수 있고, 하이픈으로 시작하거나 끝날 수 없어요.",
    ]);
  });

  it("rejects names longer than 63 characters", () => {
    const tooLong = `a${"b".repeat(63)}`;
    expect(validateConsoleAppName(tooLong)).toEqual(["63자를 넘을 수 없어요 (현재 64자)."]);
  });

  it("rejects an empty name", () => {
    expect(validateConsoleAppName("")).toEqual(["앱 이름이 비어 있어요."]);
  });

  it("collects multiple violations at once", () => {
    expect(validateConsoleAppName("My-Toss-App")).toEqual([
      "영문 소문자·숫자·하이픈만 사용할 수 있고, 하이픈으로 시작하거나 끝날 수 없어요.",
      '"toss"를 포함할 수 없어요 ("apps-in-toss"도 "toss"를 포함해서 걸려요).',
    ]);
  });
});

describe("assertConsoleAppName", () => {
  it("does not throw for a compliant name", () => {
    expect(() => assertConsoleAppName("hello-world")).not.toThrow();
  });

  it("throws a Korean, actionable error for a violating name", () => {
    expect(() => assertConsoleAppName("hello-toss")).toThrow(
      /"hello-toss".*앱인토스 콘솔 appName 규칙을 위반해요/s,
    );
  });
});

describe("aitInitCommand", () => {
  it("runs the local ait binary through each package manager", () => {
    expect(aitInitCommand("npm", "my-app")).toEqual({
      args: ["exec", "--", "ait", "init", "--app-name", "my-app", "--skip-input"],
      command: "npm",
    });
    expect(aitInitCommand("yarn", "my-app")).toEqual({
      args: ["run", "ait", "init", "--app-name", "my-app", "--skip-input"],
      command: "yarn",
    });
    expect(aitInitCommand("pnpm", "my-app")).toEqual({
      args: ["exec", "ait", "init", "--app-name", "my-app", "--skip-input"],
      command: "pnpm",
    });
  });
});

describe("formatAitInitCommand", () => {
  it("renders a copy-pasteable command", () => {
    expect(formatAitInitCommand("pnpm", "my-app")).toBe(
      "pnpm exec ait init --app-name my-app --skip-input",
    );
  });
});

describe("runAitInit", () => {
  it("does not leak an outer npm exec package into the nested npm exec", () => {
    expect(
      runAitInit({
        appName: "my-app",
        packageManager: "npm",
        targetDirectory: "/tmp/my-app",
      }),
    ).toBe(true);

    expect(runCommand).toHaveBeenCalledWith({
      args: ["exec", "--", "ait", "init", "--app-name", "my-app", "--skip-input"],
      command: "npm",
      cwd: "/tmp/my-app",
      env: { npm_config_user_agent: "npm/create-ait-app" },
      unsetEnv: ["NODE_OPTIONS", "npm_config_package"],
    });
  });
});
