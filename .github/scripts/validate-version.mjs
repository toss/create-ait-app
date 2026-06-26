#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function parseVersion(version) {
  const match = version.match(SEMVER_RE);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? "",
  };
}

function compareVersions(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && !b.prerelease) return 0;

  return a.prerelease.localeCompare(b.prerelease);
}

function getPreviousVersion() {
  try {
    const json = execSync("git show HEAD~1:package.json", { encoding: "utf8" });
    return JSON.parse(json).version;
  } catch {
    return null;
  }
}

function main() {
  const { version: current } = JSON.parse(readFileSync("package.json", "utf8"));
  const previous = getPreviousVersion();

  const currentParsed = parseVersion(current);
  if (!currentParsed) {
    console.error(`Invalid semver: "${current}"`);
    process.exit(1);
  }

  if (!previous) {
    console.log(`No previous version to compare. Accepting "${current}".`);
    return;
  }

  const previousParsed = parseVersion(previous);
  if (!previousParsed) {
    console.error(`Invalid previous semver: "${previous}"`);
    process.exit(1);
  }

  if (compareVersions(currentParsed, previousParsed) <= 0) {
    console.error(
      `Version must be greater than the previous version (${previous} -> ${current}).`,
    );
    process.exit(1);
  }

  console.log(`Valid version bump: ${previous} -> ${current}`);
}

main();
