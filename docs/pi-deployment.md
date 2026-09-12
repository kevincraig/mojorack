# Deploying to the Pi

This walks through going from a blank SD card to a rack-mounted Pi4 running
the full stack and driving the 7" screen in kiosk mode. Verified against a
real Pi4 running the current Raspberry Pi OS (Debian trixie-based, labwc
desktop).

## 1. Pick an OS image

**Recommendation: Raspberry Pi OS (64-bit), Desktop.**

- **Official image, best hardware support.** First-party apt repos, and the
  Raspberry Pi Foundation's own 7" touch display is guaranteed to work
  out of the box.
- **64-bit matters.** Next.js/Node and Docker both run meaningfully better
  on 64-bit.
- **Desktop, not Lite.** Kiosk mode needs a graphical session.

The current Raspberry Pi OS Desktop image defaults to **labwc** (a Wayland
compositor) rather than X11. Don't fight this — Chromium runs natively under
Wayland with no extra flags needed, and everything in this repo
(`kiosk/kiosk.sh`, `kiosk/labwc-autostart`) targets that setup directly. An
earlier version of this guide recommended switching to X11; that turned out
to be unnecessary complexity once actually deployed to hardware.

### Flash it

Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/). Before
writing, click the gear icon (⚙️) / "Edit Settings" to configure headless:

- Hostname (e.g. `mojorack`)
- Enable SSH, set your key or a password
- Set username/password (this guide assumes user `kevin` — substitute yours
  throughout)
- Wi-Fi, if not wired
- **Enable auto-login to desktop**, if the option is present in your version
  of Imager — saves the `raspi-config` step below.

## 2. First boot: base setup

SSH in, then:

```sh
sudo apt update && sudo apt full-upgrade -y
```

If you didn't set auto-login during imaging, enable it now:

```sh
sudo raspi-config nonint do_boot_behaviour B4   # boot to desktop, autologin
```

(`B4` is "Desktop Autologin" in `raspi-config`'s System Options → Boot menu,
for scripting it non-interactively. Reboot after.)

Confirm it took effect — `loginctl list-sessions` after a reboot should show
an active session for your user with `Type=wayland` even without ever
logging in over SSH, and:

```sh
grep autologin /etc/lightdm/lightdm.conf
```

should show `autologin-user=<you>` and `autologin-session=rpd-labwc`.

### Install Docker

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
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
```

For `.env`, don't retype your UniFi credentials over SSH by hand if you
already have a working `.env` on another machine — copy it directly:

```sh
# from your other machine, not the Pi:
scp .env <user>@<pi-ip>:~/mojorack/.env
```

Otherwise set it up fresh:

```sh
cp .env.example .env
nano .env   # fill in UNIFI_CONTROLLER_URL, UNIFI_USER, UNIFI_PASS
```

Then bring the stack up:

```sh
docker compose up -d --build
```

The first build takes roughly a minute on a Pi4 (npm install + Next.js
build). Verify it's healthy before moving on:

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
> start — the Pi builds itself fine in about a minute — just faster once
> you're iterating daily.

### Updating later

```sh
cd ~/mojorack
git pull
docker compose up -d --build
```

## 4. Kiosk mode

Still on the Pi, with the stack already running from step 3:

```sh
sudo apt install -y chromium curl
```

(The package is `chromium` on current Raspberry Pi OS; older images used
`chromium-browser`. `kiosk/kiosk.sh` checks for either name automatically.)

### Disable screen blanking

Under labwc, blanking is opt-in (via a `swayidle` line in the autostart
file) rather than on-by-default the way X11's DPMS traditionally was — so on
a fresh image there's usually nothing to turn off. Confirm explicitly anyway
so a future OS update can't silently change the default:

```sh
sudo raspi-config nonint do_blanking 1   # 1 = disable blanking
```

### Install the kiosk autostart

```sh
chmod +x ~/mojorack/kiosk/kiosk.sh
mkdir -p ~/.config/labwc
cp ~/mojorack/kiosk/labwc-autostart ~/.config/labwc/autostart
```

This replaces labwc's default autostart (which normally launches the
desktop wallpaper and taskbar) with just the dashboard kiosk, so the screen
boots straight into it with no desktop chrome. `kiosk/kiosk.sh` itself
handles the two things that most commonly break a kiosk setup:

- **Crash-restore prompts.** A dedicated `--user-data-dir` plus
  `--disable-session-crashed-bubble --disable-restore-session-state` stop
  Chromium from showing "Restore pages?" after an unclean shutdown (e.g. a
  power cut, which is a realistic scenario for something sitting in a rack).
- **Staying up.** Since this launches from labwc's autostart rather than a
  systemd unit, there's no `Restart=on-failure` to fall back on — the script
  wraps Chromium in its own retry loop instead.

### Verify

Reboot the Pi (`sudo reboot`). It should come up straight into the
dashboard, full-screen, no login prompt, no browser chrome. If it doesn't:

```sh
# on the Pi's own console, or check after SSH-ing back in:
cat ~/.xsession-errors | tail -50
docker compose logs dashboard
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
