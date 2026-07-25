import type { AiTool, PackageManager, SampleId } from "./types.js";

export interface CliArgs {
  _: string[];
  ai?: AiTool | string;
  help: boolean;
  inline: boolean;
  pm?: PackageManager | string;
  sample: string[];
  skills: boolean;
  skipInstall: boolean;
  tds: boolean;
  template?: string;
}

const VALUE_FLAGS = new Set(["--ai", "--pm", "--sample", "--template"]);
const BOOLEAN_FLAGS = new Set(["--help", "--inline", "--skills", "--skip-install", "--tds"]);

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    _: [],
    help: false,
    inline: false,
    sample: [],
    skills: false,
    skipInstall: false,
    tds: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (VALUE_FLAGS.has(token)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${token} 옵션에 값이 필요합니다.`);
      }
      index += 1;

      if (token === "--sample") {
        args.sample.push(...value.split(",").filter(Boolean));
      } else if (token === "--ai") {
        args.ai = value;
      } else if (token === "--pm") {
        args.pm = value;
      } else {
        args.template = value;
      }
      continue;
    }

    if (BOOLEAN_FLAGS.has(token)) {
      const key = token.slice(2).replaceAll("-", "");
      if (key === "skipinstall") {
        args.skipInstall = true;
      } else {
        (args as unknown as Record<string, boolean>)[key] = true;
      }
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`알 수 없는 옵션입니다: ${token}`);
    }

    args._.push(token);
  }

  return args;
}

export function parseSampleIds(values: string[]): SampleId[] {
  const invalid = values.filter((value) => value !== "iap" && value !== "iaa");
  if (invalid.length > 0) {
    throw new Error(`지원하지 않는 예제 코드입니다: ${invalid.join(", ")} (iap, iaa 중 선택)`);
  }
  return [...new Set(values)] as SampleId[];
}

export function printHelp(): void {
  console.log(`
사용법: create-ait-app [project-name] [options]

options:
  --inline           질문을 생략합니다 (기본 Vite 프리셋: react-ts)
  --pm <name>        패키지 매니저 (npm, yarn, pnpm)
  --template <name>  create-vite 프리셋 (예: vue-ts, svelte, solid-ts)
  --tds              React 18 + TypeScript + TDS 전용 템플릿 사용
  --skills           최신 공식 문서를 조회하는 Agent Skills 추가
  --ai <name>        AI 도구 (cursor, claude, codex)
  --sample <name>    예제 코드 (iap, iaa / 복수: iap,iaa)
  --skip-install     의존성 설치 생략
  --help             도움말

일반 프로젝트는 고정된 create-vite 버전의 선택 화면을 그대로 사용합니다.
Vite CSR 프로젝트만 지원합니다. TDS는 --tds 경로에서만 지원합니다.
`);
}
