#!/usr/bin/env node

import { execSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import semver from "semver";

function getPreviousVersion() {
  try {
    const json = execSync("git show HEAD~1:package.json", { encoding: "utf8" });
    return JSON.parse(json).version;
  } catch {
    return null;
  }
}

export function validateVersion(current, previous, publishTag) {
  if (!semver.valid(current)) {
    throw new Error(`Invalid semver: "${current}"`);
  }

  if (!previous) {
    return getRelease(current, publishTag);
  }

  if (!semver.valid(previous)) {
    throw new Error(`Invalid previous semver: "${previous}"`);
  }

  if (!semver.gt(current, previous)) {
    throw new Error(
      `Version must be greater than the previous version (${previous} -> ${current}).`,
    );
  }

  return getRelease(current, publishTag);
}

function getRelease(version, publishTag) {
  const prerelease = semver.prerelease(version);
  if (!prerelease) {
    if (publishTag !== undefined && publishTag !== "latest" && publishTag !== "next") {
      throw new Error(`Only latest and next are allowed as publishConfig.tag: "${publishTag}"`);
    }
    return { npmTag: publishTag ?? "latest", prerelease: false };
  }

  if (publishTag !== undefined) {
    throw new Error(`publishConfig.tag cannot be combined with a prerelease version: "${version}"`);
  }

  const channel = prerelease[0];
  if (channel !== "beta" && channel !== "rc") {
    throw new Error(`Only beta and rc prereleases can be published: "${version}"`);
  }

  return { npmTag: channel, prerelease: true };
}

function main() {
  try {
    const { version: current, publishConfig } = JSON.parse(readFileSync("package.json", "utf8"));
    const previous = getPreviousVersion();
    const release = validateVersion(current, previous, publishConfig?.tag);

    if (previous) {
      console.log(`Valid version bump: ${previous} -> ${current}`);
    } else {
      console.log(`No previous version to compare. Accepting "${current}".`);
    }
    console.log(`npm dist-tag: ${release.npmTag}`);

    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `tag=${release.npmTag}\nprerelease=${release.prerelease}\n`,
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
