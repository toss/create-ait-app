import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    neverBundle: true,
  },
  dts: true,
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
  exports: true,
  format: "esm",
  platform: "node",
  sourcemap: true,
  target: "node24",
});
