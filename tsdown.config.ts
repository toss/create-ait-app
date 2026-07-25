import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    neverBundle: true,
  },
  dts: false,
  entry: {
    cli: "src/index.ts",
  },
  exports: {
    bin: false,
  },
  format: "esm",
  platform: "node",
  sourcemap: true,
  target: "node24",
});
