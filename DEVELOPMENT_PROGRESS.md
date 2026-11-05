# DigitalFarmLab Development Progress

## Current status

| Phase | Status |
| --- | --- |
| 0 — Project audit | COMPLETED |
| 1 — Design foundation | COMPLETED |
| 2 — Authentication | TESTING |
| 3 — Farm profile | TESTING |
| 4 — Multi-crop library | TESTING |
| 5 — Real-time dashboard | TESTING |
| 6 — Digital farm and map | COMPLETED |
| 7 — Six agricultural laboratories | COMPLETED |
| 8 — Scenario library | COMPLETED |
| 9 — Simulation engine | COMPLETED |
| 10 — Crop growth and time-lapse | COMPLETED |
| 11 — AI Farm Advisor | IN PROGRESS |
| 12 — Gamification | IN PROGRESS |
| 13 — Leaderboard | IN PROGRESS |
| 14 — Notifications and daily challenges | IN PROGRESS |
| 15 — Journal and trainer feedback | IN PROGRESS |
| 16 — Analytics | IN PROGRESS |
| 17 — Certificates and reports | IN PROGRESS |
| 18 — Offline support | COMPLETED |
| 19 — Final testing | COMPLETED |

No application or database implementation changes were made during Phase 0.
Phase 1 began after explicit approval.

## Phase 0 — Project audit

### Existing architecture

- **Monorepo:** the root contains project documentation, a Neon configuration
  file, and separate `mobile/` and `server/` packages. The root `package.json`
  has Neon dependencies but no scripts.
- **Mobile:** Expo SDK 58, React Native 0.88, TypeScript 6, Expo Router, and
  React Compiler. Routes are under `mobile/src/app/`; shared UI, hooks, theme,
  authentication, and API helpers live under `mobile/src/`.
- **API:** Node.js CommonJS with Express 5 and PostgreSQL through `pg`. The
  server has route, middleware, model/schema, library, and test directories.
  The API can use a Neon PostgreSQL connection through `DATABASE_URL`.
- **Database configuration:** `server/models/schema.sql` defines the current
  relational schema. Schema application is documented as an operator action;
  the application does not apply migrations automatically.
- **Navigation:** five current tabs are Home, Farms, Simulate, Market, and
  Profile. Additional routes cover authentication, farm/field details, crop
  records, soil readings, inspections, simulation results/history, map pins,
  community, notifications, and cohorts.
- **Authentication and API access:** the mobile app uses an API helper with
  bearer tokens and refresh handling. Native tokens are stored with SecureStore;
  web storage is handled separately.

The repository's `AGENTS.md` describes a MongoDB/Mongoose server, but the
checked-in server package, implementation, schema, README, and API documentation
use PostgreSQL. The PostgreSQL implementation is the actual current architecture;
the guidance file is stale.

### Existing functionality

- Registration, login, refresh, logout, learner/trainer accounts, and profile
  editing.
- Farm and field records, approximate coordinate map pins, and farm images.
- Crop records with free-text crop names, varieties, growth stage, dates, and
  farmer-entered requirement notes.
- Manual soil measurements with explicit source metadata and field inspection
  records with optional images.
- Three seeded educational scenarios, configurable irrigation/fertilizer
  percentages, persisted simulation runs, baseline comparisons, and scores.
- Authenticated marketplace browsing/orders, community posts/likes/comments,
  notifications, and trainer cohorts with learner summaries.
- A dashboard based on recorded farms, tasks, and simulation history. The UI
  explicitly distinguishes unavailable records; it does not claim weather or
  sensor readings are live.

The current crop input allows custom text and a small set of suggested crop
names; it is not yet a curated, expandable crop reference library. The current
simulation is a single generic calculation using scenario-level baseline
values. It does not yet model crop-specific agronomy, weather, soil, pests,
growth stages, or the full set of requested controls.

### Identified errors and setup gaps

- `npm run dev` at the repository root fails because no root `dev` script
  exists. Start the API from `server/` (`npm run dev`) and the mobile app from
  `mobile/` (`npm start`).
- No local `server/.env` or `mobile/.env` is present. The server's
  `node_modules/` is also absent, so the API and database connection could not
  be started or integration-tested during this audit. Example environment files
  are present.
- The mobile dependency install and Expo startup were completed earlier in this
  session; Metro reported listening at `http://localhost:8081`. The mobile app
  requires its API URL to use backend-reachable networking for device testing.
- The mobile app's current tabs and visual theme do not yet match the requested
  five-destination Home/Scenarios/Farm/Results/Profile layout and premium
  palette.
- The SQL schema file uses idempotent table creation and incremental `ALTER`
  statements, but there is no migration history/tracking mechanism. Schema
  changes remain operator-controlled; no database was accessed or changed.

### Database assessment

The current schema has relational tables for users and refresh sessions, farms,
fields, crop records, sensor readings, inspections, scenarios, simulation runs
and scores, products/orders, posts/likes/comments, notifications, tasks, cohorts,
and cohort members. It includes primary/foreign keys, several check constraints,
uniqueness constraints, and indexes for common ownership/history lookups.

It does not yet provide the requested structured crop/category/variety/growth
reference data, regional and climate profiles, soil profiles, farming systems,
field crop seasons/rotation, laboratory modules, challenges, achievements,
certificates, journal, trainer feedback, analytics, or synchronization records.
Crop records currently store crop names and educational notes directly. No live
Neon connection was available to verify the deployed schema or data.

### Security assessment

**Good foundations observed:** passwords are hashed with bcrypt; access and
refresh tokens use separate configured secrets; refresh tokens are stored as
hashes and rotated/revoked; API SQL values are parameterized; most farm/field
operations scope records to the authenticated user; uploads have a size limit;
CORS has an allowlist; environment files are ignored by Git.

**Risks and follow-up:**

1. **Trainer self-assignment (identified in Phase 0; addressed in Phase 2):**
   registration previously accepted `trainer` as a client-chosen role, and
   trainer-only endpoints trusted the signed role claim. Phase 2 removed public
   role assignment and made API authorization use the current database role.
2. **No administrator role or full role-management workflow:** the current
   account model supports only learner and trainer, not the requested
   administrator permission model.
3. **Abuse hardening remains limited:** no login/registration rate limiting or
   broader operational security controls were identified. Review before public
   deployment.
4. **Image type validation:** uploads enforce a 5 MB limit and an image MIME
   type, but the observed middleware does not validate file signatures. Review
   before accepting untrusted public uploads.

No penetration test or production configuration review was performed. No secret
values are reproduced in this report.

### Recommended dependencies

- **Phase 0:** add none.
- Keep using installed Expo/React Native modules where they meet requirements;
  `react-native-svg` is already available for lightweight visualizations.
- Before notification, PDF/share, or offline-storage work, check Expo SDK 58
  versioned compatibility and select the smallest suitable Expo-compatible
  dependency for the approved scope. No notification, PDF-generation, or
  dedicated offline-sync package is currently declared.
- Avoid adding charting, state-management, or database packages until the
  approved feature design demonstrates a need; the existing API and React
  state patterns are sufficient for the current feature set.

### Phase-by-phase implementation plan

1. **Phase 1 — Design foundation:** reconcile theme tokens, reusable loading,
   error, empty, and accessible states; adjust navigation structure without
   replacing existing routes.
2. **Phase 2 — Authentication:** preserve existing auth, close trainer
   self-assignment, add server-enforced role lifecycle and protected-route
   coverage.
3. **Phase 3 — Farm profile:** extend current farm/field records for the
   approved farm profile needs; preserve existing records and API behavior.
4. **Phase 4 — Multi-crop library:** design relational crop/category/variety
   references and data-driven profiles, regionalization, search, and admin
   maintenance.
5. **Phase 5 — Dashboard:** build on real API records; add weather/sensor
   integrations only with provenance, loading, offline, and unavailable states.
6. **Phase 6 — Digital farm and map:** evolve current coordinate pins into
   field-level map views; avoid implying surveyed boundaries from approximate
   coordinates.
7. **Phase 7 — Six laboratories:** connect Crop, Soil, Water, Farm Simulator,
   Agribusiness, and Smart Agriculture flows to shared domain records.
8. **Phase 8 — Scenario library:** define categorized, crop-compatible
   scenarios, learning objectives, difficulty, and validated parameter schemas.
9. **Phase 9 — Simulation engine:** replace generic calculations incrementally
   with documented, deterministic educational models and known-output tests.
10. **Phase 10 — Growth/time-lapse:** add crop-specific stages, projections,
    stress effects, and comparisons tied to simulation assumptions.
11. **Phase 11 — AI advisor:** add server-side provider integration, a
    rule-based fallback, uncertainty/source disclosure, and required disclaimers.
12. **Phase 12 — Gamification:** add verified completion rules, idempotent
    rewards, levels, and achievement history.
13. **Phase 13 — Leaderboard:** design consent-aware class/institution scopes
    and enforce trainer/institution access on the server.
14. **Phase 14 — Notifications/challenges:** add preferences, permission
    handling, persistent challenge progress, and duplicate-reward prevention.
15. **Phase 15 — Journal/feedback:** implement secure learner entries,
    trainer permissions, announcements, and feedback history.
16. **Phase 16 — Analytics:** derive visualizations from persisted learner
    activity with clear empty/error states.
17. **Phase 17 — Certificates/reports:** produce verifiable records and
    shareable/downloadable output from persisted farm and run data.
18. **Phase 18 — Offline support:** define cache ownership, queued writes,
    retry behavior, conflict detection, and safe synchronization before coding.
19. **Phase 19 — Final testing:** run mobile lint/typecheck, server tests,
    database/API integration and authorization checks, and Android/build
    validation with configured services.

### Development risks

- No usable local server/database configuration currently exists, blocking
  end-to-end verification until dependencies, environment, and schema are set
  up.
- The role-registration behavior should be resolved before trainer features or
  institutional data are expanded.
- The generic simulation's numbers must not be presented as crop-specific
  forecasts; model documentation and agricultural review are necessary before
  increasing its authority or complexity.
- Expanding the SQL schema without migrations risks inconsistent deployments;
  agree on a safe, non-destructive migration process before schema-heavy phases.
- Offline synchronization, third-party weather/AI integrations, push delivery,
  PDF sharing, and crop-specific reference data each require external service,
  privacy, licensing, or operational decisions.
- During the earlier mobile `npm ci`, npm reported 17 dependency audit
  advisories (1 low, 14 moderate, 2 high). No automatic audit fix was run; review
  the package-specific findings before changing dependency versions.

### Checks performed

- Server unit tests: **10 passed, 0 failed** (`npm test` in `server/`).
- Mobile lint: **passed** (`npm run lint` in `mobile/`).
- Mobile TypeScript check: **passed** (`npx tsc --noEmit` in `mobile/`).
- Git worktree was clean before this report was created.
- Database integration, server startup, Android build, and external services:
  **not tested** because local server dependencies/environment/database are not
  configured.

### Next recommended step

Phase 1 proceeded after the audit was reviewed and approved.

## Phase 2 — Authentication

### Phase result

**Implementation complete; isolated integration checks passed; deployed
PostgreSQL verification remains outstanding.** Public registration now creates
learner accounts only. Trainer and administrator privileges require an explicit
administrator role change or operator-controlled bootstrap. API authorization
loads the current role from PostgreSQL rather than trusting a token role claim.

### Features implemented

- Removed role selection from mobile registration and changed the client
  registration request to send only display name, email, and password.
- Server rejects registration requests that try to select a trainer,
  administrator, or unsupported role; omitted role and `learner` result in a
  learner account.
- Added supported roles `learner`, `trainer`, and `admin` to the fresh database
  schema and added a transactional, non-destructive migration for existing
  schemas.
- Added `requireRole` authorization middleware and changed bearer authentication
  to load the account and its current role from the database on each
  authenticated request. Signed token claims no longer convey authorization
  roles.
- Added administrator-only role assignment at
  `PATCH /api/auth/users/:id/role`. It validates roles and user IDs, prevents
  self-role changes and last-administrator demotion, serializes simultaneous
  role changes, and revokes the target user's refresh sessions.
- Added an operator-only CLI command to bootstrap the first administrator from
  an existing user account.
- Updated API documentation and added unit tests for role validation and role
  gate behavior.

### Files created

- `server/lib/auth-validation.js`
- `server/lib/authorization.js`
- `server/migrations/001_expand_user_roles.sql`
- `server/scripts/promote-admin.js`
- `server/test/auth-validation.test.js`

### Files modified

- `server/middleware/auth.js`
- `server/models/schema.sql`
- `server/package.json`
- `server/routes/auth.js`
- `mobile/src/app/(auth)/register.tsx`
- `mobile/src/app/(app)/profile.tsx`
- `mobile/src/lib/auth.tsx`
- `docs/api.md`
- `DEVELOPMENT_PROGRESS.md`

### Database changes

- No project, Neon, or production database was accessed or changed. A disposable
  PGlite instance was used for isolated migration and API integration checks.
- Existing databases must have `server/migrations/001_expand_user_roles.sql`
  applied by an operator before using administrator accounts.
- Fresh databases created from `server/models/schema.sql` accept all three roles.

### Dependencies

No dependency was added. Added the `admin:promote` npm script to the server
package manifest; no lockfile dependency changes are needed.

### Tests performed

- `npm test` in `server/`
- Isolated PGlite integration harness for the legacy-role migration and auth API
  registration, live-role enforcement, role changes, session revocation, and
  administrator safeguards
- `node --check` on the changed server middleware, auth route, admin script, and
  authorization helper
- `npm run lint` in `mobile/`
- `npx tsc --noEmit` in `mobile/`
- `npx expo export --platform android`
- `git diff --check`

### Test results

- Server unit tests: **13 passed, 0 failed**.
- Isolated PGlite checks: **passed** for migration repeatability and preservation
  of existing data/unrelated constraints; learner-only registration; current-role
  authorization after promotion and demotion; refresh-session revocation;
  self-change and malformed role/ID rejection; and last-admin demotion rejection.
- The last-admin route branch was exercised with an injected authenticated
  administrator identity; it was not a concurrent multi-session PostgreSQL test.
- Changed server JavaScript syntax checks: **passed**.
- Mobile lint: **passed**.
- Mobile TypeScript check: **passed**.
- Android JavaScript bundle export: **passed** (1,410 modules bundled).
- Diff formatting check: **passed**.

### Outstanding problems

- No native PostgreSQL or Neon service was configured. PGlite is useful isolated
  PostgreSQL-compatible evidence, but does not confirm behavior against the
  project's actual PostgreSQL server/driver configuration.
- The migration has not been applied to a project database, and the admin
  bootstrap command has not been run against one.
- A concurrent multi-session last-administrator race test remains outstanding.
- The first administrator must be provisioned by an operator with direct
  database credentials using `npm run admin:promote -- <existing-email>` from
  `server/`; this path has not been run without a configured database.

### Next recommended step

Configure the server environment and test the role migration and role lifecycle
against a non-production PostgreSQL database, including a concurrent
last-administrator test and operator bootstrap. Keep Phase 2 in **TESTING** until
those database-backed checks pass. Phase 3 has proceeded independently after
approval and also needs its additive migration applied before deployment.

## Phase 3 — Farm profile

### Phase result

**Implementation complete; database-backed verification remains outstanding.**
Farm profiles now capture South African regions or custom international
regions, a farm type, multiple main crops, size, production system, location,
coordinates, and an editable farm avatar. Existing field records and field-level
crop records remain separate and unchanged.

### Features implemented

- Added optional region, farm type, and main-crop profile data to farm creation,
  editing, list cards, and farm details.
- Added the nine South African provinces as selectable regions plus a custom
  region input for international expansion.
- Added six farm types and multi-crop selection, with custom crop names so
  profile entry does not depend on the future crop-library phase.
- Added avatar replacement from the existing farm detail screen.
- Added server-side validation for regions, supported farm types, crop-list
  shape, duplicate crop names, and a 20-crop maximum.
- Added a non-destructive migration and corresponding fresh-schema definitions.
- Documented migration ordering and farm profile API fields.

### Database changes

- Added nullable `region`, `farm_type` (default `mixed`), and `main_crops`
  (empty text array by default) to farms.
- Existing farms retain their records; they receive the defaults for new
  attributes when the operator applies
  `server/migrations/002_expand_farm_profiles.sql`.
- No project, Neon, or production database was accessed or changed.

### Tests performed

- `npm --prefix server test`
- Isolated PGlite migration and farm API integration checks
- `node --check` on the modified farm route and validation module
- `npx expo lint` and `npx tsc --noEmit` in `mobile/`
- `npx expo export --platform android`
- `git diff --check`

### Test results

- Server unit tests: **15 passed, 0 failed**.
- Isolated PGlite migration and API checks passed: the migration preserved an
  existing farm, supplied defaults, was repeatable, and enforced database
  constraints; create/list/detail/update routes returned and persisted the new
  profile fields and rejected invalid submissions.
- Server syntax checks, mobile lint, and mobile TypeScript check: **passed**.
- Android JavaScript bundle export: **passed** (1,411 modules bundled).
- Diff formatting check: **passed**.

### Outstanding problems

- No project/Neon PostgreSQL database or Cloudinary configuration was used.
  Isolated checks do not confirm the deployment configuration.
- Farm avatar selection and request wiring were covered by lint/typecheck and
  bundling, but a real image upload/replacement was not exercised.
- The new migration has not been applied to a configured PostgreSQL database.
- Main crops are farm-level profile labels for this phase; library-backed crop
  identifiers remain separate from field records. Phase 4 adds the searchable
  reference catalog.

### Next recommended step

Apply the role and farm-profile migrations in order to a non-production
PostgreSQL database, then verify farm creation, updates, list/detail responses,
and image upload. Keep Phase 3 in **TESTING** until those checks pass.

## Phase 4 — Multi-crop library

### Phase result

**Implementation complete; database-backed deployment verification remains
outstanding.** Added a searchable, expandable catalog across the ten crop
categories from the approved specification. Catalog information that has not
been sourced is explicitly left unknown rather than filled with invented
agronomic values.

### Features implemented

- Added a database-backed crop catalog with 10 categories and the requested
  cereals, legumes, roots/tubers, vegetables, fruit, oilseed/industrial,
  fodder/pasture, herb/spice, nut/tree, and ornamental/nursery entries.
- Added authenticated category and crop-search/filter APIs with pagination and
  profile details.
- Added reusable mobile library screens for crop browsing, search, categories,
  full crop profile fields, varieties, and selection into an existing field
  crop record.
- Added administrator-only APIs and mobile controls for creating crop entries,
  maintaining scientific names/descriptions/profile fields and information
  status, and adding region-specific varieties.
- Marked seed entries as unknown pending reviewed sources. Profile fields cover
  climate, temperatures, soils/pH, water, planting, seeds/fertiliser, growth,
  harvest, pests/diseases, nutrients, storage, market uses, costs, yield, units,
  and references.
- Added migration `server/migrations/003_create_crop_library.sql`; added
  corresponding fresh-schema tables/indexes and API documentation.

### Database changes

- Added `crop_library` and `crop_library_varieties` without changing the
  existing `crops` field-record table.
- Migration seeds crop names and categories and can be reapplied without
  duplicating seed records.
- No project, Neon, or production database was accessed or changed.

### Tests performed

- Server unit tests including crop profile and variety validation
- Isolated PGlite execution of the full schema and migrations 001–003, followed
  by repeat application of migrations 002–003
- Isolated PGlite API checks for catalog seed, search/filter, profile updates,
  sourced verification status, varieties, and administrator restrictions
- Server syntax checks, mobile lint, TypeScript, Android bundle export, and
  `git diff --check`

### Test results

- Server unit tests: **19 passed, 0 failed**.
- Fresh schema and migrations 001–003: **passed** in PGlite; rerunning the
  repeatable migrations preserved the seed count at **124 crops across 10
  categories**.
- Catalog API integration: **passed** for search/filter, learner write denial,
  admin profile updates, source-required verified status, and regional variety
  creation.
- Server syntax checks, mobile lint, and mobile TypeScript check: **passed**.
- Android JavaScript bundle export: **passed** (1,414 modules bundled).
- Diff formatting check: **passed**.

### Outstanding problems

- The migration has not been run on a configured project PostgreSQL database.
- Seed crop profiles have no verified agronomic facts yet; the app marks missing
  information as unknown. Reviewed, region-appropriate sources and agronomic
  review are needed before marking crop information verified.

### Next recommended step

Apply migrations 001–003 in order to a non-production PostgreSQL database and
verify catalog administration and access controls there. Keep Phase 4 in
**TESTING** until deployment database checks pass. Phase 5 is now implemented
locally and needs database-backed validation before moving to Sign-off.

## Phase 1 — Design foundation

### Phase result

**COMPLETED.** The mobile app now has a shared warm agricultural color system
with dark and light palettes, follows the device appearance setting, uses
consistent semantic foreground colors, and presents the requested five primary
destinations. Existing screens and route paths were retained.

### Features implemented

- Added design tokens for both color schemes, including surfaces, cards, text,
  primary/secondary accents, status colors, and shared corner radii.
- Updated typography hierarchy and responsive content width in the shared
  screen component.
- Made onboarding, sign-in/registration, farm and field forms, profile,
  community, map fallback, and other shared screens respect the selected system
  color scheme.
- Added a reusable loading/error/empty content state and applied it to the
  dashboard, farm list, and simulation result history.
- Reorganized the bottom bar into **Home, Scenarios, Farm, Results, Profile**.
  Existing detail routes remain accessible; Marketplace is reachable from the
  Home quick actions.
- Improved disabled/selected accessibility states for shared controls.
- Updated Expo app accent and native splash/adaptive backgrounds to the new
  palette.

### Files created

- `mobile/src/components/ui/content-state.tsx`

### Files modified

- `mobile/app.json`
- `mobile/package.json`
- `mobile/package-lock.json`
- `mobile/src/constants/theme.ts`
- `mobile/src/components/app-tabs.tsx`
- `mobile/src/components/themed-text.tsx`
- `mobile/src/components/themed-view.tsx`
- `mobile/src/components/ui/app-screen.tsx`
- `mobile/src/components/ui/primary-button.tsx`
- `mobile/src/components/ui/stat-card.tsx`
- `mobile/src/components/ui/score-badge.tsx`
- `mobile/src/components/ui/scenario-slider.tsx`
- `mobile/src/components/ui/map-view.tsx`
- `mobile/src/components/ui/map-view.web.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/index.tsx`
- `mobile/src/app/(auth)/login.tsx`
- `mobile/src/app/(auth)/onboarding.tsx`
- `mobile/src/app/(auth)/register.tsx`
- `mobile/src/app/(app)/index.tsx`
- `mobile/src/app/(app)/cohorts.tsx`
- `mobile/src/app/(app)/community/index.tsx`
- `mobile/src/app/(app)/farm/[id].tsx`
- `mobile/src/app/(app)/farm/create.tsx`
- `mobile/src/app/(app)/farm/index.tsx`
- `mobile/src/app/(app)/field/[id]/crops.tsx`
- `mobile/src/app/(app)/field/[id]/inspections.tsx`
- `mobile/src/app/(app)/field/[id]/soil.tsx`
- `mobile/src/app/(app)/map.tsx`
- `mobile/src/app/(app)/market/[id].tsx`
- `mobile/src/app/(app)/market/index.tsx`
- `mobile/src/app/(app)/notifications.tsx`
- `mobile/src/app/(app)/profile.tsx`
- `mobile/src/app/(app)/simulate/index.tsx`
- `mobile/src/app/(app)/simulate/runs.tsx`

### Database changes

None.

### Dependencies

No new dependency was added. Expo's SDK compatibility check identified seven
existing version mismatches, so the existing mobile dependencies were aligned
using `expo install --fix`:

- `@expo/ui` → `~58.0.27`
- `expo` → `~58.0.23`
- `expo-constants` → `~58.0.15`
- `expo-linking` → `~58.0.16`
- `expo-router` → `~58.0.30`
- `expo-splash-screen` → `~58.0.13`
- `react-native-safe-area-context` → `~5.11.1`

The install reported **13 audit advisories** (12 moderate, 1 high); no automatic
audit fix was applied.

### Tests performed

- `npm run lint` in `mobile/`
- `npx tsc --noEmit` in `mobile/`
- `npx expo-doctor`
- `npx expo export --platform android`
- `git diff --check`

### Test results

- Mobile lint: **passed**.
- Mobile TypeScript check: **passed**.
- Android JavaScript bundle export: **passed** (1,410 modules bundled).
- Expo Doctor: **19/20 checks passed**. The remaining app-config schema check
  could not reach the Expo API because the TLS/network connection failed; no
  SDK package mismatch remained.
- Diff whitespace check: **passed**.
- Metro reported an unreadable cached index during Android export, fell back
  to a full crawl, and completed the bundle successfully.

### Outstanding problems

- No Android emulator or physical-device visual QA was available in this task;
  the Android bundle export verifies bundling, not rendered screen layouts.
- Expo Doctor's remote app-config schema check remains unverified until the
  network/API is reachable.
- The install still reports one high and twelve moderate npm audit advisories;
  they require a separate package-by-package review.
- The previously identified trainer self-assignment issue remains for Phase 2;
  this phase did not change authentication or role policy.
- Light mode follows the operating-system appearance setting; an in-app theme
  preference is not part of this phase.

### Next recommended step

Phase 2 proceeded after the Phase 1 result was reviewed and approved.
