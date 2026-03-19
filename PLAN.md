# Smart WaterVerse - Application Development Plan

## 1. Document Review Summary

**Vision:** "The Operating System for Water" — a platform that evolves from fixing pumps to managing an entire water ecosystem across three layers: Operational, Consumer, and Market.

**Philosophy:** Physical First, Digital Second — reliable IoT data pipelines before any intelligence or market features.

**Three Phases:**
| Phase | Timeline | Focus |
|-------|----------|-------|
| CRAWL | Months 1-9 | Connected foundation: IoT Gateway, Data Lake, Ops Dashboard, Read-Only Portal |
| WALK | Months 10-18 | Intelligence & engagement: Rule-Based Automation, Consumer App, Digital Twin L1 |
| RUN | Months 19-30 | Market activation: Water Trading Arena, Blockchain Credits, Predictive AI |

**Reference Architecture (from PDF Page 14):**
- Layer 1 (Edge): RTU Gateway with HAL, LoRa Sensors
- Layer 2 (Ingestion & Storage): Cloud IoT Core, Time-Series DB (InfluxDB/TimescaleDB)
- Layer 3 (Application & Logic): Rule Engine, Matching Engine, API Endpoints
- Layer 4 (Presentation): Ops Dashboard (Web), Consumer App (React Native)

**Strategic Benchmarks cited:** Veolia Hubgrade, Xylem Vue, Pani Energy, Power Ledger, Civic Ledger

---

## 2. Best-in-Class System Analysis

Before defining the build plan, here is how leading platforms compare to the roadmap:

| Capability | Industry Leader | What They Do Well | Gap in Roadmap? |
|---|---|---|---|
| Real-time Ops Monitoring | **Veolia Hubgrade** | KPI dashboards, multi-site portfolio view, event correlation, SLA tracking | Roadmap has Ops Dashboard but lacks SLA/ticketing |
| Asset Performance Mgmt | **Xylem Vue** | Asset health scoring, spare parts inventory, maintenance scheduling | Roadmap mentions Digital Twin but no formal asset registry or work orders |
| Process AI & Optimization | **Pani Energy** | ML-driven chemical dosing, energy optimization per KL treated | Roadmap defers AI to Phase 3; no chemical dosing optimization mentioned |
| Consumer Engagement | **WaterSmart / Dropcountr** | Behavioral nudges, leak alerts, neighborhood comparison, AMI integration | Roadmap has Eco-Score/gamification but lacks leak alerts & comparative analytics |
| Water Trading | **Civic Ledger / Power Ledger** | Blockchain-native water accounting, regulatory-compliant credit markets | Roadmap pragmatically defers blockchain; good approach |
| Regulatory Compliance | **Hach WIMS** | Automated CPCB/SPCB/EPA report generation, parameter exceedance alerts | **Not mentioned in roadmap — critical gap for Indian STPs** |
| Network Mgmt / Leak Detection | **SWAN Analytics** | NRW (Non-Revenue Water) tracking, pressure management, acoustic leak detection | **Not mentioned — relevant if distribution is in scope** |
| Energy Management | **Aquadvanced (SUEZ)** | Energy per KL benchmarking, pump scheduling optimization | **Not explicitly mentioned — significant cost driver** |
| Field Service | **Salesforce Field Service / ServiceNow** | Mobile work orders, technician dispatch, photo capture, offline mode | **Missing — technicians need a mobile companion to the Ops Dashboard** |

---

## 3. Recommended Additional Features (Missing from Roadmap)

### Priority A — Should be in CRAWL/WALK (Operational & Consumer focus)
1. **Regulatory Compliance Engine** — Automated CPCB/SPCB report generation with parameter exceedance alerts. Indian STPs are legally required to report; automating this is a major value driver.
2. **Work Order / Ticketing System** — Maintenance requests, assignment, SLA tracking, escalation workflows. Essential for any ops dashboard.
3. **Technician Mobile App** — Offline-capable companion to Megaliter Ops for field work: log readings, capture photos, receive alerts, scan QR-coded assets.
4. **Asset Registry & Lifecycle Tracking** — Every pump, blower, membrane, filter cataloged with install date, warranty, maintenance history. Foundation for the Digital Twin.
5. **Energy Consumption Module** — Track kWh per KL treated. Energy is typically 30-40% of STP operating cost.
6. **Notification & Escalation System** — Multi-channel (Telegram Bot API, AWS SES email, Firebase FCM push) with configurable escalation chains.
7. **Consumer Leak Alerts** — Detect abnormal consumption patterns and alert residents (WaterSmart-style).
8. **Neighborhood / Society Comparison** — Anonymous benchmarking ("Your society uses 15% less than average").
9. **Billing & Invoice Integration** — Water charges per unit, maintenance fee collection, payment gateway integration.

### Priority B — Should be in WALK/RUN (Market focus)
10. **Chemical Inventory & Dosing Optimization** — Track chemical usage, automate reorder points, optimize dosing.
11. **Weather Data Integration** — Correlate rainfall/temperature with water demand and STP load.
12. **API Marketplace / Developer Portal** — Allow third-party integrations (municipal systems, real estate ERPs).
13. **Data Export & Custom Reporting** — Scheduled PDF/CSV reports for society management committees.
14. **Audit Trail & Activity Logging** — Immutable log of all system actions for compliance and dispute resolution.

---

## 4. Application Architecture (React + Docker)

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                            │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Megaliter Ops       │  │  Water Warrior   │  │  RWA Portal   │  │
│  │  (React SPA)         │  │  (React Native)  │  │  (React SPA)  │  │
│  │                      │  │                  │  │               │  │
│  │  - Dashboard         │  │  - Eco-Score     │  │  - Treatment  │  │
│  │  - Asset Management  │  │  - Water Balance │  │    volumes    │  │
│  │  - Digital Logbooks  │  │  - Community     │  │  - Recycling  │  │
│  │  - Work Orders       │  │    Board         │  │    rates      │  │
│  │  - Rule Config       │  │  - Society       │  │  - Compliance │  │
│  │  - Compliance        │  │    Consumption   │  │    status     │  │
│  │  - Digital Twin View │  │  - Notifications │  │               │  │
│  └──────────┬───────────┘  └────────┬─────────┘  └──────┬────────┘  │
└─────────────┼──────────────────────┼────────────────────┼───────────┘
              │          HTTPS / WebSocket                 │
┌─────────────┼──────────────────────┼────────────────────┼───────────┐
│             ▼                      ▼                    ▼           │
│  APPLICATION TIER (3 services — optimized for small team)          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    API Server (Fastify)                        │  │
│  │  Unified REST API + WebSocket server                          │  │
│  │  - /api/ops/*     (dashboards, assets, logbooks, work orders) │  │
│  │  - /api/consumer/* (eco-score, community, consumption)        │  │
│  │  - /api/admin/*   (users, sites, compliance, reports)         │  │
│  │  - /api/auth/*    (JWT login, invite, RBAC)                   │  │
│  │  - /ws            (real-time sensor streams)                  │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────┼────────────────────────────────────┐  │
│  │                    Redis (Bull Queues + Pub/Sub)              │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
│          │                  │                   │                    │
│  ┌───────┴──────┐  ┌───────┴────────┐  ┌──────┴─────────────────┐  │
│  │ IoT Ingest   │  │ Worker         │  │ IoT Simulator          │  │
│  │ Service      │  │ Service        │  │ (dev only)             │  │
│  │              │  │                │  │                        │  │
│  │ - MQTT sub   │  │ - Rule Engine  │  │ - 20 virtual STPs     │  │
│  │ - HAL/JSON   │  │ - Telegram Bot │  │ - Realistic sensor    │  │
│  │   normalize  │  │ - AWS SES email│  │   patterns (pH, flow, │  │
│  │ - Signature  │  │ - FCM push     │  │   turbidity, power)   │  │
│  │   verify     │  │ - PDF reports  │  │ - Anomaly injection   │  │
│  │ - Write to   │  │ - Scheduled    │  │ - MQTT publish        │  │
│  │   TimescaleDB│  │   jobs (cron)  │  │                        │  │
│  └──────────────┘  └────────────────┘  └────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                        DATA TIER (single instances)                  │
│  ┌────────────────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ PostgreSQL 16          │ │ Redis 7      │ │ MinIO (dev)       │  │
│  │ + TimescaleDB ext.     │ │              │ │ AWS S3 (prod)     │  │
│  │                        │ │ - Cache      │ │                   │  │
│  │ - Relational tables:   │ │ - Bull queues│ │ - Photos          │  │
│  │   users, assets, work  │ │ - Pub/Sub    │ │ - Documents       │  │
│  │   orders, compliance,  │ │ - Sessions   │ │ - Reports (PDF)   │  │
│  │   rules, community     │ │              │ │                   │  │
│  │ - Hypertables:         │ │              │ │                   │  │
│  │   sensor_readings      │ │              │ │                   │  │
│  │   (time-series)        │ │              │ │                   │  │
│  └────────────────────────┘ └──────────────┘ └───────────────────┘  │
│                                                                      │
│  ┌────────────────────────┐                                          │
│  │ Mosquitto (MQTT broker)│  ← IoT Gateway devices publish here     │
│  └────────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Docker Composition

All services containerized. Docker Compose for both dev and initial production (defer K8s/ECS until 50+ sites).

```
smartwater/
├── docker-compose.yml              # Full local stack
├── docker-compose.prod.yml         # Production overrides (no simulator, prod env vars)
├── .env.example                    # Environment variable template
├── turbo.json                      # Turborepo config
├── package.json                    # Root workspace config
│
├── config/
│   └── mosquitto/                  # MQTT broker config
│
├── services/
│   ├── api-server/                 # Unified REST API + WebSocket (Fastify)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── ops/            # Dashboard, assets, logbooks, work orders
│   │       │   ├── consumer/       # Eco-score, community, consumption
│   │       │   ├── admin/          # Users, sites, compliance, reports
│   │       │   └── auth/           # JWT login, invite, RBAC
│   │       ├── middleware/         # Auth, validation, error handling
│   │       ├── websocket/          # Real-time sensor streaming
│   │       └── plugins/            # Fastify plugins
│   │
│   ├── iot-ingestion/              # MQTT subscriber + data normalization
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── hal/                # Hardware Abstraction Layer (JSON normalize)
│   │       ├── mqtt/               # MQTT client + message handlers
│   │       └── validation/         # Signature verification
│   │
│   ├── worker/                     # Background jobs (Bull queues)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── jobs/
│   │       │   ├── rule-engine/    # Physics-based rule execution
│   │       │   ├── notifications/  # Telegram, SES email, FCM push
│   │       │   ├── reports/        # PDF compliance reports
│   │       │   └── scheduler/      # Cron: daily rollups, weekly reports
│   │       └── queues/             # Bull queue definitions
│   │
│   └── iot-simulator/              # Dummy data generator (dev only)
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── profiles/           # 20 STP site profiles with realistic ranges
│           ├── generators/         # Sensor data generators (pH, flow, etc.)
│           └── anomalies/          # Injectable fault scenarios
│
├── apps/
│   ├── megaliter-ops/              # React SPA — Ops Dashboard
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── services/           # API clients
│   │       ├── store/              # State management (Zustand)
│   │       └── utils/
│   │
│   ├── water-warrior/              # React Native (Expo) — Consumer App
│   │   ├── package.json
│   │   ├── app.json                # Expo config
│   │   └── src/
│   │       ├── screens/
│   │       ├── components/
│   │       ├── navigation/
│   │       ├── services/
│   │       └── store/
│   │
│   └── rwa-portal/                 # React SPA — Read-Only Admin Portal
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│
├── packages/                       # Shared code (Turborepo)
│   ├── shared-types/               # TypeScript types shared across services & apps
│   ├── api-client/                 # Generated typed API client
│   └── validators/                 # Shared Zod schemas (used by API + frontends)
│
├── infra/
│   ├── aws/                        # AWS CDK or CloudFormation templates
│   │   ├── ec2/                    # EC2 instance setup
│   │   ├── rds/                    # PostgreSQL + TimescaleDB
│   │   └── s3/                     # Buckets for documents/reports
│   └── scripts/                    # Deploy scripts, DB migrations
│
├── db/
│   ├── migrations/                 # SQL migrations (node-pg-migrate)
│   └── seeds/                      # Seed data for development
│
└── docs/
    └── api/                        # OpenAPI specs
```

---

## 5. Detailed Module Breakdown

### 5.1 OPERATIONAL LAYER — "Megaliter Ops" (Priority 1)

This is the core of the system. Every feature below maps to a React page/module.

#### 5.1.1 Real-Time Dashboard (CRAWL)
- **Traffic Light System:** Site-level health indicators (Green/Amber/Red) based on aggregated sensor status.
- **Multi-site Portfolio View:** Map-based overview of all managed STPs (inspired by Veolia Hubgrade's portfolio dashboard).
- **KPI Cards:** Water treated today, recycled volume, energy consumed, uptime %, compliance status.
- **Live Sensor Feed:** Real-time charts (Recharts/D3) for flow rate, pH, turbidity, TDS, pressure, motor current.
- **WebSocket streaming** from TimescaleDB via the ops-service.

#### 5.1.2 Digital Logbook (CRAWL)
- Replaces paper logbooks.
- Timestamped entries by technicians: readings, observations, actions taken.
- Photo/document attachment support (stored in MinIO/S3).
- Shift handover notes with acknowledgment workflow.
- Searchable and filterable history.

#### 5.1.3 Asset Registry & Management (CRAWL — Recommended Addition)
- Hierarchical asset tree: Site > Process Unit > Equipment > Component.
- QR code generation for each asset (scan in field with mobile app).
- Specifications, manuals, warranty info per asset.
- Maintenance history timeline.
- Spare parts inventory linked to assets.
- **Reference:** Xylem Vue's asset performance management module.

#### 5.1.4 Work Order / Ticketing System (CRAWL — Recommended Addition)
- Auto-generated tickets from rule-engine alerts.
- Manual ticket creation by ops managers.
- Assignment to technicians with priority/SLA timers.
- Status workflow: Open → Assigned → In Progress → Completed → Verified.
- Escalation chains: if not acknowledged in X minutes, escalate.
- **Reference:** Veolia Hubgrade's maintenance workflow; Fiix/UpKeep CMMS patterns.

#### 5.1.5 Rule-Based Automation Console (WALK)
- Visual rule builder (IF sensor X condition THEN action).
- Pre-built rule templates for common scenarios:
  - Dry Run Detection: Flow=0 AND Pump Power>0 → Alert + Auto-Shutoff
  - Filter Clog: Differential pressure > threshold → Alert
  - pH Exceedance: pH outside 6.5-8.5 → Alert + Log
  - Motor Overload: Current > rated → Alert
- Rule activation/deactivation toggle.
- Rule execution history and audit log.
- **Reference:** Veolia Hubgrade's "Assist" module for rule-based automation.

#### 5.1.6 Digital Twin L1 — Process Visualization (WALK)
- Schematic view of the STP process flow (Intake → Screening → Aeration → Clarifier → Filtration → Disinfection → Output).
- Overlay live sensor values on the schematic.
- Expected vs. Actual benchmarking per process stage.
- Deviation highlighting with root cause suggestions.
- Historical playback mode ("what happened at 2am?").
- **Reference:** Xylem Vue's digital twin; Bentley Systems OpenFlows.

#### 5.1.7 Regulatory Compliance Module (CRAWL — Recommended Addition)
- Parameter tracking against CPCB/SPCB norms (BOD < 10 mg/L, COD < 50 mg/L, TSS < 10 mg/L, pH 6.5-9.0, etc.).
- Automated daily/monthly compliance report generation (PDF).
- Exceedance alerts with mandatory corrective action logging.
- Submission-ready reports for regulatory authorities.
- Historical compliance trend analysis.
- **Reference:** Hach WIMS; Aquatic Informatics AQUARIUS.

#### 5.1.8 Energy Management Dashboard (WALK — Recommended Addition)
- kWh per KL treated benchmarking.
- Pump efficiency curves overlaid with actual operating points.
- Peak/off-peak energy usage analysis.
- Cost allocation per process unit.
- **Reference:** SUEZ Aquadvanced Energy module.

#### 5.1.9 Technician Mobile Companion (WALK — Recommended Addition)
- React PWA (offline-capable via service workers).
- Receive push notifications for assigned work orders.
- Scan asset QR codes to pull up info.
- Log field readings (with photo capture).
- GPS-stamped check-in/check-out at sites.
- Offline data entry, syncs when connectivity restored.

---

### 5.2 CONSUMER LAYER — "Water Warrior" (Priority 2)

#### 5.2.1 Eco-Score & Gamification (WALK)
- Personal Eco-Score (0-1000) calculated from:
  - Society-wide conservation metrics (total society metering — no per-flat data)
  - Recycled water usage ratio (society-level)
  - Individual conservation actions logged (self-reported)
  - Community participation and engagement
- Badges: "Recycler Champion", "Conservation Rookie", "Top 10%", etc.
- Monthly leaderboards (society-level, city-level).
- Reward points redeemable for maintenance discounts (Internal Loyalty Points as per roadmap).
- **Reference:** WaterSmart's behavioral engagement; Opower (now Oracle Utilities) for gamification patterns.

#### 5.2.2 Water Balance Visualizer (WALK)
- Animated Sankey diagram showing the journey of water:
  - Fresh water intake → Treatment → Distribution → Usage → Collection → Recycling → Reuse.
- Per-society breakdowns (society-level metering).
- Monthly/quarterly trends.
- "Where does your water go?" educational infographics.
- **Reference:** Dropcountr's usage insights; UK Water Companies' "Water Balance" reports.

#### 5.2.3 Community Board (WALK)
- Society-level announcements from management.
- Water conservation tips (rule-based recommendation engine, not GenAI as per roadmap strategy).
- Scheduled maintenance notifications.
- Discussion threads for water-related issues.
- Polls (e.g., "Should we invest in rainwater harvesting?").
- **Reference:** NationBuilder community engagement; Nextdoor-style hyperlocal boards.

#### 5.2.4 Society Consumption Dashboard & Leak Alerts (WALK — Recommended Addition)
- Daily/weekly/monthly water usage charts at **society level** (total metering only).
- Society-vs-society comparison / benchmarking ("Your society uses 15% less than average").
- Anomaly detection at intake level: "Society consumption spiked 3x yesterday — possible infrastructure leak?"
- Telegram + FCM push notification for suspected leaks.
- Historical usage data export.
- **Note:** Per-flat dashboards can be added later if individual meters are installed.
- **Reference:** WaterSmart's leak alert system; Flume Water's consumer analytics.

#### 5.2.5 Billing & Payments (WALK — Deferred Design)
- **Billing model TBD** — design flexible schema supporting per-KL, flat-fee, and hybrid models.
- Society-level billing dashboard for admins (display bills; payment collection deferred).
- Transparent water bill breakdown (fresh water, recycled water, maintenance).
- Payment gateway integration deferred until billing model is finalized.
- **Reference:** PayTM/PhonePe utility payment flows for UX patterns.

#### 5.2.6 RWA Read-Only Portal — Enhanced (CRAWL → WALK)
- Initially read-only (Phase 1 as per roadmap): water treated volumes, recycling rates.
- Phase 2 upgrade: compliance status, cost breakdown, energy consumption, comparative benchmarks.
- Exportable monthly society water report (PDF).
- Role: Society Admin / RWA President / Facility Manager.

---

### 5.3 MARKET LAYER — "Water Trade Arena" (Priority 3)

#### 5.3.1 Centralized Trading Bulletin Board (RUN)
- List surplus water availability (volume, quality grade, location, price).
- Browse/search deficit requests.
- Matching engine: auto-suggest matches based on proximity, volume, quality.
- Negotiation workflow: offer → counter → accept.
- **Step 1 implementation:** Centralized PostgreSQL ledger (as per roadmap — no blockchain initially).
- **Reference:** Power Ledger's P2P trading UX; commodity exchange order books.

#### 5.3.2 Wallet & Payment System (RUN)
- Internal wallet per organization.
- Razorpay/Stripe integration for loading funds.
- Escrow mechanism for trades (funds held until delivery confirmed).
- Transaction history and reconciliation.
- **Reference:** PayTM Business wallet patterns.

#### 5.3.3 Blockchain Trust Layer (RUN — Deferred)
- **Step 2 implementation** (only when selling ESG credits to corporates/auditors).
- Daily total volume hash written to Hyperledger/Polygon.
- Provides immutable third-party proof without per-transaction overhead.
- Smart contracts for ESG credit issuance.
- External auditor read-access portal.
- **Reference:** Civic Ledger's water accounting; Verra carbon credit registry patterns.

#### 5.3.4 ESG Credit Dashboard (RUN)
- Quantified environmental impact: CO2 offset, water saved, energy saved.
- ESG score per site.
- Credit generation tracking.
- Marketplace for selling credits to corporates.
- Audit-ready reports.

#### 5.3.5 Predictive AI Maintenance (RUN)
- ML models trained on 18+ months of sensor data.
- Failure prediction: "Bearing B — predicted failure in 14 days (vibration trend)."
- Remaining Useful Life (RUL) estimation per critical asset.
- Maintenance scheduling optimization.
- Model performance monitoring (accuracy, false positive rate).
- **Reference:** Pani Energy's AI module; Augury's machine health platform.

---

## 6. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend — Ops Dashboard** | React 18 + TypeScript, Vite, TailwindCSS, Recharts, React Query, Zustand | Modern React SPA with real-time data visualization |
| **Frontend — Consumer App** | React Native (Expo) + TypeScript | Native mobile experience; Expo for fast iteration |
| **Frontend — RWA Portal** | React 18 (shared component library with Ops) | Lightweight read-only dashboard |
| **Backend — API Server** | Node.js (Fastify) + TypeScript | Single consolidated API for ops, consumer, and admin; fast, schema-validated |
| **Backend — IoT Ingestion** | Node.js + TypeScript | MQTT subscriber, device management, data normalization |
| **Backend — Worker** | Node.js + TypeScript (Bull queues) | Rule engine execution, notifications, report generation, scheduled jobs |
| **IoT Protocol** | MQTT (Eclipse Mosquitto broker) | Industry standard for IoT; lightweight for edge devices |
| **Rule Engine** | Custom (TypeScript) with JSON rule definitions | Simple, auditable, no vendor lock-in; runs inside Worker service |
| **Auth** | Custom JWT (jsonwebtoken + bcrypt) | Lightweight; RBAC middleware; avoids Keycloak overhead for small team |
| **Database** | PostgreSQL 16 + TimescaleDB extension | Single instance: relational tables + hypertables for sensor data |
| **Cache / Events** | Redis 7 (cache + Bull queues + Pub/Sub) | Single instance: job queues, caching, WebSocket pub/sub |
| **Object Storage** | MinIO (dev) → AWS S3 (prod) | Photos, documents, reports |
| **Notifications** | Telegram Bot API (free) + AWS SES free tier + Firebase FCM (free) | Zero-cost notification stack |
| **Maps** | Leaflet + OpenStreetMap (free) | No Mapbox costs; open-source map tiles |
| **Monitoring** | CloudWatch (AWS free tier) + Grafana (optional) | Start with CloudWatch; add Grafana when needed |
| **CI/CD** | GitHub Actions → AWS ECR → Docker Compose on EC2 | Simple pipeline; defer Kubernetes |
| **Container Orchestration** | Docker Compose (dev + prod) → ECS/K8s when scaling past 50 sites | Avoid premature K8s complexity |
| **Cloud** | AWS (free tier: EC2 t3.micro, RDS, S3, IoT Core, SES) | Cost-optimized for small team |
| **IoT Simulator** | Node.js script generating realistic dummy data for 20 STP sites | Enables full development without physical hardware |

---

## 7. Phased Implementation Plan

### Phase 1: CRAWL (Months 1-9) — Foundation

**Sprint 1-2 (Weeks 1-4): Project Scaffolding & Core Infrastructure**
- [ ] Monorepo setup (Turborepo/Nx) with shared packages
- [ ] Docker Compose with all data services (TimescaleDB, PostgreSQL, Redis, MinIO, Mosquitto)
- [ ] Custom JWT auth with RBAC: SuperAdmin, SiteManager, Technician, SocietyAdmin, Resident
- [ ] CI/CD pipeline (lint, test, build, push Docker images)
- [ ] Shared UI component library (design system)

**Sprint 3-4 (Weeks 5-8): IoT Ingestion Pipeline**
- [ ] MQTT broker setup with TLS
- [ ] IoT Ingestion Service: device registration, message validation, cryptographic signature verification
- [ ] Hardware Abstraction Layer (HAL) — JSON normalization for multi-vendor protocols
- [ ] Store & Forward acknowledgment protocol
- [ ] TimescaleDB schema: hypertables for sensor readings, continuous aggregates for rollups
- [ ] Device management API: register, decommission, firmware version tracking
- [ ] IoT Simulator: 20 virtual STP site profiles with realistic sensor patterns + anomaly injection

**Sprint 5-6 (Weeks 9-12): Megaliter Ops Dashboard — Core**
- [ ] Site overview page with Traffic Light health indicators
- [ ] Multi-site map view (Leaflet + OpenStreetMap — free)
- [ ] Real-time sensor charts (WebSocket-driven)
- [ ] KPI cards: water treated, recycled, uptime
- [ ] Digital Logbook: CRUD entries, photo uploads, shift handover
- [ ] Basic alert banner for critical events

**Sprint 7-8 (Weeks 13-16): Asset Registry & Compliance**
- [ ] Asset Registry: hierarchical tree, CRUD, QR code generation
- [ ] Asset detail pages: specifications, maintenance history
- [ ] Compliance module: parameter thresholds per CPCB norms
- [ ] Automated compliance status calculation
- [ ] Compliance report PDF generation (react-pdf on server)
- [ ] Exceedance alert rules (auto-created)

**Sprint 9 (Weeks 17-18): RWA Read-Only Portal**
- [ ] Society admin registration & login
- [ ] Treatment volume dashboard (daily/monthly)
- [ ] Recycling rate display
- [ ] Water quality summary (simplified view)
- [ ] Basic transparency page ("What is an STP?")

**Sprint 10-12 (Weeks 19-26): Hardening & Ops Enhancements**
- [ ] Work Order / Ticketing system
- [ ] Notification Service: Telegram Bot + AWS SES email + FCM push for alerts
- [ ] User management console
- [ ] Data retention policies and archival
- [ ] Load testing (k6) and performance optimization
- [ ] Security audit: OWASP top 10 review
- [ ] Documentation and API specs (OpenAPI/Swagger)

---

### Phase 2: WALK (Months 10-18) — Intelligence & Engagement

**Sprint 13-15 (Weeks 27-32): Rule-Based Automation**
- [ ] Rule Engine service with JSON rule definitions
- [ ] Visual Rule Builder UI (drag-and-drop conditions/actions)
- [ ] Pre-built rule templates (dry run, filter clog, pH exceedance, motor overload)
- [ ] Rule execution with audit trail
- [ ] Auto-actions: trigger alerts, auto-shutoff commands, create work orders
- [ ] Rule performance dashboard (how often triggered, false positive tracking)

**Sprint 16-18 (Weeks 33-38): Water Warrior Consumer App**
- [ ] React Native (Expo) project scaffolding
- [ ] Invite-based onboarding: admin sends invite link → resident creates account
- [ ] Eco-Score calculation engine (society-level metrics + individual actions)
- [ ] Badge/achievement system
- [ ] Water Balance Visualizer (Sankey diagram — society-level)
- [ ] Community Board with announcements and tips
- [ ] Push notifications (Firebase Cloud Messaging — free)
- [ ] Telegram Bot integration for alerts

**Sprint 19-20 (Weeks 39-42): Consumer Enhancements**
- [ ] Society-level consumption dashboard (total metering)
- [ ] Leak alert detection at intake level and Telegram/FCM notification
- [ ] Society-vs-society comparison / benchmarking
- [ ] Billing module: flexible schema design (model TBD), display-only for now
- [ ] RWA Portal upgrade: cost breakdown, energy view

**Sprint 21-23 (Weeks 43-48): Digital Twin L1 & Energy**
- [ ] STP process schematic view (interactive SVG/Canvas)
- [ ] Live sensor overlay on schematic
- [ ] Expected vs. Actual comparison engine
- [ ] Deviation detection and highlighting
- [ ] Historical playback slider
- [ ] Energy management dashboard: kWh per KL, pump efficiency
- [ ] Technician Mobile PWA companion app

**Sprint 24 (Weeks 49-50): WALK Phase Hardening**
- [ ] Performance optimization for real-time features
- [ ] Consumer app beta testing with pilot societies
- [ ] Rule engine tuning based on real operational data
- [ ] Security review

---

### Phase 3: RUN (Months 19-30) — Market & AI

**Sprint 25-28 (Weeks 51-60): Water Trade Arena**
- [ ] Trading data model: listings, orders, matches, settlements
- [ ] Listing creation flow (surplus water: volume, quality, price, availability window)
- [ ] Search and browse marketplace
- [ ] Matching engine (proximity + volume + quality scoring)
- [ ] Negotiation workflow UI
- [ ] Wallet system with Razorpay/Stripe funding
- [ ] Escrow mechanism for active trades
- [ ] Transaction history and reconciliation

**Sprint 29-31 (Weeks 61-68): ESG Credits & Blockchain**
- [ ] ESG impact calculator (CO2 offset, water saved)
- [ ] Credit generation tracking dashboard
- [ ] Daily volume hash to Hyperledger/Polygon
- [ ] Smart contract for credit issuance
- [ ] External auditor portal (read-only blockchain verification)
- [ ] ESG report generation (GRI/CDP aligned)

**Sprint 32-35 (Weeks 69-78): Predictive AI**
- [ ] Data pipeline for ML training (historical sensor data export)
- [ ] Feature engineering service
- [ ] Failure prediction models (vibration analysis, current trending)
- [ ] Remaining Useful Life (RUL) estimation
- [ ] AI-recommended maintenance scheduling
- [ ] Model monitoring and retraining pipeline
- [ ] Chemical dosing optimization (stretch goal)

---

## 8. Cross-Cutting Concerns

### 8.1 Security
- **Authentication:** Custom JWT auth (jsonwebtoken + bcrypt), MFA for admin roles (TOTP)
- **Authorization:** RBAC middleware with hierarchical permissions (SuperAdmin > SiteManager > Technician; SocietyAdmin > Resident)
- **API Security:** JWT tokens, rate limiting, input validation (Zod schemas)
- **Data Encryption:** TLS in transit, AES-256 at rest for sensitive data
- **IoT Security:** Hardware-level cryptographic signing (as per roadmap), certificate-based device auth
- **Audit Trail:** Immutable activity log for all write operations

### 8.2 Multi-Tenancy
- Tenant = Society/Site
- PostgreSQL Row-Level Security (RLS) for data isolation
- Tenant-scoped API routes
- Separate TimescaleDB hypertables per tenant (or tenant_id column with RLS)

### 8.3 Observability
- **Metrics:** Prometheus exporters on every service + Grafana dashboards
- **Logging:** Structured JSON logs → Loki → Grafana
- **Tracing:** OpenTelemetry → Jaeger (for debugging cross-service requests)
- **Uptime:** Health check endpoints on every service

### 8.4 Offline & Resilience
- **Edge (IoT Gateway):** Store & Forward — zero data loss per roadmap
- **Consumer App (React Native):** AsyncStorage + SQLite for offline data, background sync
- **Technician PWA:** Offline work order completion, sync on reconnect
- **Backend:** Retry queues for failed notifications, idempotent API design

---

## 9. Decisions Log (Answers to Clarification Questions)

| # | Question | Decision |
|---|----------|----------|
| 1 | Cloud Provider | **AWS** |
| 2 | Monorepo vs Polyrepo | **Monorepo** (Turborepo) |
| 3 | Consumer App Tech | **React Native** (Expo) from day one |
| 4 | STP Sites at Launch | **20+** (10 already installed) |
| 5 | Hardware Integration | **Dummy/simulated data for now**; real STP integration later |
| 6 | CPCB/SPCB Norms | Build **configurable compliance framework** (TBD) |
| 7 | Technician Team | **Small team** — simple assignment, no complex dispatch |
| 8 | User Onboarding | **Invite-based** (admin pre-registers residents) |
| 9 | Water Metering | **Total society metering** only (no per-flat meters) |
| 10 | Billing Model | **TBD** — design flexible schema, defer payment integration |
| 11 | Water Trading Regs | **TBD** — Market Layer deferred |
| 12 | Trading Scope | **TBD** — Market Layer deferred |
| 13 | ESG Standard | **TBD** — Market Layer deferred |
| 14 | Pilot Site | 10 STPs installed; **use dummy data** until integration phase |
| 15 | Team Size | **< 10 people** total (small company) |
| 16 | Budget | **Free-tier first**: Telegram Bot API for notifications, Leaflet (free) for maps, no paid SMS/push services |

### Key Design Implications

**Small Team (~10) Architecture Simplification:**
- Consolidate 8 microservices → **3 backend services** (api-server, iot-ingestion, worker) to reduce operational overhead
- Single PostgreSQL instance with TimescaleDB extension (not separate databases)
- Redis for cache + event bus + sessions (one instance, multiple logical DBs)
- Defer Keycloak — use **lightweight custom JWT auth** (Keycloak is overkill for <10 team)
- Docker Compose for dev AND initial production (defer Kubernetes until scale demands it)
- AWS free-tier: EC2 t3.micro, RDS free tier, S3, IoT Core free tier (250K messages/month)

**Total Society Metering Impact:**
- Consumer consumption dashboard shows **society-level** data, not per-flat
- Leak alerts operate at **society intake level** (anomaly in total consumption), not per-unit
- Eco-Score calculated from **society-wide conservation metrics** and individual participation actions (not individual consumption)
- Neighborhood comparison = **society vs. society** benchmarking

**Free-Tier Notification Stack:**
- **Telegram Bot API** (free, unlimited) — primary channel for ops alerts and consumer notifications
- **Email** via AWS SES free tier (62K emails/month) — compliance reports, summaries
- **React Native Push** via Firebase Cloud Messaging (free) — consumer app push notifications
- No Twilio, no WhatsApp Business API

---

## 10. Immediate Next Steps

All decisions captured. Implementation sequence:

1. **Initialize Turborepo monorepo** with Docker Compose, shared packages, and GitHub Actions CI
2. **Stand up the data tier** (PostgreSQL+TimescaleDB, Redis, Mosquitto, MinIO) — all in Docker
3. **Build the IoT Simulator** (20 virtual STPs with realistic data — unblocks all frontend work)
4. **Build API Server + JWT Auth** (Fastify, RBAC, invite-based onboarding)
5. **Build the Megaliter Ops Dashboard** (React SPA — core operational value)
6. **Build the RWA Portal** (React SPA — quick win for transparency)
7. **Build the Water Warrior App** (React Native via Expo — consumer engagement)

**Ready to begin scaffolding.**
