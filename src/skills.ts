import path from "node:path";
import { assetsDirectory } from "./paths.js";
import { copyDirectory } from "./fs-utils.js";
import type { AiTool } from "./types.js";

export function getSkillRoot(targetDirectory: string, aiTool: AiTool): string {
  return aiTool === "claude"
    ? path.join(targetDirectory, ".claude", "skills")
    : path.join(targetDirectory, ".agents", "skills");
}

export function writeAiSkills({
  aiTool,
  targetDirectory,
  useTds,
}: {
  aiTool: AiTool;
  targetDirectory: string;
  useTds: boolean;
}): void {
  const skillRoot = getSkillRoot(targetDirectory, aiTool);
  const skillNames = useTds ? ["apps-in-toss", "tds-mobile"] : ["apps-in-toss"];

  for (const skillName of skillNames) {
    copyDirectory(path.join(assetsDirectory, "skills", skillName), path.join(skillRoot, skillName));
  }
}
