import crossSpawn from "cross-spawn";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/system/command.js";

vi.mock("cross-spawn", () => ({
  default: { sync: vi.fn() },
}));

const mockedSync = vi.mocked(crossSpawn.sync);

beforeEach(() => {
  mockedSync.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runCommand quiet mode", () => {
  it("captures stdout/stderr via pipe and writes nothing when the command succeeds", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    mockedSync.mockReturnValue({
      error: undefined,
      output: [null, Buffer.from("scaffolding info\n"), Buffer.from("")],
      pid: 1,
      signal: null,
      status: 0,
      stderr: Buffer.from(""),
      stdout: Buffer.from("scaffolding info\n"),
    });

    runCommand({ command: "create-vite", quiet: true });

    expect(mockedSync).toHaveBeenCalledWith(
      "create-vite",
      [],
      expect.objectContaining({
        maxBuffer: 10 * 1024 * 1024,
        stdio: "pipe",
      }),
    );
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("flushes captured output to stderr and still throws when the command fails", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    mockedSync.mockReturnValue({
      error: undefined,
      output: [null, Buffer.from("partial progress\n"), Buffer.from("boom\n")],
      pid: 1,
      signal: null,
      status: 1,
      stderr: Buffer.from("boom\n"),
      stdout: Buffer.from("partial progress\n"),
    });

    expect(() => runCommand({ args: ["a"], command: "create-vite", quiet: true })).toThrow(
      /create-vite a 명령이 종료 코드 1로 실패했어요\./,
    );

    expect(writeSpy).toHaveBeenCalledWith(Buffer.from("partial progress\n"));
    expect(writeSpy).toHaveBeenCalledWith(Buffer.from("boom\n"));
  });

  it("flushes captured output and rethrows the spawn error itself when the process could not start", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const spawnError = new Error("ENOENT");
    mockedSync.mockReturnValue({
      error: spawnError,
      output: [null, Buffer.from(""), Buffer.from("")],
      pid: 1,
      signal: null,
      status: null,
      stderr: Buffer.from(""),
      stdout: Buffer.from(""),
    });

    expect(() => runCommand({ command: "missing-binary", quiet: true })).toThrow(spawnError);
    expect(writeSpy).toHaveBeenCalled();
  });

  it("keeps inheriting stdio and skips capture when quiet is not set", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    mockedSync.mockReturnValue({
      error: undefined,
      // "inherit" 모드에서 실제로는 null이지만, 타입 오버로드가 요구하는
      // Buffer 반환 형태를 맞춰요 — 이 테스트는 quiet=false일 때 stdio 옵션이
      // "inherit"으로 전달되고 stderr에 아무것도 쓰지 않는지만 확인해요.
      output: [null, Buffer.alloc(0), Buffer.alloc(0)],
      pid: 1,
      signal: null,
      status: 0,
      stderr: Buffer.alloc(0),
      stdout: Buffer.alloc(0),
    });

    runCommand({ command: "create-vite" });

    expect(mockedSync).toHaveBeenCalledWith(
      "create-vite",
      [],
      expect.objectContaining({
        maxBuffer: undefined,
        stdio: "inherit",
      }),
    );
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
