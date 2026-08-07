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

export interface CaptureCommandOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  unsetEnv?: string[];
}

// 출력을 그대로 사용자 터미널에 흘려보내는 runCommand와 달리, 표준출력을
// 캡처해서 문자열로 돌려줘요. `npm view` 같은 조회성 명령의 결과를 파싱할 때
// 써요.
export function runCommandCapture({
  args = [],
  command,
  cwd,
  env,
  unsetEnv = [],
}: CaptureCommandOptions): string {
  const commandEnvironment = { ...process.env, ...env };
  for (const key of unsetEnv) {
    delete commandEnvironment[key];
  }

  const result = crossSpawn.sync(command, args, {
    cwd,
    encoding: "utf8",
    env: commandEnvironment,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} 명령이 종료 코드 ${String(result.status)}로 실패했어요.`,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return result.stdout ?? "";
}
