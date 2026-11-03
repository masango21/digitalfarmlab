# DigitalFarmLab API

The API is the Express service in `server/` and uses PostgreSQL. Neon connection
strings can be used as `DATABASE_URL`; apply the schema in
[`server/models/schema.sql`](../server/models/schema.sql) to the database before
using data-backed routes.

## Local setup

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`,
   `JWT_SECRET`, and `JWT_REFRESH_SECRET`. Configure Cloudinary credentials to
   enable image uploads.
2. Apply the schema with `psql "$DATABASE_URL" -f server/models/schema.sql`.
3. Start the server from `server/` with `npm run dev` (or `npm start`).
4. The health endpoint is `GET /health`. Authenticated endpoints require
   `Authorization: Bearer <accessToken>`.

The default CORS allowlist is
`http://localhost:8081,http://localhost:8098,http://localhost:19006`.
Set `ALLOWED_ORIGINS` to a comma-separated list of deployed web origins. Native
mobile requests without an `Origin` header are accepted.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account and return access/refresh tokens |
| POST | `/api/auth/login` | Authenticate and return access/refresh tokens |
| POST | `/api/auth/refresh` | Rotate a refresh token |
| POST | `/api/auth/logout` | Revoke the supplied refresh token |

Registration accepts `displayName`, `email`, `password`, and optional `role`
(`learner` or `trainer`). Refresh and logout accept `refreshToken`.

## Application routes

All routes below require an access token unless stated otherwise.

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/farms` | List or create farms |
| GET, PATCH, DELETE | `/api/farms/:id` | Read or manage an owned farm |
| POST | `/api/farms/:id/fields` | Add a field to an owned farm |
| PATCH | `/api/farms/:id/fields/:fieldId` | Update a field belonging to an owned farm |
| POST | `/api/farms/:id/image` | Upload a farm image (`image` multipart field) |
| GET, POST | `/api/fields/:fieldId/crops` | List or assign crops to an owned field |
| PATCH, DELETE | `/api/crops/:id` | Update or remove a crop on an owned field |
| GET, POST | `/api/fields/:fieldId/soil-measurements` | Read soil history or record a manual measurement |
| GET, POST | `/api/fields/:fieldId/inspections` | Read inspection history or record an observation |
| POST | `/api/inspections/:id/image` | Upload an image to an owned inspection (`image` multipart field) |
| GET | `/api/scenarios` | List available simulations |
| POST | `/api/scenarios/run` | Run and save a simulation |
| GET | `/api/scenarios/runs` | List the signed-in user's recent runs |
| GET, POST | `/api/market` | Browse products or create a product |
| GET | `/api/market/:id` | Read a product |
| POST | `/api/market/:id/orders` | Place an order |
| GET, POST | `/api/community` | Read the feed or create a post |
| POST | `/api/community/:id/likes` | Toggle the signed-in user's like |
| GET, POST | `/api/community/:id/comments` | Read or add comments |
| GET | `/api/notifications` | List the signed-in user's notifications |
| PATCH | `/api/notifications/:id/read` | Mark an owned notification as read |
| GET, PATCH | `/api/profile` | Read profile and scores or update display name |
| POST | `/api/profile/avatar` | Upload an avatar (`image` multipart field) |
| GET, POST | `/api/cohorts` | List cohorts or create one as a trainer |
| POST | `/api/cohorts/join` | Join a cohort as a learner with an invite code |
| GET | `/api/cohorts/:id/results` | Read learner simulation summaries as the cohort trainer |

Simulation parameters are `scenarioId`, optional `farmId`,
`irrigationPercent` (0–200), `fertilizerPercent` (0–200), and optional
`plantingDate`. The response contains yield, water use, cost, baseline values,
and a score from 0 to 100. Outcomes are educational estimates, not agronomic
advice. Farm creation and updates accept `productionSystem` as `rainfed`,
`irrigated`, or `mixed` (the default). Farms and fields may include optional
`latitude` and `longitude` values together; the app displays these as
approximate map pins, not surveyed boundaries. Field creation accepts `name`,
`areaHectares`, optional `soilType`, `latitude`, and `longitude`. Field updates
accept those same properties as a partial update. Coordinates are validated as
pairs and against latitude/longitude ranges.

The schema file includes the farm production-system and field coordinate
columns. Applying schema changes is an operator-controlled step; the app does
not run migrations automatically.

Crop records accept a name, optional variety and growth stage, farmer-entered
water and nutrient requirement notes, planting date, and expected harvest date.
The app includes common South African crop names plus custom names; stage,
date, and requirement notes are user records, not agronomic advice or
application-rate recommendations. Soil measurements accept moisture (`%`), temperature (`°C`), pH,
organic matter (`%`), or nitrogen, phosphorus, and potassium (`mg/kg`).
Measurements are range-checked and new app entries are stored with
`source = manual`; existing readings whose source was not recorded remain
`unknown`. No phone-based or simulated soil readings are presented as actual
sensor measurements.

Inspections record a farmer-selected health observation, required field notes,
optional pest/disease observations, and an optional image. Pest and disease
notes are observations only, not a confirmed diagnosis. Image upload requires
Cloudinary to be configured; an inspection can still be saved without a photo.
