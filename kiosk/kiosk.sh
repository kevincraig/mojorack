#!/usr/bin/env bash
# Launches Chromium in kiosk mode against the local dashboard.
# Installed as an autostart entry / systemd unit on the Pi driving the 7" screen.
# Assumes an X11 session on DISPLAY (see docs/pi-deployment.md for why X11,
# not the Bookworm-default Wayland/labwc, is what this script targets).
set -euo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3010}"
export DISPLAY="${DISPLAY:-:0}"

# Prevent the screen from blanking/sleeping - the #1 kiosk gotcha. Without
# this, X11's default power-management will blank the panel after ~10-20
# minutes even though the dashboard is actively updating.
xset s off || true
xset s noblank || true
xset -dpms || true

# Hide the mouse cursor when idle, if unclutter is installed.
if command -v unclutter >/dev/null 2>&1; then
  unclutter -idle 0.5 -root &
fi

# Wait for the dashboard container to be reachable before opening the browser.
until curl --output /dev/null --silent --fail "$DASHBOARD_URL"; do
  sleep 2
done

CHROMIUM_BIN="$(command -v chromium-browser || command -v chromium)"

exec "$CHROMIUM_BIN" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --check-for-update-interval=31536000 \
  --user-data-dir="${HOME}/.config/mojorack-chromium" \
  "$DASHBOARD_URL"
