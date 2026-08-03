import { confirm } from "@inquirer/prompts";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { detectProjectPackageManager } from "../package-manager/package-manager.js";
import {
  adoptExistingProject,
  resolveExistingPackageName,
} from "../scaffold/adopt-existing-project.js";
import { finalizeProject } from "../scaffold/finalize-project.js";
import { installProjectSkills } from "../skills/install-skills.js";
import type { CliArgs } from "./args.js";
import { choosePackageManager, chooseSkills } from "./prompts.js";

export interface InitCommand {
  targetDirectory: string;
}

export function parseInitCommand(args: CliArgs): InitCommand {
  const positionals = args._.slice(1);
  if (positionals.length > 1) {
    throw new Error(`알 수 없는 인수예요: ${positionals.slice(1).join(" ")}`);
  }

  if (args.template) {
    throw new Error("init은 --template을 지원하지 않아요. 이미 있는 Vite 설정을 그대로 사용해요.");
  }
  if (args.tds) {
    throw new Error("init은 --tds를 지원하지 않아요. 이미 있는 Vite 설정을 그대로 사용해요.");
  }
  if (args.sample.length > 0) {
    throw new Error(
      "init은 --sample을 지원하지 않아요. 기존 Vite 프로젝트는 App/main 진입 파일을 create-ait-app이 관리하지 않아서 예제 코드를 자동으로 추가할 수 없어요.",
    );
  }

  if (args.inline && !args.pm) {
    throw new Error(
      "비대화형 실행에 필요한 값이 빠졌어요: --pm <npm|yarn|pnpm>. 사용 가능한 선택지는 --help에서 확인해 주세요.",
    );
  }

  return {
    targetDirectory: path.resolve(process.cwd(), positionals[0] ?? "."),
  };
}

export async function runInit(args: CliArgs): Promise<void> {
  const { targetDirectory } = parseInitCommand(args);
  if (!existsSync(targetDirectory) || !statSync(targetDirectory).isDirectory()) {
    throw new Error(`디렉터리를 찾을 수 없어요: ${targetDirectory}`);
  }

  // 인수 없이 실행하면 현재 디렉터리를 대상으로 삼기 때문에, 어떤 프로젝트를
  // 건드릴지 항상 먼저 밝혀요. --inline에는 확인 프롬프트가 없어서 여기서 알리는
  // 게 실행 결과를 확인할 유일한 방법이에요.
  console.log(`\n대상 디렉터리: ${targetDirectory}`);

  // adoptExistingProject는 아무것도 쓰지 않는 가드예요(assertAdoptableProject +
  // assertCsrViteProject). 프롬프트(choosePackageManager/chooseSkills/confirm)도
  // 아직 파일을 건드리지 않으므로, 실패해도 "변경이 중간에 멈췄다"는 안내는
  // 맞지 않아요 — 그 안내는 실제로 쓰기 시작하는 finalizeProject부터만 필요해요.
  const baseProject = adoptExistingProject(targetDirectory);
  const packageName = resolveExistingPackageName(
    baseProject.inspection.packageJson,
    targetDirectory,
  );
  const originalDeployCommand = baseProject.inspection.packageJson.scripts?.deploy;

  const detectedPackageManager = detectProjectPackageManager(targetDirectory);
  const packageManager = await choosePackageManager(args, detectedPackageManager);
  if (detectedPackageManager && detectedPackageManager !== packageManager) {
    console.warn(
      `\n⚠️ 감지된 패키지 매니저(${detectedPackageManager})와 선택한 패키지 매니저(${packageManager})가 달라요. 락파일이 두 개 생길 수 있으니 확인해 주세요.\n`,
    );
  }

  // Skills 설치 여부는 실제로 진행하기로 확정한 뒤에 물어봐요 — confirm보다 먼저
  // 물으면 사용자가 "계속할까요?"에 답하기도 전에 별개의 기능 선택을 강요받고,
  // 아래 미리보기도 아직 결정되지 않은 Skills 파일까지 다뤄야 하는 상황이 생겨요.
  if (!args.inline) {
    console.log(`
다음을 바꿀 예정이에요.

  package.json           — dev는 그대로 두고 dev:vite로 복사해요. build는
                            build:vite로 복사한 뒤 원본 뒤에 ait build를 이어
                            실행하도록 바꿔요. deploy만 deploy:original로 옮기고
                            ait deploy로 바꿔요. @apps-in-toss/web-framework
                            의존성을 추가해요
  apps-in-toss.config.ts — 새로 만들어요
  README.md              — Apps in Toss 절을 추가해요
`);
    const proceed = await confirm({ default: true, message: "계속할까요?" });
    if (!proceed) {
      console.log("\n아무것도 바꾸지 않았어요.\n");
      return;
    }
  }

  const installSkills = await chooseSkills(args);

  try {
    finalizeProject({
      baseProject,
      packageManager,
      packageName,
      sampleIds: [],
      skipInstall: args.skipInstall,
      targetDirectory,
      useTds: false,
    });

    if (installSkills) {
      installProjectSkills({ targetDirectory, useTds: false });
    }

    const devCommand = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    const deployCommand = packageManager === "npm" ? "npm run deploy" : `${packageManager} deploy`;

    console.log(`
✅ 기존 프로젝트를 Apps in Toss 프로젝트로 전환했어요.

  ${devCommand}
  ${deployCommand}
${originalDeployCommand ? "\n  원래 deploy 스크립트는 deploy:original로 보존했어요.\n" : ""}
apps-in-toss.config.ts의 webBundleDir("dist")가 Vite의 outDir과 일치하는지 확인해 주세요.
모노레포라면 --skip-install로 설치를 생략하고 워크스페이스 루트에서 직접 설치해 주세요.
예제 코드(add-sample)는 직접 작성한 App/main 진입 파일이라 자동으로 추가할 수 없어요.
`);
  } catch (error) {
    console.error(
      "\n변경이 중간에 멈췄어요. package.json과 apps-in-toss.config.ts를 확인해 주세요.",
    );
    throw error;
  }
}
