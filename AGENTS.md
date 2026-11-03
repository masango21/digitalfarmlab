# DigitalFarmLab — Agent Guidelines

**DigitalFarmLab** is a monorepo consisting of:
- `mobile/` — Expo / React Native app (SDK 58, Expo Router, TypeScript)
- `server/` — Node.js / Express REST API backed by MongoDB (Mongoose)

Always identify which sub-project you are working in before making changes.

---

## Repository Structure

```
digitalfarmlab/
├── mobile/          # Expo React Native app
│   ├── src/
│   │   └── app/     # Expo Router screens & layouts
│   ├── assets/
│   ├── app.json     # Expo config & native settings
│   └── AGENTS.md    # Mobile-specific agent rules (read this too)
├── server/          # Express + Mongoose API
│   ├── index.js     # Entry point
│   └── package.json
└── docs/            # Project documentation
```

---

## Mobile (`mobile/`)

> **See [`mobile/AGENTS.md`](mobile/AGENTS.md) for detailed mobile rules.**

Key points:
- Expo SDK **58** — always fetch versioned docs before touching Expo APIs.
- Uses **Expo Router** (file-based routing in `src/app/`).
- Run `npx expo install <pkg>` instead of npm/yarn/pnpm to resolve SDK-compatible versions.
- Always run lint and typecheck before declaring a task done:

```bash
npx expo lint        # lint
npx tsc --noEmit     # typecheck
```

---

## Server (`server/`)

Node.js / Express 5 API with MongoDB via Mongoose.

### Stack
| Layer      | Technology          |
|------------|---------------------|
| Runtime    | Node.js (CommonJS)  |
| Framework  | Express 5           |
| Database   | MongoDB + Mongoose  |
| Dev server | Nodemon             |
| Config     | dotenv              |
| CORS       | cors                |

### Commands

```bash
# From the server/ directory
node index.js          # run in production
npx nodemon index.js   # run with hot-reload (development)
```

### Conventions
- Entry point is `index.js` at the root of `server/`.
- Use `require`/`module.exports` (CommonJS — `"type": "commonjs"` in package.json).
- Store all secrets and environment variables in a `.env` file (never commit it).
- Define Mongoose schemas in a `models/` folder and routes in a `routes/` folder.
- Use `cors` middleware and configure allowed origins explicitly; avoid `cors({ origin: '*' })` in production.

---

## General Rules

1. **Work in the right sub-project.** Do not mix server and mobile code or dependencies.
2. **No `.env` in version control.** Always add `.env` to `.gitignore`.
3. **Prefer explicit over implicit.** Name variables and functions clearly.
4. **Keep the `docs/` folder up to date** when adding significant features.
5. **Test before marking done.** Run the relevant lint/typecheck/start command and confirm no errors.
