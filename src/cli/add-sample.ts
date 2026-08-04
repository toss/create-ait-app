import { checkbox } from "@inquirer/prompts";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { addProjectSamples, inspectSampleProject } from "../scaffold/add-project-samples.js";
import { SAMPLE_IDS, type SampleId } from "../samples/apply-samples.js";
import { parseSampleIds, type CliArgs } from "./args.js";

export interface AddSampleCommand {
  sampleIds: SampleId[];
  targetDirectory: string;
}

export function parseAddSampleCommand(args: CliArgs): AddSampleCommand {
  let target = ".";
  let targetWasSet = false;
  const positionalSamples: string[] = [];

  for (const token of args._.slice(1)) {
    const values = token.split(",").filter(Boolean);
    if (values.length > 0 && values.every((value) => SAMPLE_IDS.includes(value as SampleId))) {
      positionalSamples.push(...values);
      continue;
    }
    if (targetWasSet) {
      throw new Error(`알 수 없는 인수예요: ${token}`);
    }
    target = token;
    targetWasSet = true;
  }

  return {
    sampleIds: parseSampleIds([...args.sample, ...positionalSamples]),
    targetDirectory: path.resolve(process.cwd(), target),
  };
}

export async function runAddSample(args: CliArgs): Promise<void> {
  const command = parseAddSampleCommand(args);
  if (!existsSync(command.targetDirectory) || !statSync(command.targetDirectory).isDirectory()) {
    throw new Error(`디렉터리를 찾을 수 없어요: ${command.targetDirectory}`);
  }

  const project = inspectSampleProject(command.targetDirectory);
  let sampleIds = command.sampleIds;

  if (sampleIds.length === 0) {
    const availableSampleIds = SAMPLE_IDS.filter(
      (sampleId) => !project.installedSampleIds.includes(sampleId),
    );
    if (availableSampleIds.length === 0) {
      console.log("\n✅ 예제 코드를 이미 모두 추가했어요.");
      return;
    }
    if (args.inline) {
      throw new Error("프롬프트 없이 추가하려면 --sample을 지정해 주세요.");
    }

    sampleIds = await checkbox({
      choices: availableSampleIds.map((sampleId) => ({
        name: sampleId === "iap" ? "인앱 결제" : "인앱 광고",
        value: sampleId,
      })),
      message: "추가할 예제 코드를 골라 주세요:",
    });
  }

  const result = addProjectSamples(command.targetDirectory, sampleIds);
  if (result.skippedSampleIds.length > 0) {
    console.log(`\nℹ️ ${result.skippedSampleIds.join(", ")} 예제는 이미 있어서 건너뛰어요.`);
  }
  if (result.addedSampleIds.length === 0) {
    console.log("\n✅ 새로 추가할 예제 코드가 없어요.");
    return;
  }

  console.log(`
✅ 예제 코드를 추가했어요.

  ${result.addedSampleIds.join(", ")}
`);
}
