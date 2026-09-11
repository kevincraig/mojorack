# mojorack dashboard

The Next.js app that renders the HUD. See the [project README](../README.md)
for the full stack (unpoller + Prometheus + this app), setup, and kiosk mode
instructions.

## Local development

```sh
npm install
PROMETHEUS_URL=http://localhost:9090 npm run dev
```

Requires Prometheus (and unpoller behind it) already running — see the root
`docker-compose.yml`.
