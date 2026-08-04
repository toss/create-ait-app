import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseAddSampleCommand } from "../src/cli/add-sample.js";
import { assertNonInteractiveArgs, parseArgs, parseSampleIds, printHelp } from "../src/cli/args.js";

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
        "--skip-install",
      ]),
    ).toEqual({
      _: ["my-app"],
      help: false,
      inline: true,
      listTemplates: false,
      pm: "yarn",
      sample: ["iap", "iaa"],
      skipInstall: true,
      tds: false,
      template: "vue-ts",
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseArgs(["--wat"])).toThrow("알 수 없는 옵션");
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
    expect(help).toContain("에이전트·CI 비대화형 실행");
    expect(help).toContain("프로젝트 경로, --inline, --pm");
    expect(help).toContain("--template 또는 --tds");
    expect(help).toContain("react-ts");
    expect(help).toContain("--tds");
    expect(help).toContain("대화형으로 묻지 않아요");
    expect(help).toContain("일반 Vite 프로젝트가 기본이에요");
    expect(help).toContain("사용자에게 TDS 사용을 비권장한다고 안내해 주세요");
    log.mockRestore();
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
