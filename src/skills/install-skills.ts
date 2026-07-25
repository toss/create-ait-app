import { runCommand } from "../system/command.js";
import { skillsDirectory } from "../system/paths.js";

export function installProjectSkills({
  targetDirectory,
  useTds,
}: {
  targetDirectory: string;
  useTds: boolean;
}): void {
  const skillNames = useTds ? ["apps-in-toss", "tds-mobile"] : ["apps-in-toss"];
  const args = ["--yes", "skills@latest", "add", skillsDirectory];

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
