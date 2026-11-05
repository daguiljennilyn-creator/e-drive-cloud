# E-Drive Cloud — Frontend

React 19 + TypeScript + Vite single-page app for the E-Drive encrypted document vault.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs at `http://127.0.0.1:5173`. By default the app calls the API on the same hostname at port `8000`, which keeps the session cookie first-party:

```dotenv
# Optional — only set when the API is not on http://<current-host>:8000/api
# VITE_API_URL=http://127.0.0.1:8000/api
VITE_APP_URL=http://127.0.0.1:5173
```

Authentication uses Laravel's session cookie plus an `X-XSRF-TOKEN` header, so always open the frontend and API through the same host (`127.0.0.1` with `127.0.0.1`, or `localhost` with `localhost`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | Run Oxlint |

See the [root README](../README.md) for the full stack setup, demo account, API documentation and tested workflows.
