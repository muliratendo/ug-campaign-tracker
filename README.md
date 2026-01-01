# Ug Campaign Tracker

[![CI - Frontend](https://github.com/muliratendo/ug-campaign-tracker/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/muliratendo/ug-campaign-tracker/actions/workflows/frontend-ci.yml)
[![CI - Backend](https://github.com/muliratendo/ug-campaign-tracker/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/muliratendo/ug-campaign-tracker/actions/workflows/backend-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ug Campaign Tracker is a **civic-tech** web platform that maps official Uganda Electoral Commission presidential campaign events onto an interactive map of Uganda, helping motorists, boda riders, traders, and students anticipate rallies and avoid traffic disruption during the 2026 election season. The app ingests EC campaign schedules, converts them into structured rally events, overlays them on Leaflet + OpenStreetMap, and suggests smarter routes and timings around high-congestion corridors in and around Kampala.

## Features

- Visualise upcoming presidential campaign rallies on an interactive map, with districts, venues, dates, and times clearly shown.
- Filter events by candidate, district, date range, or region (e.g. Kampala Metropolitan, Wakiso, Mukono).
- See predicted traffic impact windows (e.g. “30–45 min delays near Kawempe around 3–6 pm”) based on typical peak-hour patterns and estimated crowd size.
- Get alternative route suggestions and basic travel advice when you click a rally (e.g. “use Northern Bypass instead of Bombo Road during this rally”).
- Opt‑in browser push notifications for districts or candidates you care about, with offline access to upcoming rally lists via PWA support.
- Neutral, non‑partisan presentation of information sourced from the Electoral Commission and trusted public sources.

## Tech stack

**Frontend**

- **Next.js** (React, SSR/SSG) for SEO‑friendly pages and fast initial loads.
- **TypeScript** for safer, self‑documenting code.
- **Tailwind CSS** (utility‑first) for mobile‑first, responsive UI.
- **Next-PWA / service worker** for offline rally lists and push notifications.

**Maps & routing**

- **Leaflet** for the interactive map, markers, and layers.
- **OpenStreetMap** tiles as the default, low‑cost basemap.
- **TomTom Routing / Traffic** or OSRM for route planning and congestion‑aware alternatives.
- Optional **Google Maps** overlays for premium traffic views (if enabled).

**Backend & data**

- **Node.js / Express** API for:
  - Ingesting and parsing Uganda Electoral Commission schedules (PDF/Excel/web).
  - Normalising and storing rallies and traffic predictions in Supabase.
  - Exposing rally, prediction, and routing endpoints to the frontend.
- **Supabase (Postgres)** for structured storage of: rallies, traffic predictions, users, and notification preferences.
- **Supabase Auth** for login and optional saved alerts.

**AI & automation (optional)**

- AI‑assisted parsing of EC documents into structured events (date, time, venue, candidate).
- Geocoding of venues and generation of short, human‑readable traffic notes.

**CI/CD & hosting**

- **GitHub Actions** for tests, linting, and automatic deployments.
- **Vercel** for hosting the Next.js frontend and serverless API routes.
- Supabase for managed Postgres, auth, and backups.

## Getting started

### Prerequisites

- Node.js (LTS) and npm or pnpm installed locally.
- Git and access to this repository.
- A Supabase project (URL + anon key + service key).
- Optional: API keys for TomTom / other routing or geocoding providers.

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/ug-campaign-tracker.git
cd ug-campaign-tracker

# 2. Install dependencies
# If using a single Next.js app (recommended):
cd frontend
npm install

# If backend is separate:
cd backend
npm install
```

### Environment variables

Create `.env.local` in `frontend/`:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_TOMTOM_KEY=your_tomtom_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_webpush_vapid_key
```

Create `.env` in `backend/`:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
NODE_ENV=development
PORT=3001

# Optional routing / AI providers
TOMTOM_API_KEY=your_tomtom_key_here
GEOCODING_API_KEY=your_geocoding_key_here
AI_PROVIDER_API_KEY=your_ai_key_here
```

Update and extend these lists as new services are added.

### Running locally

```bash
# Backend API
cd backend
npm run dev     # starts Express on http://localhost:3001

# Frontend (Next.js)
cd frontend
npm run dev     # starts Next.js on http://localhost:3000
```

Then visit `http://localhost:3000` in your browser.

## Project structure

Example structure; update this section if your layout changes.

```text
.
├── frontend/                  # Next.js app (SSR/SSG + PWA)
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # Shared UI components
│   │   ├── features/
│   │   │   ├── map/          # Leaflet map, markers, layers
│   │   │   ├── rallies/      # Rally list, filters, details
│   │   │   └── routing/      # Route planner UI
│   │   ├── lib/              # Supabase client, API helpers
│   │   └── styles/
│   ├── public/               # PWA icons, manifest, service worker
│   └── package.json
│
├── backend/                   # Node.js/Express API
│   ├── src/
│   │   ├── routes/           # /rallies, /traffic, /routes, /auth
│   │   ├── services/         # EC parsing, traffic prediction, notifications
│   │   ├── middleware/       # auth, rate limiting, error handling
│   │   └── config/           # env, Supabase client
│   ├── tests/                # Jest tests
│   └── package.json
│
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── commit-conventions.md
│
├── .github/workflows/         # CI configuration
│   ├── frontend-deploy.yml
│   └── backend-deploy.yml
└── README.md
```

## Commit message & branching conventions

This project follows the **Conventional Commits** specification for commit messages.

**Format**

```text
<type>(<optional scope>): <short description>
```

**Examples**

```text
feat(map): add leaflet rally markers
feat(routing): suggest alternative routes around rallies
fix(ec-ingest): handle missing venue coordinates
docs(readme): add setup and tech stack sections
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

See `docs/commit-conventions.md` for full details (scopes, breaking changes, issue linking).

### Branching model

- `main`: Stable, deployable branch; protected and requires PR reviews.
- `develop`: Integration branch for features before promotion to `main`. **This is the default branch for pull requests.**
- `feature/*`: Short‑lived branches for individual features or fixes (e.g. `feature/routing-ui`).
- `hotfix/*`: Emergency fixes branched from `main`, merged back into both `main` and `develop`.

All changes go through pull requests into `develop` or `main`, following branch protection rules configured in the repo. Note that `main` is only updated from tested release PRs originating from `develop`.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for detailed feature plans and timelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

Ug Campaign Tracker is an independent, non‑partisan civic‑tech project and is **not** an official product of the Uganda Electoral Commission or any political party. All rally information is derived from publicly available EC communications and trusted media sources where possible, and the app provides traffic‑awareness and journey‑planning support only—not legal, security, or voting advice.
