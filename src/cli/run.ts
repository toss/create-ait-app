import { checkbox, input, select } from "@inquirer/prompts";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { assertConsoleAppName, toAitAppName } from "../apps-in-toss/ait-init.js";
import {
  detectInvokedPackageManager,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "../package-manager/package-manager.js";
import { createBaseProject, toNpmPackageName } from "../scaffold/create-base-project.js";
import { finalizeProject } from "../scaffold/finalize-project.js";
import { supportsSamples, type SampleId } from "../samples/apply-samples.js";
import { quoteForShell } from "../system/shell-quote.js";
import { getSupportedViteTemplates, VITE_TEMPLATE_ALIASES } from "../vite/create-vite.js";
import { runAddSample } from "./add-sample.js";
import {
  assertNonInteractiveArgs,
  getPackageVersion,
  parseArgs,
  parseSampleIds,
  printHelp,
  type CliArgs,
} from "./args.js";

const IGNORED_TARGET_ENTRIES = new Set([".git"]);

export function hasProjectFiles(targetDirectory: string): boolean {
  return readdirSync(targetDirectory).some((entry) => !IGNORED_TARGET_ENTRIES.has(entry));
}

export function assertChoice<T extends string>(
  value: string | undefined,
  choices: readonly T[],
  label: string,
): T | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!choices.includes(value as T)) {
    const lowerCased = value.toLowerCase();
    const hint = choices.includes(lowerCased as T)
      ? ` (혹시 소문자 "${lowerCased}"를 의도하셨나요?)`
      : "";
    throw new Error(`${label}: ${value} (${choices.join(", ")} 중 선택)${hint}`);
  }
  return value as T;
}

async function choosePackageManager(args: CliArgs): Promise<PackageManager> {
  const explicit = assertChoice(args.pm, PACKAGE_MANAGERS, "지원하지 않는 패키지 매니저예요");
  if (explicit) return explicit;

  const detected = detectInvokedPackageManager();
  if (detected) return detected;

  return select({
    choices: PACKAGE_MANAGERS.map((value) => ({ name: value, value })),
    message: "사용할 패키지 매니저를 골라 주세요:",
  });
}

async function chooseSamples(
  args: CliArgs,
  framework: Parameters<typeof supportsSamples>[0],
  useTds: boolean,
): Promise<SampleId[]> {
  const explicit = parseSampleIds(args.sample);
  if (explicit.length > 0) {
    if (!supportsSamples(framework, useTds)) {
      throw new Error(
        "iap/iaa 예제는 React와 Vanilla 프리셋만 지원해요. 선택한 Vite 프리셋은 예제 없이 생성해 주세요.",
      );
    }
    return explicit;
  }

  if (args.inline || !supportsSamples(framework, useTds)) {
    return [];
  }

  return checkbox({
    choices: [
      { name: "인앱 결제", value: "iap" },
      { name: "인앱 광고", value: "iaa" },
    ],
    message: "예제 코드를 추가할까요?",
  });
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  if (args.version) {
    console.log(getPackageVersion());
    return;
  }
  if (args.listTemplates) {
    process.stdout.write(JSON.stringify([...getSupportedViteTemplates(), "tds"]));
    return;
  }
  if (args.help) {
    printHelp();
    return;
  }
  if (args._[0] === "add-sample") {
    await runAddSample(args);
    return;
  }
  assertNonInteractiveArgs(args);
  if (args._.length > 1) {
    throw new Error(`알 수 없는 인수예요: ${args._.slice(1).join(" ")}`);
  }

  const projectName =
    args._[0] ??
    (await input({
      message: "프로젝트 이름을 입력해 주세요:",
      required: true,
    }));
  const targetDirectory = path.resolve(process.cwd(), projectName);
  const targetExisted = existsSync(targetDirectory);

  if (targetExisted && hasProjectFiles(targetDirectory)) {
    throw new Error(`"${projectName}" 디렉터리가 이미 있고 비어 있지 않아요.`);
  }

  const packageManager = await choosePackageManager(args);
  const useTds = args.tds;
  if (useTds && args.template) {
    throw new Error("--template과 --tds는 함께 사용할 수 없어요. 둘 중 하나만 선택해 주세요.");
  }
  const supportedTemplates = [
    ...getSupportedViteTemplates(),
    ...Object.keys(VITE_TEMPLATE_ALIASES),
  ];
  const explicitTemplate = useTds
    ? undefined
    : assertChoice(args.template, supportedTemplates, "지원하지 않는 Vite 프리셋이에요");

  const template = useTds ? "react-ts" : explicitTemplate;
  const packageName = toNpmPackageName(path.basename(projectName));
  // 콘솔 등록 단계에서야 거부되면 재빌드·재업로드를 반복해야 해서, 실제로
  // ait init에 전달될 appName을 파일 생성 전에 미리 검증해요.
  assertConsoleAppName(toAitAppName(packageName));

  console.log(
    useTds ? "\n🚀 TDS 프로젝트를 만들고 있어요.\n" : "\n🚀 앱 프로젝트를 만들고 있어요.\n",
  );

  try {
    const baseProject = createBaseProject({
      packageName,
      targetDirectory,
      template,
      useTds,
    });

    const sampleIds = await chooseSamples(args, baseProject.framework, useTds);

    finalizeProject({
      baseProject,
      packageManager,
      packageName,
      sampleIds,
      targetDirectory,
      useTds,
    });

    const devCommand = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    const isCurrentDirectory = targetDirectory === process.cwd();
    const cdLine = isCurrentDirectory ? "" : `\n  cd ${quoteForShell(projectName)}`;
    console.log(`
✅ 프로젝트를 만들었어요.
${cdLine}
  ${devCommand}
`);
  } catch (error) {
    // 실패해도 이미 만든 파일은 지우지 않아요. install 실패 같은 문제는
    // 대부분 복구 가능하고, 디렉터리를 통째로 지우면 복구 절차를 적용할
    // 대상 자체가 사라져요(toss/create-ait-app#34).
    if (!targetExisted && existsSync(targetDirectory)) {
      console.warn(buildScaffoldFailureGuidance({ packageManager, projectName, targetDirectory }));
    }
    throw error;
  }
}

export function buildScaffoldFailureGuidance({
  packageManager,
  projectName,
  targetDirectory,
}: {
  packageManager: PackageManager;
  projectName: string;
  targetDirectory: string;
}): string {
  const lines = [
    `⚠️ 오류가 발생했지만 만든 파일은 지우지 않았어요: ${targetDirectory}`,
    "원인을 확인한 뒤 아래에서 이어서 진행할 수 있어요:",
    `  cd ${quoteForShell(projectName)}`,
    `  ${packageManager} install`,
  ];

  if (packageManager === "pnpm") {
    lines.push(
      "",
      "pnpm을 쓰는 경우 흔한 원인 중 하나는 pnpm 11이 승인되지 않은 빌드 스크립트를",
      "차단하는 ERR_PNPM_IGNORED_BUILDS예요. 이 오류라면 에러 메시지에 나열된 패키지를",
      "pnpm-workspace.yaml의 allowBuilds: 아래에 추가한 뒤 위 install을 다시 실행해 주세요.",
    );
  }

  return lines.join("\n");
}
