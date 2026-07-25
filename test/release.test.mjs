import { describe, expect, it } from "vitest";
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
