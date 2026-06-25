function toNpmPackageName(input) {
  const raw = String(input || "").trim();
  if (!raw) return "my-app";

  if (raw.startsWith("@")) {
    const slash = raw.indexOf("/");
    if (slash > 1) {
      const scope = raw.slice(0, slash).toLowerCase();
      const name = raw.slice(slash + 1);
      const normalizedName = toNpmPackageName(name);
      return `${scope}/${normalizedName}`;
    }
  }

  return (
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[._-]+/, "")
      .replace(/[._-]+$/, "") || "my-app"
  );
}

module.exports = { toNpmPackageName };
