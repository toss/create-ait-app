const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9._/-]+$/;

/**
 * 쉘에 그대로 복사해 실행해도 안전하도록 값을 감싸요. 공백이나 쉘 특수문자가
 * 없으면 그대로 두고, 있으면 큰따옴표로 감싸면서 `\`, `"`, `$`, `` ` ``를
 * 이스케이프해요.
 */
export function quoteForShell(value: string): string {
  if (SAFE_TOKEN_PATTERN.test(value)) {
    return value;
  }

  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("$", "\\$")
    .replaceAll("`", "\\`");
  return `"${escaped}"`;
}
