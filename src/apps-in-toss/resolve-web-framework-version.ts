import { runCommandCapture } from "../system/command.js";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
  type AppsInTossWebFrameworkReleaseChannel,
} from "./version-policy.js";

const STABLE_VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const MAJOR_PREFIX_PATTERN = /^(\d+)\./;

interface StableVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

function parseStableVersion(version: string): StableVersion | null {
  const match = version.match(STABLE_VERSION_PATTERN);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: version,
  };
}

function isNewer(candidate: StableVersion, current: StableVersion): boolean {
  if (candidate.major !== current.major) return candidate.major > current.major;
  if (candidate.minor !== current.minor) return candidate.minor > current.minor;
  return candidate.patch > current.patch;
}

function highestStableVersionWithMajor(versions: string[], targetMajor: number): string | null {
  let best: StableVersion | null = null;
  for (const raw of versions) {
    const parsed = parseStableVersion(raw);
    if (!parsed || parsed.major !== targetMajor) continue;
    if (!best || isNewer(parsed, best)) {
      best = parsed;
    }
  }
  return best?.raw ?? null;
}

function npmViewJson(specifier: string, field: string): unknown {
  const stdout = runCommandCapture({
    args: ["view", specifier, field, "--json"],
    command: "npm",
  });
  return JSON.parse(stdout);
}

// 채널이 실제로 가리키는 버전을 사용자의 npm 설정(레지스트리 오버라이드·
// 사내 미러·인증 포함)을 그대로 따라 조회해요. "latest" 채널은 dist-tag
// 자체가 오래된 메이저를 가리킬 수 있다고 보고돼(toss/create-ait-app#33)
// dist-tag를 신뢰하지 않고 전체 발행 버전에서 지원 메이저(정확히
// APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR)의 안정 버전 중 최신을 찾아요.
// "beta"/"rc"는 그 자체가 사전 배포 의도로 관리되는 태그라 그대로 신뢰하되,
// 가리키는 메이저가 지원 범위를 벗어나면(배포 채널 자체가 잘못 설정된
// 상황) 조용히 진행하지 않고 에러로 알려요.
export function resolveWebFrameworkVersion(channel: AppsInTossWebFrameworkReleaseChannel): string {
  if (isPrereleaseWebFrameworkChannel(channel)) {
    const tagged = npmViewJson(`${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}@${channel}`, "version");
    if (typeof tagged !== "string" || tagged.length === 0) {
      throw new Error(
        `${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}의 "${channel}" 채널 버전을 확인하지 못했어요.`,
      );
    }
    const majorMatch = tagged.match(MAJOR_PREFIX_PATTERN);
    const major = majorMatch ? Number(majorMatch[1]) : null;
    if (major === null || major !== APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR) {
      throw new Error(
        `${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}의 "${channel}" 채널이 ${tagged}(메이저 ${String(major)})를 가리키고 있어요. ` +
          `create-ait-app은 메이저 ${String(APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR)} 산출물만 지원해요 — 배포 채널 설정을 확인해 주세요.`,
      );
    }
    return tagged;
  }

  const rawVersions = npmViewJson(APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME, "versions");
  const versions = Array.isArray(rawVersions)
    ? rawVersions.filter((value): value is string => typeof value === "string")
    : [];
  const resolved = highestStableVersionWithMajor(versions, APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR);
  if (!resolved) {
    throw new Error(
      `${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME}에서 메이저 ${String(APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR)} 안정 버전을 찾지 못했어요.`,
    );
  }
  return resolved;
}

// package.json에 기록할 의존성 범위예요. 해석에 성공하면 caret 범위
// (예: "^3.0.2")로 고정해서 이후 dist-tag가 어떻게 움직여도 설치 버전이
// 바뀌지 않게 해요. 오프라인이거나 레지스트리 조회가 실패하면 기존
// 동작(dist-tag 리터럴)으로 되돌아가고 원인을 알려요 — scaffold 자체를
// 막지는 않되, 이 경우엔 예전과 같은 비재현성 문제가 남을 수 있다는 걸
// 사용자가 알아야 해서 경고를 남겨요.
export function resolveWebFrameworkDependencySpecifier(
  channel: AppsInTossWebFrameworkReleaseChannel = APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
): string {
  try {
    return `^${resolveWebFrameworkVersion(channel)}`;
  } catch (error) {
    console.warn(
      [
        `⚠️ ${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME} 버전을 확인하지 못해 "${channel}" dist-tag로 대신 기록해요.`,
        error instanceof Error ? error.message : String(error),
        `설치 후 package.json에서 caret 범위(예: "^${String(APPS_IN_TOSS_WEB_FRAMEWORK_TARGET_MAJOR)}.0.0")로 직접 고정하는 걸 권장해요.`,
      ].join("\n"),
    );
    return channel;
  }
}
