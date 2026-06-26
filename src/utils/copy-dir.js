const fs = require("fs");
const path = require("path");

function copyDir(src, dest, { exclude = [], skipExisting = false } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, { exclude, skipExisting });
    } else if (skipExisting && fs.existsSync(destPath)) {
      continue;
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = { copyDir };
