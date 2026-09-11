#!/usr/bin/env bash
# Launches Chromium in kiosk mode against the local dashboard.
# Installed as an autostart entry / systemd unit on the Pi driving the 7" screen.
set -euo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"

# Wait for the dashboard container to be reachable before opening the browser.
until curl --output /dev/null --silent --fail "$DASHBOARD_URL"; do
  sleep 2
done

exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --check-for-update-interval=31536000 \
  "$DASHBOARD_URL"
