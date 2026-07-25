import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/command.js";
import { packageRoot } from "../src/paths.js";
import { getSkillRoot, installProjectSkills } from "../src/skills.js";

vi.mock("../src/command.js", () => ({
  runCommand: vi.fn(),
}));

describe("installProjectSkills", () => {
  it("installs Apps in Toss and TDS through vercel-labs/skills", () => {
    installProjectSkills({
      aiTool: "codex",
      targetDirectory: "/tmp/example-app",
      useTds: true,
    });

    expect(runCommand).toHaveBeenCalledWith({
      args: [
        "--yes",
        "skills@latest",
        "add",
        path.join(packageRoot, "skills"),
        "--agent",
        "codex",
        "--skill",
        "apps-in-toss",
        "--skill",
        "tds-mobile",
        "--copy",
        "--yes",
      ],
      command: process.platform === "win32" ? "npx.cmd" : "npx",
      cwd: "/tmp/example-app",
    });
  });

  it("installs only Apps in Toss without TDS", () => {
    installProjectSkills({
      aiTool: "claude",
      targetDirectory: "/tmp/example-app",
      useTds: false,
    });

    const call = vi.mocked(runCommand).mock.calls.at(-1)?.[0];
    expect(call?.args).toContain("apps-in-toss");
    expect(call?.args).not.toContain("tds-mobile");
    expect(call?.args).toContain("claude-code");
    expect(getSkillRoot("/tmp/example-app", "claude")).toBe(
      path.join("/tmp/example-app", ".claude", "skills"),
    );
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
