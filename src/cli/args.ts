import type { PackageManager } from "../package-manager/package-manager.js";
import { readPackageJson } from "../project/package-json.js";
import { SAMPLE_IDS, type SampleId } from "../samples/apply-samples.js";
import { packageRoot } from "../system/paths.js";
import { getSupportedViteTemplates } from "../vite/create-vite.js";

export interface CliArgs {
  _: string[];
  help: boolean;
  inline: boolean;
  listTemplates: boolean;
  pm?: PackageManager | string;
  sample: string[];
  tds: boolean;
  template?: string;
  version: boolean;
}

const VALUE_FLAGS = new Set(["--pm", "--sample", "--template"]);
const BOOLEAN_FLAGS = new Set(["--help", "--inline", "--list-templates", "--tds", "--version"]);
const ALIASES: Readonly<Record<string, string>> = {
  "-v": "--version",
};

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    _: [],
    help: false,
    inline: false,
    listTemplates: false,
    sample: [],
    tds: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = ALIASES[argv[index]] ?? argv[index];

    if (VALUE_FLAGS.has(token)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
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
      if (key === "listtemplates") {
        args.listTemplates = true;
      } else {
        (args as unknown as Record<string, boolean>)[key] = true;
      }
      continue;
    }

    if (token.startsWith("-")) {
      throw new Error(
        `알 수 없는 옵션이에요: ${token}. 사용 가능한 옵션은 --help로 확인해 주세요.`,
      );
    }

    args._.push(token);
  }

  return args;
}

export function getPackageVersion(): string {
  const packageJson = readPackageJson(packageRoot);
  const version = packageJson.version;
  if (!version) {
    throw new Error("package.json에서 버전을 찾을 수 없어요.");
  }
  return version;
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
사용법:
  create-ait-app [directory] [options]
  create-ait-app add-sample [directory] [options]

  directory를 생략하면 프로젝트 이름을 대화형으로 물어봐요. "."을 지정하면
  현재 디렉터리에 만들어요. add-sample은 directory를 생략하면 현재 디렉터리를
  대상으로 해요.

옵션:
  --pm <npm|yarn|pnpm>     패키지 매니저를 선택해요
  --template <preset>      create-vite 프리셋을 선택해요 (--tds와 함께 쓸 수
                           없어요)
                           lit, lit-ts, preact, preact-ts, qwik, qwik-ts, react,
                           react-ts, solid, solid-ts, svelte, svelte-ts, vanilla,
                           vanilla-ts, vue, vue-ts 중 하나
  --tds                    React 18 + TypeScript + TDS 전용 템플릿을 사용해요
                           (--template과 함께 쓸 수 없고, 대화형으로 다시 묻지
                           않아요)
  --sample <id>[,<id>]     예제 코드를 추가해요: iap(인앱 결제), iaa(인앱 광고)
                           콤마로 복수 지정 가능 (예: iap,iaa)
                           React/Vanilla/TDS 프로젝트에서만 지원해요
  --inline                 모든 질문을 생략하고 비대화형으로 실행해요
                           명령마다 필요한 값이 달라요 — 아래 "비대화형 실행
                           시 필요한 값" 참고
  --list-templates         지원하는 프리셋 목록을 JSON으로 출력해요
                           (Vite 프리셋 전체 + "tds" 포함. "tds"는 --template이
                           아닌 --tds 플래그로만 선택할 수 있어요)
  --version, -v            버전을 출력해요
  --help                   도움말을 보여줘요

예시:
  create-ait-app my-app --inline --pm npm --template react-ts
  create-ait-app my-app --inline --pm pnpm --tds --sample iap,iaa
  create-ait-app . --inline --pm npm --template vanilla-ts
  create-ait-app add-sample my-app --sample iap
  create-ait-app add-sample --inline --sample iap        (현재 디렉터리 대상)

참고:
  일반 프로젝트는 고정된 버전의 create-vite 선택 화면을 그대로 사용해요.
  CSR과 SSG+hydration을 지원하지만 SSR 전용 프로젝트는 지원하지 않아요.
  TDS는 --tds로만 선택할 수 있고, 대화형 흐름을 벗어난 자동화 환경에서는 아직
  검증이 더 필요해요 — 필요하다고 명시적으로 확인된 경우에만 선택하는 걸
  권장해요.
  dev 서버는 자동으로 시작하지 않으니 생성이 끝난 뒤 안내된 명령으로 직접
  시작해 주세요.

  Vite 프리셋 (--template):
    ${templates}

  비대화형(CI/자동화) 실행 시 필요한 값:
    새 프로젝트  — directory, --inline, --pm, (--template 또는 --tds 중 하나)
    add-sample  — --inline, --sample <id>[,<id>]  (directory 생략 시 현재
                  디렉터리)
`);
}
