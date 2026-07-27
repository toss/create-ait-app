import { describe, expect, it } from "vitest";
import { isMergedAfterTag } from "../.github/scripts/collect-release-notes.mjs";
import { validateVersion } from "../.github/scripts/validate-version.mjs";

describe("release version policy", () => {
  it("publishes stable versions to latest", () => {
    expect(validateVersion("1.0.0", "1.0.0-rc.2")).toEqual({
      npmTag: "latest",
      prerelease: false,
    });
  });

  it("publishes rc versions to rc using semver ordering", () => {
    expect(validateVersion("1.0.0-rc.10", "1.0.0-rc.2")).toEqual({
      npmTag: "rc",
      prerelease: true,
    });
  });

  it("publishes beta versions to beta", () => {
    expect(validateVersion("1.0.0-beta.1", "1.0.0-beta.0")).toEqual({
      npmTag: "beta",
      prerelease: true,
    });
  });

  it("rejects unsupported prerelease channels", () => {
    expect(() => validateVersion("1.0.0-alpha.1", "0.9.0")).toThrow(
      'Only beta and rc prereleases can be published: "1.0.0-alpha.1"',
    );
  });

  it("rejects versions that do not advance", () => {
    expect(() => validateVersion("1.0.0-rc.1", "1.0.0-rc.2")).toThrow(
      "Version must be greater than the previous version",
    );
  });
});

describe("release note range", () => {
  const ancestors = new Set([
    "previous:included",
    "previous:future",
    "previous:HEAD",
    "included:HEAD",
    "previous:previous",
  ]);
  const isAncestor = (ancestor, descendant) => ancestors.has(`${ancestor}:${descendant}`);

  it("includes only merges reachable from the release HEAD and strictly after the tag", () => {
    expect(isMergedAfterTag("included", "previous", "HEAD", isAncestor)).toBe(true);
    expect(isMergedAfterTag("future", "previous", "HEAD", isAncestor)).toBe(false);
    expect(isMergedAfterTag("previous", "previous", "HEAD", isAncestor)).toBe(false);
  });

  it("still excludes future merges when there is no previous tag", () => {
    expect(isMergedAfterTag("included", null, "HEAD", isAncestor)).toBe(true);
    expect(isMergedAfterTag("future", null, "HEAD", isAncestor)).toBe(false);
  });
});
