import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/system/command.js";

const syncMock = vi.fn();

vi.mock("cross-spawn", () => ({
  default: { sync: (...args: unknown[]) => syncMock(...args) },
}));

describe("runCommand", () => {
  let stderrWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    syncMock.mockReset();
    stderrWriteSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrWriteSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("spawns with stdio inherit by default", () => {
    syncMock.mockReturnValue({ status: 0 });

    runCommand({ args: ["install"], command: "npm" });

    expect(syncMock).toHaveBeenCalledWith(
      "npm",
      ["install"],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("removes unsetEnv keys from the spawned environment", () => {
    syncMock.mockReturnValue({ status: 0 });
    vi.stubEnv("NODE_OPTIONS", "--test-flag");

    runCommand({ args: [], command: "npm", unsetEnv: ["NODE_OPTIONS"] });

    const [, , spawnOptions] = syncMock.mock.calls[0] as [
      unknown,
      unknown,
      { env: NodeJS.ProcessEnv },
    ];
    expect(spawnOptions.env.NODE_OPTIONS).toBeUndefined();
  });

  it("does not write to stderr when a quiet command succeeds", () => {
    syncMock.mockReturnValue({
      status: 0,
      stderr: Buffer.from(""),
      stdout: Buffer.from("some output"),
    });

    runCommand({ args: [], command: "npm", quiet: true });

    expect(syncMock).toHaveBeenCalledWith(
      "npm",
      [],
      expect.objectContaining({ maxBuffer: 10 * 1024 * 1024, stdio: "pipe" }),
    );
    expect(stderrWriteSpy).not.toHaveBeenCalled();
  });

  it("flushes captured stdout/stderr when a quiet command exits non-zero", () => {
    syncMock.mockReturnValue({
      status: 1,
      stderr: Buffer.from("stderr output"),
      stdout: Buffer.from("stdout output"),
    });

    expect(() => runCommand({ args: [], command: "npm", quiet: true })).toThrow(
      /명령이 종료 코드 1로 실패했어요/,
    );

    expect(stderrWriteSpy).toHaveBeenCalledWith(Buffer.from("stdout output"));
    expect(stderrWriteSpy).toHaveBeenCalledWith(Buffer.from("stderr output"));
  });

  it("flushes captured stdout/stderr and rethrows when the spawn itself errors", () => {
    const spawnError = new Error("spawn failed");
    syncMock.mockReturnValue({
      error: spawnError,
      status: null,
      stderr: Buffer.from("stderr output"),
      stdout: Buffer.from(""),
    });

    expect(() => runCommand({ args: [], command: "npm", quiet: true })).toThrow(spawnError);

    expect(stderrWriteSpy).toHaveBeenCalledWith(Buffer.from("stderr output"));
  });
});
