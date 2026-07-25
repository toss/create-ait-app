import { describe, expect, it } from "vitest";
import { getBundledViteTemplates, getCreateViteVersion, resolveViteTemplate } from "../src/vite.js";

describe("pinned create-vite", () => {
  it("uses an exact version and discovers its bundled templates", () => {
    expect(getCreateViteVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(getBundledViteTemplates()).toEqual(
      expect.arrayContaining(["vanilla", "react-ts", "vue-ts", "svelte-ts", "solid-ts"]),
    );
  });

  it("keeps backward-compatible vanilla aliases", () => {
    expect(resolveViteTemplate("js")).toBe("vanilla");
    expect(resolveViteTemplate("ts")).toBe("vanilla-ts");
    expect(resolveViteTemplate("qwik-ts")).toBe("qwik-ts");
  });
});
