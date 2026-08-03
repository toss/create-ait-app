import type { SpawnSyncOptions } from "node:child_process";
import crossSpawn from "cross-spawn";

export interface RunCommandOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  quiet?: boolean;
  stdio?: SpawnSyncOptions["stdio"];
  unsetEnv?: string[];
}

export function runCommand({
  args = [],
  command,
  cwd,
  env,
  quiet = false,
  stdio,
  unsetEnv = [],
}: RunCommandOptions): void {
  const commandEnvironment = { ...process.env, ...env };
  for (const key of unsetEnv) {
    delete commandEnvironment[key];
  }

  const result = crossSpawn.sync(command, args, {
    cwd,
    env: commandEnvironment,
    ...(quiet ? { maxBuffer: 10 * 1024 * 1024, stdio: "pipe" } : { stdio: stdio ?? "inherit" }),
  });

  if (result.error) {
    if (quiet) {
      flushCapturedOutput(result.stdout, result.stderr);
    }
    throw result.error;
  }
  if (result.status !== 0) {
    if (quiet) {
      flushCapturedOutput(result.stdout, result.stderr);
    }
    throw new Error(
      `${command} ${args.join(" ")} 명령이 종료 코드 ${String(result.status)}로 실패했어요.`,
    );
  }
}

function flushCapturedOutput(stdout: Buffer | null, stderr: Buffer | null): void {
  if (stdout && stdout.length > 0) {
    process.stderr.write(stdout);
  }
  if (stderr && stderr.length > 0) {
    process.stderr.write(stderr);
  }
}
