import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  AIT_CONFIG_BASE_NAME,
  AIT_RESERVED_CONFIG_EXTENSIONS,
  AIT_RESERVED_SCRIPT_PATTERN,
  AIT_RESERVED_SCRIPT_SLOTS,
  AIT_SCRIPT_SLOT_BUILD_VITE,
  AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL,
  AIT_SCRIPT_SLOT_DEV_VITE,
} from "../apps-in-toss/reserved-project-files.js";
import { APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME } from "../apps-in-toss/version-policy.js";
import type { FrameworkKind } from "./framework.js";
import { readPackageJson, type PackageJson } from "./package-json.js";

export interface ProjectInspection {
  framework: FrameworkKind;
  isTypeScript: boolean;
  packageJson: PackageJson;
  originalBuildCommand: string;
  originalDevCommand: string;
}

function allDependencies(packageJson: PackageJson): Record<string, string> {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
}

export function detectFramework(packageJson: PackageJson): FrameworkKind {
  const dependencies = allDependencies(packageJson);
  if (dependencies.react) return "react";
  if (dependencies.preact) return "preact";
  if (dependencies.vue) return "vue";
  if (dependencies.svelte) return "svelte";
  if (dependencies["solid-js"]) return "solid";
  if (dependencies.lit) return "lit";
  if (dependencies["@builder.io/qwik"]) return "qwik";
  if (dependencies.vite) return "vanilla";
  return "unknown";
}

export function isTypeScriptProject(targetDirectory: string): boolean {
  if (existsSync(path.join(targetDirectory, "tsconfig.json"))) {
    return true;
  }

  const sourceDirectory = path.join(targetDirectory, "src");
  if (!existsSync(sourceDirectory)) {
    return false;
  }

  return readdirSync(sourceDirectory, { recursive: true }).some((entry) =>
    /\.(?:ts|tsx)$/.test(String(entry)),
  );
}

export function isSsrOnlyViteBuildCommand(command: string): boolean {
  const viteBuilds = [...command.matchAll(/\bvite\s+build\b([^&;|]*)/g)];
  return (
    viteBuilds.length > 0 &&
    viteBuilds.every((match) => /(?:^|\s)--ssr(?:\s|=|$)/.test(match[1] ?? ""))
  );
}

export function assertCsrViteProject(targetDirectory: string): ProjectInspection {
  if (!existsSync(path.join(targetDirectory, "package.json"))) {
    throw new Error("package.json을 찾을 수 없어요.");
  }
  if (!existsSync(path.join(targetDirectory, "index.html"))) {
    throw new Error(
      "클라이언트 진입점 index.html이 없어요. create-ait-app은 Vite 정적 클라이언트 프로젝트만 지원해요.",
    );
  }

  const packageJson = readPackageJson(targetDirectory);
  const dependencies = allDependencies(packageJson);
  if (!dependencies.vite) {
    throw new Error(
      "Vite 의존성이 없어요. create-ait-app은 Vite 정적 클라이언트 프로젝트만 지원해요.",
    );
  }

  const originalDevCommand = packageJson.scripts?.dev;
  const originalBuildCommand = packageJson.scripts?.build;
  if (!originalDevCommand || !originalBuildCommand) {
    throw new Error(
      "Vite dev/build 스크립트가 없어요. create-ait-app은 Vite 정적 클라이언트 프로젝트만 지원해요.",
    );
  }
  if (isSsrOnlyViteBuildCommand(originalBuildCommand)) {
    throw new Error(
      "SSR 전용 Vite build를 감지했어요. 정적 HTML과 클라이언트 자산을 만드는 프리셋만 지원해요.",
    );
  }

  return {
    framework: detectFramework(packageJson),
    isTypeScript: isTypeScriptProject(targetDirectory),
    originalBuildCommand,
    originalDevCommand,
    packageJson,
  };
}

// init(기존 Vite 프로젝트 전환)의 사전 가드예요. assertCsrViteProject와 달리 아무것도
// 쓰지 않고, create-ait-app이 기존 파일을 덮어써야만 하는 상황을 미리 거부해요.
export function assertAdoptableProject(targetDirectory: string): void {
  if (!existsSync(path.join(targetDirectory, "package.json"))) {
    throw new Error("package.json이 없어요. Vite로 만든 프로젝트 루트에서 다시 실행해 주세요.");
  }

  const packageJson = readPackageJson(targetDirectory);
  if (packageJson.createAitApp) {
    throw new Error(
      "이미 create-ait-app으로 설정한 프로젝트예요. 예제 코드를 추가하려면 create-ait-app add-sample을 사용해 주세요.",
    );
  }

  const dependencies = allDependencies(packageJson);
  if (dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]) {
    throw new Error(
      `이미 ${APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME} 의존성이 있어요. package.json에서 지우고 다시 실행해 주세요.`,
    );
  }

  const existingConfigFile = AIT_RESERVED_CONFIG_EXTENSIONS.map(
    (extension) => `${AIT_CONFIG_BASE_NAME}.${extension}`,
  ).find((fileName) => existsSync(path.join(targetDirectory, fileName)));
  if (existingConfigFile) {
    throw new Error(
      `${existingConfigFile}이 이미 있어요. 설정을 새로 만들려면 파일을 지우고 다시 실행해 주세요.`,
    );
  }

  const scripts = packageJson.scripts ?? {};
  const reservedScriptEntry = Object.entries(scripts).find(([, value]) =>
    AIT_RESERVED_SCRIPT_PATTERN.test(value),
  );
  if (reservedScriptEntry) {
    throw new Error(
      `scripts.${reservedScriptEntry[0]}이 이미 ait 명령을 실행하고 있어요. create-ait-app이 build/deploy를 다시 쓸 때 사용하는 명령이에요. 스크립트 값에서 ait build/ait deploy 호출을 지우고 다시 실행해 주세요.`,
    );
  }

  for (const slot of AIT_RESERVED_SCRIPT_SLOTS) {
    const originalKey =
      slot === AIT_SCRIPT_SLOT_BUILD_VITE
        ? "build"
        : slot === AIT_SCRIPT_SLOT_DEV_VITE
          ? "dev"
          : undefined;
    const conflicts =
      slot === AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL
        ? scripts[slot] !== undefined
        : scripts[slot] !== undefined && scripts[slot] !== scripts[originalKey as string];
    if (conflicts) {
      throw new Error(
        `scripts["${slot}"]: 이 이름은 create-ait-app이 원래 스크립트를 옮겨 둘 자리예요. 이름을 바꾸고 다시 실행해 주세요.`,
      );
    }
  }
}
