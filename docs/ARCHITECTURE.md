# Architecture

## System Overview

The Uganda Campaign Rally Alert platform is built as a modern, scalable web application with a clear separation between frontend and backend concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Data Sources                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ EC Website   │  │ EC Twitter/X │  │ TomTom Traffic API   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────┬────────────────┬────────────────────┬────────────────┘
           │                │                    │
           ▼                ▼                    ▼
    ┌────────────────────────────────────────────────────┐
    │              Backend (Node.js/Express)              │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
    │  │  Scraper     │  │  Social      │  │  Traffic │ │
    │  │  Service     │  │  Service     │  │  Service │ │
    │  └──────────────┘  └──────────────┘  └──────────┘ │
    │           │               │                 │      │
    │           └───────────────┴─────────────────┘      │
    │                           ▼                        │
    │                   ┌──────────────┐                 │
    │                   │  Scheduler   │                 │
    │                   │ (node-cron)  │                 │
    │                   └──────────────┘                 │
    │                           │                        │
    └───────────────────────────┼────────────────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Supabase (PostgreSQL)       │
                 │  + PostGIS Extension         │
                 │                              │
                 │  • rallies                   │
                 │  • traffic_predictions       │
                 │  • candidates                │
                 │  • districts                 │
                 │  • profiles                  │
                 │  • subscriptions             │
                 └──────────────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │    Backend API Routes        │
                 │  GET /api/rallies            │
                 │  GET /api/traffic            │
                 │  GET /api/health             │
                 │  POST /api/trigger-scrape    │
                 └──────────────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │   Frontend (Next.js)         │
                 │  ┌────────────────────────┐  │
                 │  │  Map Component         │  │
                 │  │  (Leaflet + OSM)       │  │
                 │  └────────────────────────┘  │
                 │  ┌────────────────────────┐  │
                 │  │  Filters & Search      │  │
                 │  └────────────────────────┘  │
                 │  ┌────────────────────────┐  │
                 │  │  Auth (Supabase)       │  │
                 │  └────────────────────────┘  │
                 │  ┌────────────────────────┐  │
                 │  │  Service Worker (PWA)  │  │
                 │  └────────────────────────┘  │
                 └──────────────────────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  End Users   │
                        │ (Web Browser)│
                        └──────────────┘
```

---

## Data Flow

### 1. Data Ingestion Pipeline

The data ingestion pipeline runs automatically on a daily schedule via `node-cron`:

```
EC Website/Twitter → ScraperService/SocialService
        ↓
  Parse & Extract Rally Data
        ↓
  Geocode Venues (if needed)
        ↓
  Save to Supabase (rallies table)
        ↓
  TrafficService analyzes upcoming rallies
        ↓
  Fetch TomTom traffic data for rally locations
        ↓
  Generate predictions based on congestion ratios
        ↓
  Save to Supabase (traffic_predictions table)
```

**Key Components:**

- **ScraperService**: Fetches EC webpage, extracts PDF links, downloads and parses PDFs to extract rally events
- **SocialService**: Monitors EC Twitter/X account via Nitter RSS for real-time updates
- **TrafficService**: Analyzes upcoming rallies (next 7 days), calls TomTom API for traffic flow data, generates jam_level predictions
- **SchedulerService**: Orchestrates daily execution of all services at midnight

### 2. Frontend Data Flow

```
User visits page → Next.js renders → Client-side fetch
        ↓
  GET /api/rallies (backend)
        ↓
  Supabase query with joins (candidates, districts)
        ↓
  Return JSON to frontend
        ↓
  Map component renders markers
        ↓
  GET /api/traffic (backend)
        ↓
  Supabase query with rally joins
        ↓
  Return JSON to frontend
        ↓
  Map component renders congestion circles
```

**User Interactions:**

1. **Filtering**: Client-side filtering by date/candidate without re-fetching
2. **Route Planning**: Leaflet Routing Machine calls OSRM or TomTom (via backend proxy)
3. **Authentication**: Supabase Auth handles login/signup
4. **Push Notifications**: Service worker registers for push, backend sends via VAPID

---

## Smart Proxy & Caching Strategy

To ensure security and efficiency, all external API calls (TomTom, geocoding) are proxied through the backend:

```
Frontend → Backend API → External Service
   ↑                            ↓
   └────── Cache in Supabase ──┘
```

**Benefits:**

1. **Security**: API keys never exposed to client
2. **Cost Optimization**: Results cached in database, reducing API calls
3. **Reliability**: Fallback to cached data if external service fails
4. **Rate Limiting**: Backend controls request frequency

**Example: Traffic Predictions**

- First request: Backend calls TomTom, caches result in `traffic_predictions` table
- Subsequent requests: Backend serves from cache
- Daily refresh: Scheduler updates predictions for upcoming rallies

---

## Component Descriptions

### Backend Components

#### Services

- **ScraperService** (`backend/src/services/scraper.ts`)

  - Dynamically discovers PDF URLs from EC webpage
  - Downloads and parses PDFs using `pdf-parse`
  - Extracts rally data via regex (placeholder, needs refinement)
  - Saves events to Supabase with candidate/district resolution

- **SocialService** (`backend/src/services/social.ts`)

  - Monitors EC Twitter account via Nitter RSS
  - Placeholder for official Twitter API integration

- **TrafficService** (`backend/src/services/traffic.ts`)

  - Fetches upcoming rallies (next 7 days)
  - Calls TomTom Traffic Flow API for each rally location
  - Calculates congestion ratio: currentSpeed / freeFlowSpeed
  - Assigns jam_level: critical (<50%), heavy (<75%), moderate (otherwise)
  - Saves predictions with estimated delay in minutes

- **TomTomService** (`backend/src/services/tomtom.ts`)

  - Wrapper for TomTom API calls
  - Returns traffic flow data for coordinates

- **SchedulerService** (`backend/src/services/scheduler.ts`)
  - Orchestrates daily jobs at midnight
  - Calls: scraperService.fetchSchedule() → socialService.checkUpdates() → trafficService.generatePredictions()

#### API Routes

- `GET /api/health`: Liveness check
- `GET /api/rallies`: Fetch upcoming rallies with joins (candidate, district)
- `GET /api/traffic`: Fetch traffic predictions with rally joins
- `POST /api/trigger-scrape`: Manual scraper trigger (dev/admin only)

### Frontend Components

#### Features

- **Map** (`frontend/src/features/map/`)

  - `Map.tsx`: Leaflet map with rally markers and traffic circles
  - `MapWrapper.tsx`: Client-side wrapper for dynamic import (SSR compatibility)
  - `RoutingControl.tsx`: Leaflet Routing Machine integration

- **Auth** (`frontend/src/features/auth/`)
  - `AuthContext.tsx`: Global user state management via Supabase Auth
  - Login/Register pages: Email/password authentication

#### Pages

- `/` (Home): Interactive map with filters
- `/auth/login`: Login page
- `/auth/register`: Registration page
- `/profile`: User preferences (notifications, home location)

#### Service Worker

- **Caching Strategy**:
  - Network-first for API calls (with cache fallback)
  - Cache-first for static assets
  - Install event: Pre-cache critical resources
  - Activate event: Clean up old caches
- **Push Notifications**: Listen for push events, show system notifications

---

## Database Schema

See `backend/supabase/schema.sql` for full details.

**Key Tables:**

- **rallies**: Event data (title, venue, location, start_time, candidate_id, district_id)
- **traffic_predictions**: Predicted delays and jam levels for rallies
- **candidates**: Presidential candidates (name, party, color_hex)
- **districts**: Uganda districts with PostGIS geometry
- **profiles**: User preferences
- **subscriptions**: User notification subscriptions

**PostGIS Extensions:**

- POINT type for locations (latitude, longitude)
- Spatial queries for nearby rallies/districts

**Row Level Security (RLS):**

- Configured for user-specific data (profiles, subscriptions)
- Public read access for rallies and predictions

---

## Technology Stack

### Frontend

- **Next.js 16** (React 18, App Router, TypeScript)
- **Tailwind CSS** for styling
- **Leaflet + React-Leaflet** for maps
- **Leaflet Routing Machine** for route planning
- **Supabase Auth** for authentication
- **PWA** (manifest.json + service worker)

### Backend

- **Node.js 20** + Express
- **TypeScript** for type safety
- **Supabase** (PostgreSQL + Auth)
- **node-cron** for scheduling
- **cheerio** for HTML parsing
- **pdf-parse** for PDF extraction
- **axios** for HTTP requests

### Infrastructure

- **GitHub Actions** for CI/CD
- **Vercel** for hosting (planned)
- **Supabase** for database and auth

---

## Security Considerations

1. **API Key Protection**: All external API keys stored server-side only
2. **Rate Limiting**: Backend enforces limits on scraper and API endpoints
3. **Input Validation**: Sanitize user inputs (filters, search queries)
4. **RLS Policies**: Database-level access control
5. **HTTPS Only**: Enforce secure connections in production
6. **CORS**: Restricted to trusted origins

---

## Future Enhancements

- Kubernetes deployment for better scalability
- Redis caching layer for hot API responses
- WebSocket connections for real-time rally updates
- Machine learning for better traffic predictions
- Multi-language support (Luganda, etc.)

---

## Contributing

When making architectural changes:

1. Update this document
2. Update relevant diagrams
3. Document breaking changes in commit messages
4. Discuss major changes in GitHub issues first
