import packageJson from "../../package.json" with { type: "json" };

export type AppsInTossWebFrameworkReleaseChannel = "beta" | "rc" | "latest";

export const APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME = "@apps-in-toss/web-framework";

// Apps in Toss 웹 프레임워크의 릴리즈 채널은 여기서만 바꿔요.
// beta/rc는 dist-tag를 그대로 따르고(의도적으로 유동적이에요), latest는 공급망
// 방어를 위해 dist-tag 대신 이 저장소 package.json의 devDependencies에 고정된
// 정확 버전을 써요. 그 고정 버전은 dependabot이 범프 PR로 관리해요.
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

  const pinnedVersion = packageJson.devDependencies?.[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME];
  if (!pinnedVersion || !/^\d+\.\d+\.\d+$/.test(pinnedVersion)) {
    throw new Error(
      "@apps-in-toss/web-framework의 latest 채널 버전은 이 저장소 devDependencies에 정확 버전으로 고정되어 있어야 해요.",
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
