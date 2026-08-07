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

const CONSOLE_APP_NAME_MAX_LENGTH = 63;
const CONSOLE_APP_NAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
// "apps-in-toss"도 "toss"를 부분 문자열로 포함하므로 이 정규식 하나로 함께
// 걸러요. 다른 규칙 위반(대문자 등) 때문에 이 검사까지 가지 않고 조용히
// 넘어가는 일이 없도록 대소문자 구분 없이 검사해요.
const CONSOLE_APP_NAME_RESERVED_SUBSTRING = /toss/i;

// 앱인토스 콘솔의 appName 규칙(영문 소문자·숫자·하이픈, 63자 이하, 하이픈으로
// 시작/끝 금지, "toss" 포함 금지)을 위반하는 지점을 모두 모아서 돌려줘요.
// scaffold 시점에 미리 걸러야 콘솔 등록 단계에서야 거부돼 재빌드·재업로드를
// 반복하는 비용을 피할 수 있어요(toss/create-ait-app#35).
export function validateConsoleAppName(appName: string): string[] {
  const issues: string[] = [];

  if (appName.length === 0) {
    issues.push("앱 이름이 비어 있어요.");
    return issues;
  }
  if (appName.length > CONSOLE_APP_NAME_MAX_LENGTH) {
    issues.push(
      `${String(CONSOLE_APP_NAME_MAX_LENGTH)}자를 넘을 수 없어요 (현재 ${String(appName.length)}자).`,
    );
  }
  if (!CONSOLE_APP_NAME_PATTERN.test(appName)) {
    issues.push("영문 소문자·숫자·하이픈만 사용할 수 있고, 하이픈으로 시작하거나 끝날 수 없어요.");
  }
  if (CONSOLE_APP_NAME_RESERVED_SUBSTRING.test(appName)) {
    issues.push('"toss"를 포함할 수 없어요 ("apps-in-toss"도 "toss"를 포함해서 걸려요).');
  }

  return issues;
}

// 위반이 있으면 콘솔 등록 시점에 나올 법한 안내를 미리 던져요. 호출자는
// scaffold로 파일을 만들기 전, 가능한 한 이른 시점에 불러야 해요.
export function assertConsoleAppName(appName: string): void {
  const issues = validateConsoleAppName(appName);
  if (issues.length === 0) return;

  throw new Error(
    [
      `"${appName}"은(는) 앱인토스 콘솔 appName 규칙을 위반해요:`,
      ...issues.map((issue) => `  - ${issue}`),
      "다른 이름으로 다시 시도해 주세요.",
    ].join("\n"),
  );
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
        `⚠️ ait init 실행에 실패했어요. ${error instanceof Error ? error.message : String(error)}`,
        `프로젝트 디렉터리에서 직접 실행해 주세요: ${formatAitInitCommand(packageManager, appName)}`,
      ].join("\n"),
    );
    return false;
  }
}
