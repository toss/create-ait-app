import versionPinsPackageJson from "../../.github/version-pins/package.json" with { type: "json" };

export type AppsInTossWebFrameworkReleaseChannel = "beta" | "rc" | "latest";

export const APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME = "@apps-in-toss/web-framework";

// Apps in Toss 웹 프레임워크의 릴리즈 채널은 여기서만 바꿔요.
export const APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL: AppsInTossWebFrameworkReleaseChannel =
  "latest";

export function resolveWebFrameworkSpecifier(
  channel: AppsInTossWebFrameworkReleaseChannel,
): string {
  if (channel !== "latest") {
    // beta/rc 채널은 dist-tag 자체가 최신 프리릴리즈를 가리키도록 의도적으로
    // 유동적이라, 정확 버전으로 고정하지 않고 dist-tag 문자열을 그대로 써요.
    return channel;
  }

  const pinnedVersion =
    versionPinsPackageJson.dependencies?.[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME];
  if (!pinnedVersion || !/^\d+\.\d+\.\d+$/.test(pinnedVersion)) {
    throw new Error(
      "@apps-in-toss/web-framework의 latest 채널 버전은 .github/version-pins/package.json에 정확 버전으로 고정되어 있어야 해요.",
    );
  }
  return pinnedVersion;
}

export const APPS_IN_TOSS_WEB_FRAMEWORK_VERSION = resolveWebFrameworkSpecifier(
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
);

export function isPrereleaseWebFrameworkChannel(
  channel: AppsInTossWebFrameworkReleaseChannel,
): boolean {
  return channel !== "latest";
}
