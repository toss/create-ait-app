import type { PackageManager } from "../package-manager/package-manager.js";
import { runCommand } from "../system/command.js";

export interface AitInitCommand {
  args: string[];
  command: string;
}

// ait init의 --app-name은 케밥-케이스 검증을 통과해야 해서 npm 패키지 이름에
// 허용되는 `.`과 `_`를 `-`로 바꿔요.
export function toAitAppName(packageName: string): string {
  const base = packageName.split("/").at(-1) ?? packageName;
  return base.replace(/[._]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "my-app";
}

// 설치된 web-framework가 노출하는 로컬 `ait` 바이너리를 패키지 매니저 exec으로
// 실행해요. Yarn PnP처럼 node_modules/.bin이 없는 환경도 커버해요.
export function aitInitCommand(packageManager: PackageManager, appName: string): AitInitCommand {
  const initArgs = ["init", "--app-name", appName, "--skip-input"];

  if (packageManager === "npm") {
    return { args: ["exec", "--", "ait", ...initArgs], command: "npm" };
  }
  if (packageManager === "yarn") {
    return { args: ["run", "ait", ...initArgs], command: "yarn" };
  }
  return { args: ["exec", "ait", ...initArgs], command: "pnpm" };
}

export function formatAitInitCommand(packageManager: PackageManager, appName: string): string {
  const { args, command } = aitInitCommand(packageManager, appName);
  return `${command} ${args.join(" ")}`;
}

// 의존성 설치 뒤 `ait init`을 실행해 devtools 설치·번들러 플러그인 주입처럼
// web-framework 버전에 종속된 설정을 설치된 CLI에게 위임해요.
// 실패해도 스캐폴딩 전체를 되돌리지 않고 직접 실행할 명령을 안내해요.
export function runAitInit({
  appName,
  packageManager,
  targetDirectory,
}: {
  appName: string;
  packageManager: PackageManager;
  targetDirectory: string;
}): boolean {
  const { args, command } = aitInitCommand(packageManager, appName);
  try {
    runCommand({
      args,
      command,
      cwd: targetDirectory,
      // ait init이 내부에서 실행하는 의존성 설치는 npm_config_user_agent로
      // 패키지 매니저를 감지해요. yarn 스크립트 안에서 실행되는 경우처럼 바깥
      // 환경의 값이 새어들지 않도록 선택된 패키지 매니저를 명시해요.
      env: { npm_config_user_agent: `${packageManager}/create-ait-app` },
      // `npm exec --package=./create-ait-app.tgz` 같은 방식으로 실행하면
      // npm_config_package가 자식 npm exec에도 전달돼요. 생성된 프로젝트에서
      // 상대경로 tarball을 다시 찾지 않도록 바깥 exec 설정을 제거해요.
      unsetEnv: ["NODE_OPTIONS", "npm_config_package"],
    });
    return true;
  } catch (error) {
    console.warn(
      [
        `⚠️ ait init 실행에 실패했어요: ${error instanceof Error ? error.message : String(error)}`,
        `프로젝트 디렉터리에서 직접 실행해 주세요: ${formatAitInitCommand(packageManager, appName)}`,
      ].join("\n"),
    );
    return false;
  }
}
