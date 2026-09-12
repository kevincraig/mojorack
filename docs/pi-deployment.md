# Deploying to the Pi

This walks through going from a blank SD card to a rack-mounted Pi4 running
the full stack and driving the 7" screen in kiosk mode.

## 1. Pick an OS image

**Recommendation: Raspberry Pi OS (64-bit, Bookworm), Desktop, with the
windowing system set to X11 (not the Bookworm default of Wayland/labwc).**

Why this over the alternatives:

- **Official image, best hardware support.** First-party apt repos, and the
  Raspberry Pi Foundation's own 7" touch display is guaranteed to work
  out of the box — no third-party driver hunting.
- **64-bit matters.** Next.js/Node and Docker both run meaningfully better
  on 64-bit; the 32-bit image has no real upside here.
- **Desktop, not Lite.** Kiosk mode needs a windowing session. Lite can be
  made to work (`cage` + Wayland, or a hand-rolled `startx`), but it's more
  moving parts for no real benefit on a Pi4 that has RAM to spare.
- **X11, not Wayland.** Bookworm's default desktop is Wayland (labwc). It
  works, but Chromium's kiosk flags, `DISPLAY`-based tooling (`xset`,
  `unclutter`), and most kiosk tutorials online all assume X11. Switching
  the windowing system back to X11 keeps everything in this repo
  (`kiosk/kiosk.sh`, the systemd unit) working exactly as written, with one
  fewer variable to debug. You lose nothing meaningful for a single
  full-screen kiosk browser.

If you'd rather not touch that setting, Wayland works too — Chromium runs
fine under XWayland — but skip the `xset` screen-blanking commands (they're
X11-only; see step 4 for the Wayland equivalent) and expect a bit more
troubleshooting.

### Flash it

Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/). Before
writing, click the gear icon (⚙️) / "Edit Settings" to configure headless:

- Hostname (e.g. `mojorack`)
- Enable SSH, set your key or a password
- Set username/password (this guide assumes user `pi`)
- Wi-Fi, if not wired

## 2. First boot: base setup

SSH in, then:

```sh
sudo apt update && sudo apt full-upgrade -y
sudo raspi-config
```

In `raspi-config`:

- **System Options → Boot / Auto Login → Desktop Autologin** — the Pi must
  boot straight into a graphical session with no login prompt.
- **Advanced Options → Wayland** → select **X11** (this is the setting from
  step 1 — it's under "Advanced Options" on most Bookworm builds).

Reboot after changing these (`sudo reboot`).

### Install Docker

```sh
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker pi
```

Log out and back in (or reboot) for the group change to take effect. Verify:

```sh
docker run hello-world
```

## 3. Move the app to the Pi

Simplest path: clone the repo directly on the Pi and build there. The
Dockerfile's `node:24-alpine` base has arm64 images, so this just works —
no cross-compilation needed.

```sh
git clone https://github.com/kevincraig/mojorack.git ~/mojorack
cd ~/mojorack
cp .env.example .env
nano .env   # fill in UNIFI_CONTROLLER_URL, UNIFI_USER, UNIFI_PASS
docker compose up -d --build
```

The first build takes a few minutes on a Pi4 (npm install + Next.js build).
Verify it's healthy before moving on:

```sh
docker compose ps                                  # unpoller should say "healthy"
curl -s http://localhost:3010/api/metrics | jq
```

> **Faster alternative for frequent updates:** if you're iterating a lot,
> build the image on a faster machine with `docker buildx build --platform
> linux/arm64 -t ghcr.io/<you>/mojorack-dashboard:latest --push ./dashboard`,
> then on the Pi swap the `dashboard` service's `build:` block for `image:
> ghcr.io/<you>/mojorack-dashboard:latest` and use `docker compose pull &&
> docker compose up -d` instead of rebuilding on-device. Not necessary to
> start — the Pi builds itself fine — just faster once you're iterating
> daily.

### Updating later

```sh
cd ~/mojorack
git pull
docker compose up -d --build
```

## 4. Kiosk mode

Still on the Pi, with the stack already running from step 3:

```sh
sudo apt install -y chromium-browser unclutter curl
```

(On some Bookworm builds the package is just `chromium` — the repo's
`kiosk/kiosk.sh` checks for either name automatically.)

Install the launch script and systemd unit (already in the repo you cloned):

```sh
chmod +x ~/mojorack/kiosk/kiosk.sh
sudo cp ~/mojorack/kiosk/mojorack-kiosk.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mojorack-kiosk
```

The unit (`kiosk/mojorack-kiosk.service`) assumes:

- Username `pi` and repo cloned to `/home/pi/mojorack` — edit `User=` and
  `ExecStart=` if either differs.
- `DASHBOARD_URL=http://localhost:3010` — matches the port mapping in
  `docker-compose.yml`; keep them in sync if you change one.

`kiosk/kiosk.sh` itself handles the two things that most commonly break a
kiosk setup:

- **Screen blanking.** `xset s off`, `xset s noblank`, `xset -dpms` stop
  X11's power management from putting the panel to sleep after ~10-20
  minutes of no keyboard/mouse input (the dashboard updating on its own
  doesn't count as "activity" to X11). **If you kept Wayland/labwc instead
  of switching to X11**, the equivalent is disabling idle/screen-blanking in
  `~/.config/labwc/rc.xml` (or via whatever idle daemon your image ships) —
  the `xset` calls here are no-ops under pure Wayland.
- **Crash-restore prompts.** A dedicated `--user-data-dir` plus
  `--disable-session-crashed-bubble --disable-restore-session-state` stop
  Chromium from showing "Restore pages?" after an unclean shutdown (e.g. a
  power cut, which is a realistic scenario for something sitting in a rack).

### Verify

Reboot the Pi (`sudo reboot`). It should come up straight into the dashboard,
full-screen, no login prompt, no browser chrome. If it doesn't:

```sh
systemctl status mojorack-kiosk
journalctl -u mojorack-kiosk -f
```

The script waits for `http://localhost:3010` to respond before launching
Chromium, so a slow `docker compose` startup on boot won't race it — but if
the dashboard container itself is unhealthy, `docker compose logs dashboard`
is the next place to look.

## 5. Optional: screen orientation

If the [rack panel mount](../README.md#hardware) puts the display in a
different orientation than the cable exits expect, rotate it in
`/boot/firmware/config.txt` (add e.g. `display_lcd_rotate=2` for 180°) rather
than fighting it in software — this is the officially supported way to
rotate the official 7" touch display and survives reboots/updates cleanly.
