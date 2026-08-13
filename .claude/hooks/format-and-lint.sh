#!/usr/bin/env bash
# PostToolUse hook: formats the file just written/edited with Prettier and,
# for JS/TS files, lints it with ESLint --fix. Blocks (exit 2) if ESLint
# still has errors after --fix, so Claude sees them and can correct.
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | node -e '
  let data = "";
  process.stdin.on("data", c => data += c);
  process.stdin.on("end", () => {
    try {
      const json = JSON.parse(data);
      process.stdout.write(json.tool_input?.file_path || "");
    } catch {}
  });
')"

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
case "$file_path" in
  "$repo_root"/*) ;;
  *) exit 0 ;;
esac

npx --no-install prettier --write --ignore-unknown "$file_path" >/dev/null 2>&1 || true

case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx)
    if ! eslint_output="$(npx --no-install eslint --fix "$file_path" 2>&1)"; then
      echo "$eslint_output"
      exit 2
    fi
    ;;
esac

exit 0
