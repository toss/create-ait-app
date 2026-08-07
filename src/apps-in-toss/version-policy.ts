export type AppsInTossWebFrameworkReleaseChannel = "beta" | "rc" | "latest";

export const APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME = "@apps-in-toss/web-framework";

// Apps in Toss 웹 프레임워크의 릴리즈 채널은 여기서만 바꿔요.
export const APPS_IN_TOSS_WEB_FRAMEWORK_VERSION: AppsInTossWebFrameworkReleaseChannel = "latest";

// create-ait-app이 생성하는 산출물(ait init이 만드는 apps-in-toss.config.ts
// 등)이 가정하는 메이저예요. 이 값과 실제로 설치되는 메이저가 어긋나면
// scaffold 직후 빌드가 깨져요(toss/create-ait-app#33). 산출물 형상을 다음
// 메이저로 올릴 때 여기만 바꿔요 — apps-in-toss/resolve-web-framework-version.ts가
// 이 값을 caret 범위 계산의 기준으로 써요.
export const APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR = 3;

export const APPS_IN_TOSS_WEB_FRAMEWORK_SPECIFIER = `${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}@${APPS_IN_TOSS_WEB_FRAMEWORK_VERSION}`;

export function isPrereleaseWebFrameworkChannel(
  channel: AppsInTossWebFrameworkReleaseChannel,
): boolean {
  return channel !== "latest";
}
