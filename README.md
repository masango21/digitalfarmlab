# DigitalFarmLab

DigitalFarmLab is an agricultural learning app for managing farms and exploring
simulated farming scenarios.

## Projects

- [`mobile/`](./mobile/) — Expo SDK 58, Expo Router, and TypeScript.
- [`server/`](./server/) — Express API backed by PostgreSQL (including Neon).
- [`docs/api.md`](./docs/api.md) — API setup and endpoint reference.

## Local development

1. Copy `server/.env.example` to `server/.env`, fill in the database, JWT, and
   optional Cloudinary credentials, then apply `server/models/schema.sql`.
2. Start the API from `server/` using `npm run dev`.
3. Copy `mobile/.env.example` to `mobile/.env`. Set
   `EXPO_PUBLIC_API_URL` to the reachable API URL. For a physical device, use
   the development computer's LAN address instead of `localhost`.
4. Start the mobile app from `mobile/` using `npm start`.

The mobile app stores native auth tokens with Expo SecureStore. Web builds use
browser local storage and should only be served over HTTPS outside local
development.