import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
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
    throw new Error("create-vite 결과에 package.json이 없어요.");
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
