import type { SpawnSyncOptions } from "node:child_process";
import crossSpawn from "cross-spawn";

// quiet 모드에서 캡처하는 출력의 상한이에요. 자식 프로세스의 안내 출력을
// 삼키는 용도라 넉넉하게 잡되, 무한정 버퍼링하지는 않게 해요.
const QUIET_MAX_BUFFER = 10 * 1024 * 1024;

export interface RunCommandOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /**
   * true면 표준 출력/에러를 상속하지 않고 캡처만 해요. 성공하면 캡처한 내용은
   * 버리고, 실패하면(에러 또는 비정상 종료 코드) 진단이 사라지지 않도록 캡처한
   * 내용을 stderr로 흘려보낸 뒤 기존과 동일하게 에러를 던져요.
   */
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
    maxBuffer: quiet ? QUIET_MAX_BUFFER : undefined,
    stdio: quiet ? "pipe" : (stdio ?? "inherit"),
  });

  if (result.error || result.status !== 0) {
    if (quiet) {
      if (result.stdout) process.stderr.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    if (result.error) {
      throw result.error;
    }
    throw new Error(
      `${command} ${args.join(" ")} 명령이 종료 코드 ${String(result.status)}로 실패했어요.`,
    );
  }
}
