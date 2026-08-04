import { describe, expect, it } from "vitest";
import { quoteForShell } from "../src/system/shell-quote.js";

describe("quoteForShell", () => {
  it("leaves a safe token untouched", () => {
    expect(quoteForShell("my-app")).toBe("my-app");
    expect(quoteForShell("./packages/my-app")).toBe("./packages/my-app");
    expect(quoteForShell(".")).toBe(".");
  });

  it("quotes a value that contains whitespace", () => {
    expect(quoteForShell("my app")).toBe('"my app"');
  });

  it("escapes backslashes, double quotes, dollar signs, and backticks", () => {
    expect(quoteForShell('a"b')).toBe('"a\\"b"');
    expect(quoteForShell("a\\b")).toBe('"a\\\\b"');
    expect(quoteForShell("a$b")).toBe('"a\\$b"');
    expect(quoteForShell("a`b")).toBe('"a\\`b"');
  });

  it("quotes a value containing shell metacharacters like semicolons", () => {
    expect(quoteForShell("a;rm -rf /")).toBe('"a;rm -rf /"');
  });
});
