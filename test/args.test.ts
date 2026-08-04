import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseAddSampleCommand } from "../src/cli/add-sample.js";
import {
  assertNonInteractiveArgs,
  getPackageVersion,
  parseArgs,
  parseSampleIds,
  printHelp,
} from "../src/cli/args.js";

describe("parseArgs", () => {
  it("parses typed CLI options", () => {
    expect(
      parseArgs([
        "my-app",
        "--inline",
        "--pm",
        "yarn",
        "--template",
        "vue-ts",
        "--sample",
        "iap,iaa",
      ]),
    ).toEqual({
      _: ["my-app"],
      help: false,
      inline: true,
      listTemplates: false,
      pm: "yarn",
      sample: ["iap", "iaa"],
      tds: false,
      template: "vue-ts",
      version: false,
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseArgs(["--wat"])).toThrow("알 수 없는 옵션");
    // 의존성 설치와 ait init은 항상 실행해요. --skip-install은 지원하지 않아요.
    expect(() => parseArgs(["--skip-install"])).toThrow("알 수 없는 옵션");
  });

  it("rejects single-dash tokens instead of treating them as positional", () => {
    expect(() => parseArgs(["-wat"])).toThrow("알 수 없는 옵션이에요: -wat");
    expect(() => parseArgs(["my-app", "-t", "react-ts"])).toThrow("알 수 없는 옵션이에요: -t");
  });

  it("treats -v as an alias for --version", () => {
    expect(parseArgs(["-v"]).version).toBe(true);
    expect(parseArgs(["--version"]).version).toBe(true);
  });

  it("rejects a value-flag value that starts with a dash", () => {
    expect(() => parseArgs(["--pm", "--template"])).toThrow("--pm 옵션에 값이 필요해요");
    expect(() => parseArgs(["--template", "-react-ts"])).toThrow("--template 옵션에 값이 필요해요");
  });

  it("supports machine-readable template discovery", () => {
    expect(parseArgs(["--list-templates"]).listTemplates).toBe(true);
  });

  it("requires every decision that could otherwise open a prompt", () => {
    expect(() => assertNonInteractiveArgs(parseArgs(["--inline"]))).toThrow(
      "프로젝트 경로, --pm <npm|yarn|pnpm>, --template <프리셋> 또는 --tds",
    );
    expect(() =>
      assertNonInteractiveArgs(
        parseArgs(["my-app", "--inline", "--pm", "npm", "--template", "react-ts"]),
      ),
    ).not.toThrow();
    expect(() =>
      assertNonInteractiveArgs(parseArgs(["my-app", "--inline", "--pm", "pnpm", "--tds"])),
    ).not.toThrow();
    expect(() =>
      assertNonInteractiveArgs(
        parseArgs(["my-app", "--inline", "--pm", "npm", "--template", "react-ts", "--tds"]),
      ),
    ).toThrow("둘 중 하나만 선택");
  });

  it("explains the complete non-interactive contract", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    printHelp();

    const help = String(log.mock.calls[0]?.[0]);
    expect(help).toContain("[directory]");
    expect(help).toContain("비대화형(CI/자동화) 실행 시 필요한 값");
    expect(help).toContain("directory, --inline, --pm");
    expect(help).toContain("--template 또는 --tds");
    expect(help).toContain("react-ts");
    expect(help).toContain("--tds");
    expect(help).toContain("대화형으로 다시 묻지");
    expect(help).toContain("--version, -v");
    log.mockRestore();
  });
});

describe("getPackageVersion", () => {
  it("returns the semver from the package's own package.json", () => {
    expect(getPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("parseAddSampleCommand", () => {
  it("accepts a target directory and positional sample ids", () => {
    const command = parseAddSampleCommand(
      parseArgs(["add-sample", "./my-app", "iap,iaa", "--sample", "iap"]),
    );

    expect(command).toEqual({
      sampleIds: ["iap", "iaa"],
      targetDirectory: path.resolve("./my-app"),
    });
  });

  it("rejects multiple target directories", () => {
    expect(() => parseAddSampleCommand(parseArgs(["add-sample", "./first", "./second"]))).toThrow(
      "알 수 없는 인수",
    );
  });
});

describe("parseSampleIds", () => {
  it("deduplicates supported samples", () => {
    expect(parseSampleIds(["iap", "iap", "iaa"])).toEqual(["iap", "iaa"]);
  });

  it("rejects unsupported samples", () => {
    expect(() => parseSampleIds(["maps"])).toThrow("지원하지 않는 예제 코드");
  });
});
