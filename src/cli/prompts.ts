import { confirm, select } from "@inquirer/prompts";
import {
  detectInvokedPackageManager,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "../package-manager/package-manager.js";
import type { CliArgs } from "./args.js";

export function assertChoice<T extends string>(
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

export async function choosePackageManager(
  args: CliArgs,
  preferred?: PackageManager | null,
): Promise<PackageManager> {
  const explicit = assertChoice(args.pm, PACKAGE_MANAGERS, "지원하지 않는 패키지 매니저예요");
  if (explicit) return explicit;

  if (preferred != null) return preferred;

  const detected = detectInvokedPackageManager();
  if (detected) return detected;

  return select({
    choices: PACKAGE_MANAGERS.map((value) => ({ name: value, value })),
    message: "사용할 패키지 매니저를 골라 주세요:",
  });
}

export async function chooseSkills(args: CliArgs): Promise<boolean> {
  if (args.skills) return true;
  if (args.inline) return false;
  return confirm({
    default: false,
    message: "Agent Skills를 추가할까요?",
  });
}
