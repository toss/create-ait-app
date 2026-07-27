#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getPreviousTag() {
  try {
    return run("git", ["describe", "--tags", "--abbrev=0", "HEAD^"]);
  } catch {
    return null;
  }
}

function getMergedPullRequests(baseBranch) {
  const json = run("gh", [
    "pr",
    "list",
    "--state",
    "merged",
    "--base",
    baseBranch,
    "--limit",
    "100",
    "--json",
    "number,title,body,mergeCommit,mergedAt",
  ]);
  return JSON.parse(json);
}

function extractReleaseNotes(body) {
  if (!body) return null;

  const lines = body.split("\n");
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^##\s*Release Notes\s*$/i.test(lines[i])) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return null;

  const section = [];
  for (let i = start; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break;
    section.push(lines[i]);
  }

  const text = section.join("\n").trim();
  const meaningful = text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");

  if (!meaningful || /^(해당 없음|n\/a|none)$/i.test(meaningful)) {
    return null;
  }

  return text;
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function isMergedAfterTag(
  mergeCommitOid,
  previousTag,
  head = "HEAD",
  ancestorCheck = isAncestor,
) {
  if (!ancestorCheck(mergeCommitOid, head)) {
    return false;
  }
  if (!previousTag) {
    return true;
  }

  return ancestorCheck(previousTag, mergeCommitOid) && !ancestorCheck(mergeCommitOid, previousTag);
}

function main() {
  const version = process.argv[2];
  const baseBranch = process.argv[3] ?? "main";
  if (!version) {
    console.error("Usage: node collect-release-notes.mjs <version> [base-branch]");
    process.exit(1);
  }

  const previousTag = getPreviousTag();
  const pullRequests = getMergedPullRequests(baseBranch)
    .filter((pr) => pr.mergeCommit?.oid && isMergedAfterTag(pr.mergeCommit.oid, previousTag))
    .sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));

  const sections = [];

  for (const pr of pullRequests) {
    const notes = extractReleaseNotes(pr.body);
    if (!notes) continue;

    sections.push(`### #${pr.number} ${pr.title}\n\n${notes}`);
  }

  const rangeLabel = previousTag ? `${previousTag}..HEAD` : "initial release";
  const changes =
    sections.length > 0 ? sections.join("\n\n") : "_이번 릴리스에 포함된 Release Notes가 없어요._";

  process.stdout.write(
    `## create-ait-app v${version}\n\n` + `Changes since \`${rangeLabel}\`:\n\n` + `${changes}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
