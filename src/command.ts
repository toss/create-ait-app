import { spawnSync, type SpawnSyncOptions } from "node:child_process";

export interface RunCommandOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: SpawnSyncOptions["stdio"];
}

export function runCommand({
  args = [],
  command,
  cwd,
  env,
  stdio = "inherit",
}: RunCommandOptions): void {
  const result = spawnSync(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    stdio,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} 명령이 종료 코드 ${String(result.status)}로 실패했습니다.`,
    );
  }
}
