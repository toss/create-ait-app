import type { PackageManager } from "../package-manager/package-manager.js";
import { SAMPLE_IDS, type SampleId } from "../samples/apply-samples.js";
import { getSupportedViteTemplates } from "../vite/create-vite.js";

export interface CliArgs {
  _: string[];
  help: boolean;
  inline: boolean;
  pm?: PackageManager | string;
  sample: string[];
  skills: boolean;
  skipInstall: boolean;
  tds: boolean;
  template?: string;
}

const VALUE_FLAGS = new Set(["--pm", "--sample", "--template"]);
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
        throw new Error(`${token} 옵션에 값이 필요해요.`);
      }
      index += 1;

      if (token === "--sample") {
        args.sample.push(...value.split(",").filter(Boolean));
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
      throw new Error(`알 수 없는 옵션이에요: ${token}`);
    }

    args._.push(token);
  }

  return args;
}

export function parseSampleIds(values: string[]): SampleId[] {
  const invalid = values.filter((value) => !SAMPLE_IDS.includes(value as SampleId));
  if (invalid.length > 0) {
    throw new Error(
      `지원하지 않는 예제 코드예요: ${invalid.join(", ")} (${SAMPLE_IDS.join(", ")} 중 선택)`,
    );
  }
  return [...new Set(values)] as SampleId[];
}

export function assertNonInteractiveArgs(args: CliArgs): void {
  if (!args.inline) return;
  if (args.tds && args.template) {
    throw new Error("--template과 --tds는 함께 사용할 수 없어요. 둘 중 하나만 선택해 주세요.");
  }

  const missing: string[] = [];
  if (!args._[0]) missing.push("프로젝트 경로");
  if (!args.pm) missing.push("--pm <npm|yarn|pnpm>");
  if (!args.tds && !args.template) missing.push("--template <프리셋> 또는 --tds");

  if (missing.length > 0) {
    throw new Error(
      `비대화형 실행에 필요한 값이 빠졌어요: ${missing.join(", ")}. 사용 가능한 선택지는 --help에서 확인해 주세요.`,
    );
  }
}

export function printHelp(): void {
  const templates = getSupportedViteTemplates().join(", ");
  console.log(`
사용법: create-ait-app [project-name] [options]
       create-ait-app add-sample [directory] [iap,iaa] [--sample iap,iaa]

옵션:
  --inline           모든 질문을 생략하고 비대화형으로 실행해요
  --pm <name>        패키지 매니저를 골라요 (npm, yarn, pnpm)
  --template <name>  create-vite 프리셋을 골라요
  --tds              React 18 + TypeScript + TDS 전용 템플릿을 사용해요
  --skills           최신 공식 문서를 조회하는 Agent Skills를 추가해요
  --sample <name>    예제 코드를 추가해요 (iap, iaa / 복수: iap,iaa)
  --skip-install     의존성 설치를 생략해요
  --help             도움말을 보여 줘요

에이전트·CI 비대화형 실행:
  프로젝트 경로, --inline, --pm, 그리고 --template 또는 --tds가 반드시 필요해요.
  --template과 --tds 중 하나를 선택해 주세요.

  Vite 프리셋:
    ${templates}

  선택 기능:
    --sample은 React, Vanilla, TDS 프로젝트에서만 사용할 수 있어요.
    --sample을 생략하면 예제를 추가하지 않아요.
    --skills를 지정하면 공식 Skills CLI가 에이전트를 자동 감지해요.
    일반 프로젝트에는 apps-in-toss, TDS에는 apps-in-toss와 tds-mobile을 설치해요.
    --skills를 생략하면 Agent Skills를 추가하지 않아요.
    --skip-install을 생략하면 의존성을 설치해요.

  예시:
    create-ait-app my-app --inline --pm npm --template react-ts
    create-ait-app my-app --inline --pm pnpm --tds --sample iap,iaa --skills

  add-sample을 비대화형으로 실행할 때는 --inline --sample <iap|iaa>를 지정해요.

일반 프로젝트는 고정된 create-vite 버전의 선택 화면을 그대로 사용해요.
CSR과 SSG+hydration을 지원하지만 SSR 전용 프로젝트는 지원하지 않아요.
TDS는 --tds로만 사용할 수 있어요.
`);
}
