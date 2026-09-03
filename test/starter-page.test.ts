import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getSupportedViteTemplates } from "../src/vite/create-vite.js";
import {
  applyViteStarterPage,
  getViteStarterTemplateDefinition,
  getViteStarterTemplates,
  isUnmodifiedViteStarterEntry,
  resolveViteStarterTemplate,
} from "../src/vite/starter-page.js";
import type { FrameworkKind } from "../src/project/framework.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true });
  }
  temporaryDirectories.length = 0;
});

describe("Vite starter pages", () => {
  it("has an Apps in Toss starter for every supported create-vite preset", () => {
    expect(getViteStarterTemplates()).toEqual(getSupportedViteTemplates());
  });

  it("resolves the starter selected by interactive create-vite from project inspection", () => {
    expect(resolveViteStarterTemplate("vue", true)).toBe("vue-ts");
    expect(resolveViteStarterTemplate("svelte", false)).toBe("svelte");
    expect(resolveViteStarterTemplate("unknown", false)).toBeNull();
  });

  it.each(getViteStarterTemplates())(
    "overlays %s at its native entry and CSS paths",
    (template) => {
      const directory = mkdtempSync(path.join(tmpdir(), `create-ait-starter-${template}-`));
      temporaryDirectories.push(directory);
      mkdirSync(path.join(directory, "src"));
      mkdirSync(path.join(directory, "public"));

      applyViteStarterPage(directory, template);

      const definition = getViteStarterTemplateDefinition(template);
      const entry = readFileSync(path.join(directory, definition.entryPath), "utf8");
      expect(readFileSync(path.join(directory, "index.html"), "utf8")).toContain(
        '<html lang="ko">',
      );
      expect(entry).toContain("반가워요");
      expect(entry).toContain("앱인토스 개발을 시작해 보세요.");
      expect(entry).toContain("developers-apps-in-toss.toss.im");
      expect(entry).toContain("techchat-apps-in-toss.toss.im");
      expect(existsSync(path.join(directory, "public", "appsintoss-logo.png"))).toBe(true);

      if (definition.stylePath) {
        expect(readFileSync(path.join(directory, definition.stylePath), "utf8")).toContain(
          ".app-actions",
        );
      }
      if (definition.globalStylePath) {
        expect(readFileSync(path.join(directory, definition.globalStylePath), "utf8")).toContain(
          "#app",
        );
      }
      if (definition.pageStylePath) {
        expect(readFileSync(path.join(directory, definition.pageStylePath), "utf8")).toContain(
          ".app-actions",
        );
      }
    },
  );

  it.each([
    ["react", true, "react-ts"],
    ["react", false, "react"],
    ["vanilla", true, "vanilla-ts"],
    ["vanilla", false, "vanilla"],
  ] as const)(
    "recognizes an untouched %s starter as a safe sample source",
    (framework, isTypeScript, template) => {
      const directory = mkdtempSync(path.join(tmpdir(), `create-ait-pristine-${template}-`));
      temporaryDirectories.push(directory);
      mkdirSync(path.join(directory, "src"));
      mkdirSync(path.join(directory, "public"));
      applyViteStarterPage(directory, template);

      expect(
        isUnmodifiedViteStarterEntry({
          framework: framework as FrameworkKind,
          isTypeScript,
          targetDirectory: directory,
        }),
      ).toBe(true);
    },
  );
});
