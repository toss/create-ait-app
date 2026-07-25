import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import {
  detectInvokedPackageManager,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "../package-manager/package-manager.js";
import { applyProjectSamples } from "../scaffold/apply-project-samples.js";
import { createBaseProject, toNpmPackageName } from "../scaffold/create-base-project.js";
import { initializeAitProject } from "../scaffold/initialize-ait-project.js";
import { installProjectDependencies } from "../scaffold/install-project-dependencies.js";
import { supportsSamples, type SampleId } from "../samples/apply-samples.js";
import { AI_TOOLS, type AiTool, installProjectSkills } from "../skills/install-skills.js";
import { getCreateViteVersion } from "../vite/create-vite.js";
import { parseArgs, parseSampleIds, printHelp, type CliArgs } from "./args.js";

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
  const explicit = assertChoice(args.pm, PACKAGE_MANAGERS, "지원하지 않는 패키지 매니저예요");
  if (explicit) return explicit;

  const detected = detectInvokedPackageManager();
  if (detected) return detected;

  if (args.inline) return "npm";
  return select({
    choices: PACKAGE_MANAGERS.map((value) => ({ name: value, value })),
    message: "사용할 패키지 매니저를 골라 주세요:",
  });
}

async function chooseAiTool(args: CliArgs): Promise<AiTool | null> {
  const explicit = assertChoice(args.ai, AI_TOOLS, "지원하지 않는 AI 도구예요");
  if (args.skills) {
    if (explicit) return explicit;
    if (args.inline) {
      throw new Error("--inline --skills를 사용할 때는 --ai도 지정해 주세요.");
    }
    return select({
      choices: [
        { name: "Cursor", value: "cursor" },
        { name: "Claude Code", value: "claude" },
        { name: "Codex", value: "codex" },
      ],
      message: "사용하는 AI 도구를 골라 주세요:",
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
  if (args.help) {
    printHelp();
    return;
  }
  if (args._[0] === "add-sample") {
    throw new Error(
      "앱 코드를 안전하게 합치기 어려워 add-sample을 제거했어요. 프로젝트를 만들 때 --sample을 사용해 주세요.",
    );
  }
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

  if (targetExisted && readdirSync(targetDirectory).length > 0) {
    throw new Error(`"${projectName}" 디렉터리가 이미 있고 비어 있지 않아요.`);
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
    throw new Error("--tds는 react-ts 프리셋에서만 사용할 수 있어요.");
  }

  const template = useTds ? "react-ts" : (args.template ?? (args.inline ? "react-ts" : undefined));
  const packageName = toNpmPackageName(path.basename(projectName));

  console.log(
    useTds
      ? "\n🚀 React 18 + TDS 전용 템플릿을 만들어요.\n"
      : `\n🚀 create-vite@${getCreateViteVersion()}로 정적 클라이언트 프로젝트를 만들어요.\n`,
  );

  try {
    const baseProject = createBaseProject({
      packageName,
      targetDirectory,
      template,
      useTds,
    });

    initializeAitProject({
      baseProject,
      packageManager,
      packageName,
      targetDirectory,
    });

    const sampleIds = await chooseSamples(args, baseProject.framework, useTds);
    const aiTool = await chooseAiTool(args);

    applyProjectSamples({
      baseProject,
      sampleIds,
      targetDirectory,
      useTds,
    });
    installProjectDependencies({
      packageManager,
      skipInstall: args.skipInstall,
      targetDirectory,
    });

    if (aiTool) {
      installProjectSkills({ aiTool, targetDirectory, useTds });
    }

    const devCommand = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    console.log(`
✅ 프로젝트가 생성됐어요.

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
