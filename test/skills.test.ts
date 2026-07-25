import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeAiSkills } from "../src/skills.js";

describe("writeAiSkills", () => {
  it("writes vercel-labs/skills-compatible dynamic skills", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-skills-"));
    writeAiSkills({ aiTool: "codex", targetDirectory: directory, useTds: true });

    const appsSkill = readFileSync(
      path.join(directory, ".agents", "skills", "apps-in-toss", "SKILL.md"),
      "utf8",
    );
    const tdsSkill = readFileSync(
      path.join(directory, ".agents", "skills", "tds-mobile", "SKILL.md"),
      "utf8",
    );
    const appsRouting = readFileSync(
      path.join(
        directory,
        ".agents",
        "skills",
        "apps-in-toss",
        "references",
        "documentation-routing.md",
      ),
      "utf8",
    );
    const tdsRouting = readFileSync(
      path.join(
        directory,
        ".agents",
        "skills",
        "tds-mobile",
        "references",
        "documentation-routing.md",
      ),
      "utf8",
    );

    expect(appsSkill).toContain("name: apps-in-toss");
    expect(appsSkill).toContain("references/documentation-routing.md");
    expect(appsSkill).not.toContain("## Resources");
    expect(tdsSkill).toContain("references/documentation-routing.md");
    expect(appsRouting).toContain("/llms.txt");
    expect(appsRouting).toContain("/llms-full.txt");
    expect(appsRouting).toContain("focused page");
    expect(tdsRouting).toContain("/llms-full.txt");
  });

  it("uses Claude Code's project skill directory", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-skills-"));
    writeAiSkills({ aiTool: "claude", targetDirectory: directory, useTds: false });
    expect(
      readFileSync(path.join(directory, ".claude", "skills", "apps-in-toss", "SKILL.md"), "utf8"),
    ).toContain("name: apps-in-toss");
  });
});
