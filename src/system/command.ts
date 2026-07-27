import type { SpawnSyncOptions } from "node:child_process";
import crossSpawn from "cross-spawn";

export interface RunCommandOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: SpawnSyncOptions["stdio"];
  unsetEnv?: string[];
}

export function runCommand({
  args = [],
  command,
  cwd,
  env,
  stdio = "inherit",
  unsetEnv = [],
}: RunCommandOptions): void {
  const commandEnvironment = { ...process.env, ...env };
  for (const key of unsetEnv) {
    delete commandEnvironment[key];
  }

  const result = crossSpawn.sync(command, args, {
    cwd,
    env: commandEnvironment,
    stdio,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} 명령이 종료 코드 ${String(result.status)}로 실패했어요.`,
    );
  }
}
