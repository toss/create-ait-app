import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { installProjectSkills } from "../src/skills/install-skills.js";
import { runCommand } from "../src/system/command.js";
import { packageRoot } from "../src/system/paths.js";

vi.mock("../src/system/command.js", () => ({
  runCommand: vi.fn(),
}));

const require = createRequire(import.meta.url);
const skillsCli = require.resolve("skills/bin/cli.mjs");

describe("installProjectSkills", () => {
  it("installs Apps in Toss and TDS through vercel-labs/skills", () => {
    installProjectSkills({
      targetDirectory: "/tmp/example-app",
      useTds: true,
    });

    expect(runCommand).toHaveBeenCalledWith({
      args: [
        skillsCli,
        "add",
        path.join(packageRoot, "skills"),
        "--skill",
        "apps-in-toss",
        "--skill",
        "tds-mobile",
        "--copy",
        "--yes",
      ],
      command: process.execPath,
      cwd: "/tmp/example-app",
    });
  });

  it("installs only Apps in Toss without TDS", () => {
    installProjectSkills({
      targetDirectory: "/tmp/example-app",
      useTds: false,
    });

    const call = vi.mocked(runCommand).mock.calls.at(-1)?.[0];
    expect(call?.args).toContain("apps-in-toss");
    expect(call?.args).not.toContain("tds-mobile");
    expect(call?.args).not.toContain("--agent");
  });

  it("keeps dynamic documentation routing in the installable catalog", () => {
    const appsSkill = readFileSync(
      path.join(packageRoot, "skills", "apps-in-toss", "SKILL.md"),
      "utf8",
    );
    const appsRouting = readFileSync(
      path.join(packageRoot, "skills", "apps-in-toss", "references", "documentation-routing.md"),
      "utf8",
    );
    const tdsRouting = readFileSync(
      path.join(packageRoot, "skills", "tds-mobile", "references", "documentation-routing.md"),
      "utf8",
    );

    expect(appsSkill).toContain("name: apps-in-toss");
    expect(appsSkill).toContain("references/documentation-routing.md");
    expect(appsRouting).toContain("/llms.txt");
    expect(appsRouting).toContain("/llms-full.txt");
    expect(tdsRouting).toContain("/llms-full.txt");
  });
});
