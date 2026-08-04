import { describe, expect, it } from "vitest";
import {
  aitInitCommand,
  formatAitInitCommand,
  toAitAppName,
} from "../src/apps-in-toss/ait-init.js";

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
