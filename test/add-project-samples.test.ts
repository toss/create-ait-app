import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addProjectSamples, inspectSampleProject } from "../src/scaffold/add-project-samples.js";

const temporaryDirectories: string[] = [];

function createVanillaTypeScriptProject(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-add-sample-"));
  temporaryDirectories.push(directory);
  mkdirSync(path.join(directory, "src"));
  writeFileSync(path.join(directory, "src", "main.ts"), "");
  writeFileSync(path.join(directory, "src", "style.css"), "");
  writeFileSync(path.join(directory, "tsconfig.json"), "{}");
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      createAitApp: {
        createViteVersion: "9.1.1",
        framework: "vanilla",
        originalScripts: {
          build: "tsc && vite build",
          dev: "vite",
        },
        sampleShellManaged: false,
        samples: [],
        source: "create-vite",
        template: "vanilla-ts",
      },
      devDependencies: {
        vite: "9.1.1",
      },
      scripts: {
        build: "ait build",
        dev: "granite dev",
      },
    }),
  );
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("addProjectSamples", () => {
  it("adds new samples while preserving previously installed samples", () => {
    const directory = createVanillaTypeScriptProject();

    expect(addProjectSamples(directory, ["iap"])).toMatchObject({
      addedSampleIds: ["iap"],
      installedSampleIds: ["iap"],
      skippedSampleIds: [],
    });
    expect(existsSync(path.join(directory, "src", "pages", "InAppPurchasePage.ts"))).toBe(true);

    expect(addProjectSamples(directory, ["iap", "iaa"])).toMatchObject({
      addedSampleIds: ["iaa"],
      installedSampleIds: ["iap", "iaa"],
      skippedSampleIds: ["iap"],
    });

    const main = readFileSync(path.join(directory, "src", "main.ts"), "utf8");
    expect(main).toContain("mountInAppPurchasePage");
    expect(main).toContain("mountInAppAdsPage");
    expect(inspectSampleProject(directory).installedSampleIds).toEqual(["iap", "iaa"]);
  });

  it("rejects projects without create-ait-app metadata", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-unsupported-"));
    temporaryDirectories.push(directory);
    writeFileSync(path.join(directory, "package.json"), "{}");

    expect(() => addProjectSamples(directory, ["iap"])).toThrow("create-ait-app으로 만든 프로젝트");
  });
});
