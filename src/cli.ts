#!/usr/bin/env node

import { run } from "./main.js";

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ ${message}`);
  process.exitCode = 1;
});
