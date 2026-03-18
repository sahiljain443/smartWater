# Smart WaterVerse

**The Operating System for Water** — an IoT-driven platform for STP (Sewage Treatment Plant) monitoring, consumer engagement, and water market management.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  FRONTEND                                                  │
│  Megaliter Ops (React)  ·  RWA Portal  ·  Water Warrior   │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│  API Gateway (Traefik)                                     │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│  BACKEND                                                   │
│  api-server (Fastify)  ·  iot-ingestion  ·  worker (Bull)  │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│  DATA                                                      │
│  PostgreSQL+TimescaleDB  ·  Redis  ·  Mosquitto  ·  MinIO  │
└────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
smartwater/
├── apps/
│   ├── megaliter-ops/       React SPA — Operations Dashboard
│   ├── rwa-portal/          React SPA — Society Admin Portal
│   └── water-warrior/       React Native (Expo) — Consumer App
├── services/
│   ├── api-server/          Fastify REST API + WebSocket
│   ├── iot-ingestion/       MQTT → TimescaleDB pipeline
│   ├── iot-simulator/       Virtual STP data generator
│   └── worker/              BullMQ jobs, notifications, cron
├── packages/
│   ├── shared-types/        TypeScript types
│   └── validators/          Zod schemas
├── db/
│   ├── init/                PostgreSQL extensions
│   └── migrations/          SQL schema
├── gateway/                 Traefik + Mosquitto config
└── docker-compose.yml       Full local dev stack
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend — Ops | React 18, Vite, TailwindCSS, Recharts, Leaflet, Zustand |
| Frontend — Consumer | React Native (Expo) |
| Backend | Node.js, Fastify, TypeScript |
| IoT | MQTT (Mosquitto), Store & Forward |
| Database | PostgreSQL 16 + TimescaleDB (hypertables, continuous aggregates) |
| Cache / Queues | Redis 7 (BullMQ) |
| Auth | Custom JWT with RBAC |
| Notifications | Telegram Bot API, AWS SES, Firebase FCM |
| Maps | Leaflet + OpenStreetMap |
| Containers | Docker Compose (Colima / Docker Desktop) |
| Monorepo | Turborepo |

## Prerequisites

- **Node.js** >= 20
- **Docker** (Docker Desktop or Colima + Docker CLI)
- **npm** >= 10

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/sahiljain443/smartWater.git
cd smartWater
cp .env.example .env
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis mosquitto minio
```

### 3. Run database migrations and seed

```bash
docker exec -i sw-postgres psql -U smartwater -d smartwater < db/migrations/001_initial_schema.sql
POSTGRES_HOST=localhost npx tsx services/api-server/src/db/seed.ts
```

This creates:
- 10 STP sites across Hyderabad, Bengaluru, and Mumbai
- Admin user, sample assets, CPCB compliance parameters
- 120 sensor configurations

### 4. Start backend services

```bash
# API Server
POSTGRES_HOST=localhost REDIS_HOST=localhost npx tsx services/api-server/src/index.ts

# IoT Ingestion (separate terminal)
POSTGRES_HOST=localhost REDIS_HOST=localhost MQTT_BROKER_URL=mqtt://localhost:1883 \
  npx tsx services/iot-ingestion/src/index.ts

# Worker (separate terminal)
POSTGRES_HOST=localhost REDIS_HOST=localhost npx tsx services/worker/src/index.ts

# IoT Simulator (separate terminal)
POSTGRES_HOST=localhost MQTT_BROKER_URL=mqtt://localhost:1883 \
  npx tsx services/iot-simulator/src/index.ts
```

### 5. Start the dashboard

```bash
npm run dev --workspace=apps/megaliter-ops
```

Open **http://localhost:5173** and log in:
- Email: `admin@smartwaterverse.com`
- Password: `admin123456`

## Dashboard Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Site cards with traffic light health indicators and KPIs |
| Map Overview | `/map` | Leaflet map with color-coded markers, column filters, sortable table |
| Site Detail | `/sites/:id` | Live sensors, process flow diagram, charts, alerts, work orders, logbook, assets |
| Work Orders | `/work-orders` | Aggregated work orders across all sites |
| Logbook | `/logbook` | Digital logbook entries across all sites |
| Assets | `/assets` | Asset registry with category icons grouped by site |

## Key Features

### Operational Layer (Megaliter Ops)
- Real-time sensor monitoring with 3-second auto-refresh
- Traffic light health indicators (green / amber / red / offline)
- STP process flow diagram with live sensor overlays
- Time-series charts with 1H / 6H / 24H / 7D range selector and threshold lines
- Sensor grid grouped by process stage with color-coded status
- Work order management with priority and SLA tracking
- Digital logbook with shift-based entries
- Asset registry with hierarchical categorization
- CPCB/SPCB regulatory compliance parameters
- Map overview with filterable columns and sortable table

### IoT Pipeline
- MQTT-based ingestion with batch writes to TimescaleDB
- Configurable sensor thresholds with automatic alert generation
- Continuous aggregates for hourly and daily rollups
- 90-day data retention policy on raw readings
- IoT simulator with diurnal patterns and 2% anomaly injection

### Auth & Security
- Custom JWT authentication with invite-based onboarding
- Role-Based Access Control: SuperAdmin, SiteManager, Technician, SocietyAdmin, Resident
- Site-scoped data access (users only see their assigned sites)

## Environment Variables

See `.env.example` for all configuration options including:
- Database, Redis, MQTT connection strings
- JWT secret
- Telegram Bot token for notifications
- AWS SES configuration
- IoT simulator settings

## Roadmap

See `PLAN.md` for the full development roadmap covering three phases:
- **CRAWL** (Months 1–9): IoT foundation, Ops Dashboard, RWA Portal
- **WALK** (Months 10–18): Rule-based automation, Consumer App, Digital Twin
- **RUN** (Months 19–30): Water Trading Arena, ESG Credits, Predictive AI

## License

Private — All rights reserved.
