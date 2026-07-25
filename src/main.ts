import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { parseArgs, parseSampleIds, printHelp, type CliArgs } from "./args.js";
import { createBaseProject, finalizeProject, toNpmPackageName } from "./scaffold.js";
import { supportsSamples } from "./samples.js";
import { writeAiSkills } from "./skills.js";
import {
  AI_TOOLS,
  PACKAGE_MANAGERS,
  type AiTool,
  type PackageManager,
  type SampleId,
} from "./types.js";
import { detectInvokedPackageManager } from "./package-manager.js";
import { getCreateViteVersion } from "./vite.js";

function assertChoice<T extends string>(
  value: string | undefined,
  choices: readonly T[],
  label: string,
): T | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!choices.includes(value as T)) {
    throw new Error(`${label}: ${value} (${choices.join(", ")} 중 선택)`);
  }
  return value as T;
}

async function choosePackageManager(args: CliArgs): Promise<PackageManager> {
  const explicit = assertChoice(args.pm, PACKAGE_MANAGERS, "지원하지 않는 패키지 매니저입니다");
  if (explicit) return explicit;

  const detected = detectInvokedPackageManager();
  if (detected) return detected;

  if (args.inline) return "npm";
  return select({
    choices: PACKAGE_MANAGERS.map((value) => ({ name: value, value })),
    message: "사용할 패키지 매니저를 선택하세요:",
  });
}

async function chooseAiTool(args: CliArgs): Promise<AiTool | null> {
  const explicit = assertChoice(args.ai, AI_TOOLS, "지원하지 않는 AI 도구입니다");
  if (args.skills) {
    if (explicit) return explicit;
    if (args.inline) {
      throw new Error("--inline --skills 사용 시 --ai를 지정해 주세요.");
    }
    return select({
      choices: [
        { name: "Cursor", value: "cursor" },
        { name: "Claude Code", value: "claude" },
        { name: "Codex", value: "codex" },
      ],
      message: "사용하는 AI 도구를 선택하세요:",
    });
  }

  if (args.inline) return null;
  return select({
    choices: [
      { name: "Cursor", value: "cursor" },
      { name: "Claude Code", value: "claude" },
      { name: "Codex", value: "codex" },
      { name: "선택 안 함", value: null },
    ],
    message: "최신 공식 문서를 조회하는 Agent Skills를 추가할까요?",
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
        "iap/iaa 예제는 React와 Vanilla 프리셋만 지원합니다. 선택한 Vite CSR 프리셋은 예제 없이 생성해 주세요.",
      );
    }
    return explicit;
  }

  if (args.inline || !supportsSamples(framework, useTds)) {
    return [];
  }

  return checkbox({
    choices: [
      { name: "인앱결제", value: "iap" },
      { name: "인앱광고", value: "iaa" },
    ],
    message: "예제 코드를 추가할까요?",
  });
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (args._[0] === "add-sample") {
    throw new Error(
      "Vite 프리셋 전체 지원 이후 add-sample은 안전하게 앱 코드를 병합할 수 없어 제거되었습니다. 생성 시 --sample을 사용해 주세요.",
    );
  }
  if (args._.length > 1) {
    throw new Error(`알 수 없는 인수입니다: ${args._.slice(1).join(" ")}`);
  }

  const projectName =
    args._[0] ??
    (await input({
      message: "프로젝트 이름을 입력하세요:",
      required: true,
    }));
  const targetDirectory = path.resolve(process.cwd(), projectName);
  const targetExisted = existsSync(targetDirectory);

  if (targetExisted && readdirSync(targetDirectory).length > 0) {
    throw new Error(`"${projectName}" 디렉토리가 이미 존재하고 비어있지 않습니다.`);
  }

  const packageManager = await choosePackageManager(args);
  let useTds = args.tds;
  if (!args.inline && !args.tds) {
    useTds = await confirm({
      default: false,
      message: "TDS를 사용할까요? (React 18 전용 템플릿 사용)",
    });
  }
  if (useTds && args.template && !["react-ts", "react-ts-tds"].includes(args.template)) {
    throw new Error("--tds는 react-ts 프리셋에서만 사용할 수 있습니다.");
  }

  const template = useTds ? "react-ts" : (args.template ?? (args.inline ? "react-ts" : undefined));
  const packageName = toNpmPackageName(path.basename(projectName));

  console.log(
    useTds
      ? "\n🚀 React 18 + TDS 전용 템플릿을 생성합니다.\n"
      : `\n🚀 create-vite@${getCreateViteVersion()}로 CSR 프로젝트를 생성합니다.\n`,
  );

  try {
    const baseProject = createBaseProject({
      packageName,
      targetDirectory,
      template,
      useTds,
    });
    const sampleIds = await chooseSamples(args, baseProject.framework, useTds);
    const aiTool = await chooseAiTool(args);

    finalizeProject({
      baseProject,
      packageManager,
      packageName,
      sampleIds,
      skipInstall: args.skipInstall,
      targetDirectory,
      useTds,
    });

    if (aiTool) {
      writeAiSkills({ aiTool, targetDirectory, useTds });
    }

    const devCommand = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    console.log(`
✅ 프로젝트가 생성되었습니다.

  기반: ${useTds ? "React 18 + TDS template" : `create-vite@${getCreateViteVersion()}${baseProject.template ? ` (${baseProject.template})` : ""}`}
  cd ${projectName}
  ${devCommand}
`);
  } catch (error) {
    if (!targetExisted && existsSync(targetDirectory)) {
      rmSync(targetDirectory, { force: true, recursive: true });
    }
    throw error;
  }
}
