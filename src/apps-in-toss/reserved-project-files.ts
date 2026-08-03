// create-ait-app이 기존(브라운필드) 프로젝트에 실제로 쓰는 파일/스크립트 이름의
// 단일 소스예요. src/project/inspect-project.ts(가드)와
// src/scaffold/initialize-ait-project.ts(실제 작성)가 이 상수를 함께 참조해서, 쓰는
// 값이 바뀌었는데 가드가 뒤처지는 상황을 막아요.

export const AIT_CONFIG_BASE_NAME = "apps-in-toss.config";
export const AIT_CONFIG_FILE_NAME = `${AIT_CONFIG_BASE_NAME}.ts`;
export const AIT_RESERVED_CONFIG_EXTENSIONS = ["ts", "mts", "cts", "js", "mjs", "cjs"] as const;

export const AIT_BUILD_COMMAND = "ait build";
export const AIT_DEPLOY_COMMAND = "ait deploy";
export const AIT_RESERVED_SCRIPT_PATTERN = /\bait\s+(?:build|deploy)\b/;

export const AIT_SCRIPT_SLOT_BUILD_VITE = "build:vite";
export const AIT_SCRIPT_SLOT_DEV_VITE = "dev:vite";
export const AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL = "deploy:original";
export const AIT_RESERVED_SCRIPT_SLOTS = [
  AIT_SCRIPT_SLOT_BUILD_VITE,
  AIT_SCRIPT_SLOT_DEV_VITE,
  AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL,
] as const;
