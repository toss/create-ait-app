import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAddSampleCommand } from "../src/cli/add-sample.js";
import { parseArgs, parseSampleIds } from "../src/cli/args.js";

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
        "--skills",
        "--sample",
        "iap,iaa",
        "--skip-install",
      ]),
    ).toEqual({
      _: ["my-app"],
      help: false,
      inline: true,
      pm: "yarn",
      sample: ["iap", "iaa"],
      skills: true,
      skipInstall: true,
      tds: false,
      template: "vue-ts",
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseArgs(["--wat"])).toThrow("알 수 없는 옵션");
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
