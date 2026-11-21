#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
#
# Installs Playwright's Chromium on a CI runner.
#
# Playwright's own download (cdn.playwright.dev, which redirects to Google's
# Chrome for Testing storage) has stalled on GitHub's runners. This tries it
# first with a time limit; if it fails, it says so and fetches the same builds
# straight from Chrome for Testing, then checks that Chromium launches.
set -euo pipefail

echo "Installing Chromium's system dependencies"
npx playwright install-deps chromium

if timeout 240 npx playwright install chromium; then
  echo "Playwright installed Chromium itself"
  exit 0
fi
echo "::warning::Playwright's Chromium download failed or stalled; fetching the same builds from Chrome for Testing storage"

cache="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
browsers="node_modules/playwright-core/browsers.json"
version_of() { node -p "require('./$browsers').browsers.find((b) => b.name === '$1').browserVersion"; }
revision_of() { node -p "require('./$browsers').browsers.find((b) => b.name === '$1').revision"; }

# install <playwright name> <cache dir prefix> <Chrome for Testing build name>
install() {
  local version revision dir zip url
  version=$(version_of "$1")
  revision=$(revision_of "$1")
  dir="$cache/$2-$revision"
  zip="$(mktemp -d)/$3.zip"
  url="https://storage.googleapis.com/chrome-for-testing-public/$version/linux64/$3-linux64.zip"
  echo "Downloading $1 $version (revision $revision) from $url"
  curl --fail --location --retry 3 --retry-all-errors --connect-timeout 30 --max-time 300 --output "$zip" "$url"
  rm -rf "$dir"
  mkdir -p "$dir"
  unzip -q "$zip" -d "$dir"
  # The markers Playwright writes after its own install (dependencies were installed above).
  touch "$dir/INSTALLATION_COMPLETE" "$dir/DEPENDENCIES_VALIDATED"
}

install chromium chromium chrome
install chromium-headless-shell chromium_headless_shell chrome-headless-shell

node -e "require('playwright').chromium.launch().then((browser) => browser.close()).then(() => console.log('Chromium launches'))"
