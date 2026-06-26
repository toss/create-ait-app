const VALID_PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"];

function packageManagerFromUserAgent(userAgent) {
  if (!userAgent) return null;

  const [pkgSpec] = userAgent.split(" ");
  const [name] = pkgSpec.split("/");

  return VALID_PACKAGE_MANAGERS.includes(name) ? name : null;
}

function packageManagerFromExecPath(execPath = "") {
  if (/pnpm/i.test(execPath)) return "pnpm";
  if (/yarn/i.test(execPath)) return "yarn";
  if (/npm/i.test(execPath)) return "npm";
  return null;
}

function detectPnpmSignals() {
  if (
    process.env.PNPM_PACKAGE_NAME ||
    process.env.PNPM_STORE_PATH ||
    process.env.pnpm_config_verify_deps_before_run !== undefined
  ) {
    return "pnpm";
  }

  return null;
}

function detectInvokedPackageManager() {
  const fromConfig = process.env.npm_config_pm;
  if (fromConfig && VALID_PACKAGE_MANAGERS.includes(fromConfig)) {
    return fromConfig;
  }

  const fromUserAgent = packageManagerFromUserAgent(
    process.env.npm_config_user_agent,
  );
  if (fromUserAgent) return fromUserAgent;

  const fromExecPath = packageManagerFromExecPath(process.env.npm_execpath);
  if (fromExecPath) return fromExecPath;

  return detectPnpmSignals();
}

module.exports = {
  VALID_PACKAGE_MANAGERS,
  detectInvokedPackageManager,
  packageManagerFromUserAgent,
  packageManagerFromExecPath,
  detectPnpmSignals,
};
