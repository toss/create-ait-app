export type AppsInTossWebFrameworkReleaseChannel = "beta" | "rc" | "latest";

export const APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME = "@apps-in-toss/web-framework";

// Apps in Toss 웹 프레임워크의 릴리즈 채널은 여기서만 바꿔요.
export const APPS_IN_TOSS_WEB_FRAMEWORK_VERSION: AppsInTossWebFrameworkReleaseChannel = "rc";

export const APPS_IN_TOSS_WEB_FRAMEWORK_SPECIFIER = `${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}@${APPS_IN_TOSS_WEB_FRAMEWORK_VERSION}`;

export function isPrereleaseWebFrameworkChannel(
  channel: AppsInTossWebFrameworkReleaseChannel,
): boolean {
  return channel !== "latest";
}
