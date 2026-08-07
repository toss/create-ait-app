import { describe, expect, it, vi } from "vitest";
import {
  resolveWebFrameworkDependencySpecifier,
  resolveWebFrameworkVersion,
} from "../src/apps-in-toss/resolve-web-framework-version.js";
import { runCommandCapture } from "../src/system/command.js";

vi.mock("../src/system/command.js", () => ({
  runCommandCapture: vi.fn(),
}));

const mockedRunCommandCapture = vi.mocked(runCommandCapture);

describe("resolveWebFrameworkVersion", () => {
  it("ignores the 'latest' dist-tag and picks the highest stable version within the supported major", () => {
    // 실측(toss/create-ait-app#33)처럼 dist-tag가 가리키는 2.x와 최신 3.x가
    // 함께 발행돼 있는 상황을 재현해요. beta/rc 프리릴리스나 지원 메이저를
    // 벗어난 4.x가 섞여 있어도 안정 3.x 중 최신만 골라야 해요.
    mockedRunCommandCapture.mockReturnValue(
      JSON.stringify(["2.10.8", "3.0.0-beta.1", "3.0.0-rc.0", "3.0.1", "3.0.2", "4.0.0-beta.1"]),
    );

    expect(resolveWebFrameworkVersion("latest")).toBe("3.0.2");
    expect(mockedRunCommandCapture).toHaveBeenCalledWith({
      args: ["view", "@apps-in-toss/web-framework", "versions", "--json"],
      command: "npm",
    });
  });

  it("throws when no stable version exists for the supported major", () => {
    mockedRunCommandCapture.mockReturnValue(JSON.stringify(["2.10.8", "2.11.0"]));

    expect(() => resolveWebFrameworkVersion("latest")).toThrow(
      /메이저 3 안정 버전을 찾지 못했어요/,
    );
  });

  it("resolves a prerelease channel through its dist-tag", () => {
    mockedRunCommandCapture.mockReturnValue(JSON.stringify("3.1.0-beta.4"));

    expect(resolveWebFrameworkVersion("beta")).toBe("3.1.0-beta.4");
    expect(mockedRunCommandCapture).toHaveBeenCalledWith({
      args: ["view", "@apps-in-toss/web-framework@beta", "version", "--json"],
      command: "npm",
    });
  });

  it("throws when a prerelease channel points outside the supported major", () => {
    mockedRunCommandCapture.mockReturnValue(JSON.stringify("2.9.0-rc.1"));

    expect(() => resolveWebFrameworkVersion("rc")).toThrow(/메이저 3 산출물만 지원해요/);
  });
});

describe("resolveWebFrameworkDependencySpecifier", () => {
  it("returns a caret range on success", () => {
    mockedRunCommandCapture.mockReturnValue(JSON.stringify(["3.0.1", "3.0.2"]));

    expect(resolveWebFrameworkDependencySpecifier("latest")).toBe("^3.0.2");
  });

  it("falls back to the literal channel and warns when resolution fails", () => {
    mockedRunCommandCapture.mockImplementation(() => {
      throw new Error("network unreachable");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(resolveWebFrameworkDependencySpecifier("latest")).toBe("latest");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("network unreachable");

    warn.mockRestore();
  });
});
