#!/usr/bin/env bash
# Bundles script.ts with the game engine, then runs it with k6. Extra args go
# to `k6 run`. Live dashboard on http://localhost:5665; the HTML report and
# summary JSON land in out/.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$dir/../.." && pwd)"
stamp="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$dir/out"
"$root/node_modules/.bin/esbuild" "$dir/script.ts" --bundle --format=esm \
  --target=es2017 --external:k6 '--external:k6/*' --log-level=warning \
  --tsconfig="$root/tsconfig.json" --outfile="$dir/out/script.js"

export K6_WEB_DASHBOARD="${K6_WEB_DASHBOARD:-true}"
export K6_WEB_DASHBOARD_EXPORT="${K6_WEB_DASHBOARD_EXPORT:-$dir/out/report-$stamp.html}"
exec k6 run --address localhost:6565 \
  --summary-export "$dir/out/summary-$stamp.json" "$@" "$dir/out/script.js"
