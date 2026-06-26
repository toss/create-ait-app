const VALID_PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"];

function detectInvokedPackageManager() {
  const fromConfig = process.env.npm_config_pm;
  if (fromConfig && VALID_PACKAGE_MANAGERS.includes(fromConfig)) {
    return fromConfig;
  }

  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("npm")) return "npm";

  return null;
}

module.exports = {
  VALID_PACKAGE_MANAGERS,
  detectInvokedPackageManager,
};
