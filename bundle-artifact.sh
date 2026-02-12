#!/usr/bin/env bash
# Builds the app and produces a single self-contained bundle.html
set -euo pipefail

cd "$(dirname "$0")"

echo "Building..."
pnpm build

DIST="dist"
OUT="bundle.html"

# Find the CSS and JS filenames from the built HTML
CSS_FILE=$(sed -n 's/.*href="\(\/assets\/[^"]*\.css\)".*/\1/p' "$DIST/index.html")
JS_FILE=$(sed -n 's/.*src="\(\/assets\/[^"]*\.js\)".*/\1/p' "$DIST/index.html")

CSS_CONTENT=$(cat "$DIST$CSS_FILE")
JS_CONTENT=$(cat "$DIST$JS_FILE")

# Build the bundled HTML
cat > "$OUT" << ENDOFFILE
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#0f172a" />
    <title>Gender IAT</title>
    <style>
$CSS_CONTENT
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
$JS_CONTENT
    </script>
  </body>
</html>
ENDOFFILE

SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "Created $OUT ($SIZE bytes)"
