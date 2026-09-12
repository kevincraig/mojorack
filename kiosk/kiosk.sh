#!/usr/bin/env bash
# Launches Chromium in kiosk mode against the local dashboard.
# Meant to be started from the desktop session's autostart (labwc, the
# default on current Raspberry Pi OS) once already logged into a graphical
# session - see docs/pi-deployment.md.
set -uo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3010}"

# If running under X11 (DISPLAY set), stop the screen from blanking/sleeping
# - the #1 kiosk gotcha there. Under labwc/Wayland this is instead handled at
# the OS level (raspi-config's screen blanking option / no swayidle
# configured), so these are harmless no-ops when DISPLAY isn't set.
if [ -n "${DISPLAY:-}" ]; then
  xset s off || true
  xset s noblank || true
  xset -dpms || true

  # Hide the mouse cursor when idle (X11 only; irrelevant on a touchscreen
  # with no pointer attached, so skipped entirely under Wayland).
  if command -v unclutter >/dev/null 2>&1; then
    unclutter -idle 0.5 -root &
  fi
fi

# Wait for the dashboard container to be reachable before opening the browser.
until curl --output /dev/null --silent --fail "$DASHBOARD_URL"; do
  sleep 2
done

CHROMIUM_BIN="$(command -v chromium-browser || command -v chromium)"

# Relaunch on crash/update. This script is started once from autostart (no
# systemd Restart= to fall back on), so the retry loop lives here instead.
while true; do
  # --password-store=basic: without this, Chromium tries to unlock/create a
  # system keyring via libsecret. Autologin means no password was ever typed
  # to unlock one, so it blocks the whole session behind a "Choose Password
  # for new keyring" modal instead of showing the dashboard.
  "$CHROMIUM_BIN" \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --check-for-update-interval=31536000 \
    --ozone-platform-hint=auto \
    --password-store=basic \
    --user-data-dir="${HOME}/.config/mojorack-chromium" \
    "$DASHBOARD_URL"
  sleep 2
done
