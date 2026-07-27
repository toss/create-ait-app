import { createRequire } from "node:module";
import { runCommand } from "../system/command.js";
import { skillsDirectory } from "../system/paths.js";

const require = createRequire(import.meta.url);
const skillsCli = require.resolve("skills/bin/cli.mjs");

export function installProjectSkills({
  targetDirectory,
  useTds,
}: {
  targetDirectory: string;
  useTds: boolean;
}): void {
  const skillNames = useTds ? ["apps-in-toss", "tds-mobile"] : ["apps-in-toss"];
  const args = [skillsCli, "add", skillsDirectory];

  for (const skillName of skillNames) {
    args.push("--skill", skillName);
  }
  args.push("--copy", "--yes");

  runCommand({
    args,
    command: process.execPath,
    cwd: targetDirectory,
  });
}
