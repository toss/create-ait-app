import path from "node:path";
import { runCommand } from "./command.js";
import { skillsDirectory } from "./paths.js";
import type { AiTool } from "./types.js";

const SKILLS_AGENT_IDS: Readonly<Record<AiTool, string>> = {
  claude: "claude-code",
  codex: "codex",
  cursor: "cursor",
};

export function getSkillRoot(targetDirectory: string, aiTool: AiTool): string {
  return aiTool === "claude"
    ? path.join(targetDirectory, ".claude", "skills")
    : path.join(targetDirectory, ".agents", "skills");
}

export function installProjectSkills({
  aiTool,
  targetDirectory,
  useTds,
}: {
  aiTool: AiTool;
  targetDirectory: string;
  useTds: boolean;
}): void {
  const skillNames = useTds ? ["apps-in-toss", "tds-mobile"] : ["apps-in-toss"];
  const args = [
    "--yes",
    "skills@latest",
    "add",
    skillsDirectory,
    "--agent",
    SKILLS_AGENT_IDS[aiTool],
  ];

  for (const skillName of skillNames) {
    args.push("--skill", skillName);
  }
  args.push("--copy", "--yes");

  runCommand({
    args,
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    cwd: targetDirectory,
  });
}

export const writeAiSkills = installProjectSkills;
