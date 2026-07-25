import { describe, expect, it } from "vitest";
import { parseArgs, parseSampleIds } from "../src/args.js";

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
        "--ai",
        "codex",
        "--sample",
        "iap,iaa",
        "--skip-install",
      ]),
    ).toEqual({
      _: ["my-app"],
      ai: "codex",
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

describe("parseSampleIds", () => {
  it("deduplicates supported samples", () => {
    expect(parseSampleIds(["iap", "iap", "iaa"])).toEqual(["iap", "iaa"]);
  });

  it("rejects unsupported samples", () => {
    expect(() => parseSampleIds(["maps"])).toThrow("지원하지 않는 예제 코드");
  });
});
