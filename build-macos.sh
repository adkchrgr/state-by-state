#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Build this app on macOS 13 or later. The bundled web/index.html can also be opened directly in a browser.' >&2
  exit 1
fi
if ! xcrun --find swiftc >/dev/null 2>&1; then
  echo 'Install Apple Command Line Tools with: xcode-select --install' >&2
  echo 'When installation finishes, run: bash build-macos.sh' >&2
  exit 1
fi
app_path="$PWD/dist/State by State.app"
mkdir -p "$app_path/Contents/MacOS" "$app_path/Contents/Resources"
# Copy only app resources, never node_modules or development tooling.
cp src/Info.plist "$app_path/Contents/Info.plist"
cp -R web "$app_path/Contents/Resources/"
build_arch="$(uname -m)"
xcrun swiftc src/main.swift -O -target "${build_arch}-apple-macosx13.0" \
  -framework Cocoa -framework WebKit -o "$app_path/Contents/MacOS/StateByState"
/usr/bin/plutil -lint "$app_path/Contents/Info.plist"
/usr/bin/codesign --force --deep --sign - "$app_path"
/usr/bin/codesign --verify --deep --strict "$app_path"
echo "Built: $app_path"
echo 'You can copy State by State.app to Applications and launch it normally.'
if [[ "${1:-}" == --launch ]]; then open "$app_path"; fi
