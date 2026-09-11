# Software Requirements Specification (SRS)

## KisanPatrika — Farmer-to-Consumer Digital Agriculture Ecosystem

**Document Version:** 1.2  
**Date:** September 2026  
**Prepared by:** Development Team  
**Project Owner:** KisanPatrika  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Database Design](#6-database-design)
7. [API Specification](#7-api-specification)
8. [Frontend Requirements](#8-frontend-requirements)
9. [Security Requirements](#9-security-requirements)
10. [External Interfaces](#10-external-interfaces)
11. [Future Modules](#11-future-modules)
12. [Assumptions & Dependencies](#12-assumptions--dependencies)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for **KisanPatrika**, a farmer-to-consumer (F2C) digital marketplace and farm ecosystem platform. The platform connects small to large farmers directly with consumers, retailers, exporters, and service providers — combining real market access, traceable produce, expert support, and AI-powered assistance.

### 1.2 Scope

KisanPatrika is a full-stack web application built on a clear two-tier separation:

- **Frontend (Client-facing):** Fully built in **Next.js (React.js)** — handles all user-facing pages, UI rendering, and user interactions. The frontend communicates exclusively with backend APIs; it contains no direct database access.

- **Backend (Server-side):** Fully built in **NestJS (Node.js)** — consists of **two sections**:
  1. **Swagger API Layer** — RESTful APIs documented via Swagger/OpenAPI. Every business operation (auth, products, marketplace, mandi, weather, schemes, AI, dashboard, profile, farm, membership) is handled exclusively through these APIs. No business logic resides in the frontend.
  2. **Backend Admin UI** — A server-side admin panel rendered by NestJS itself (using a templating engine such as EJS/Hbs). This UI provides administrators with tools to manage users, products, content, schemes, mandi data, memberships, payments, and system configuration — all of which also operate through the same internal API services.

- **Databases:** Three databases work together:
  - **MySQL** (primary) — All relational/transactional data (users, products, orders, categories, RBAC, locations)
  - **MongoDB** — Flexible/non-relational data (activity logs, event tracking, AI session logs)
  - **Redis** — In-memory cache (OTP storage, JWT blacklist, session tokens, captcha)

> **Key Principle:** Everything is API-driven. The Next.js frontend and the NestJS backend admin UI are both consumers of the same NestJS API services. No frontend component directly accesses any database.

The system covers the following major modules:

- User Registration & Authentication (OTP-based, JWT)
- Farmer Marketplace (buy, sell, barter, lease)
- Product Catalog with N-level categories
- Mandi (Market) Rates
- Weather Forecast & Farming Advisory
- Government Schemes & Subsidies
- AI Assistant (chatbot)
- Dashboard with KPIs, charts, and analytics
- Membership Plans
- Farm Plot Management
- User Profile Management

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| F2C | Farmer-to-Consumer direct marketplace model |
| OTP | One-Time Password (6-digit, sent via SMS) |
| JWT | JSON Web Token for stateless authentication |
| RBAC | Role-Based Access Control |
| SRS | Software Requirements Specification |
| Mandi | Agricultural market/marketplace in India |
| KCC | Kisan Credit Card |
| KYC | Know Your Customer (identity verification) |
| TTL | Time-to-Live (for Redis keys) |
| 3NF | Third Normal Form (database normalization) |
| UUID | Universally Unique Identifier (CHAR(36)) |
| CMS | Content Management System |
| CRM | Customer Relationship Management |
| ERP | Enterprise Resource Planning |

### 1.4 References

- Next.js 14.x documentation — https://nextjs.org/docs
- NestJS 10.x documentation — https://docs.nestjs.com
- TypeORM documentation — https://typeorm.io
- Redis documentation — https://redis.io/docs
- MongoDB/Mongoose documentation — https://mongoosejs.com
- TailwindCSS — https://tailwindcss.com
- Swagger/OpenAPI — https://swagger.io/specification

### 1.5 Overview

This document is organized as follows: Section 2 provides an overall description of the system, users, and use cases. Section 3 describes the system architecture. Sections 4–5 detail functional and non-functional requirements. Sections 6–7 cover database and API specifications. Section 8 covers frontend pages. Sections 9–10 address security and external interfaces. Sections 11–12 cover future modules and assumptions.

---

## 2. Overall Description

### 2.1 Product Perspective

KisanPatrika is an independent, standalone web platform with a strict **frontend-backend separation**:

- The **frontend** is a pure client-side application (Next.js/React) that renders UI and calls backend APIs.
- The **backend** is a pure server-side application (NestJS/Node.js) that exposes two interfaces:
  1. **Swagger REST APIs** (`/api/*`) — consumed by the Next.js frontend, mobile apps (future), and third-party integrations.
  2. **Backend Admin UI** (`/admin/*`) — server-rendered pages within NestJS for platform administrators.
- All data operations go through the backend API layer — neither the frontend nor the admin UI directly access MySQL, MongoDB, or Redis.

The platform is designed to be mobile-responsive and works on desktop, tablet, and mobile browsers.

### 2.2 User Classes & Characteristics

| User Type | Description | Access Level |
|-----------|-------------|--------------|
| **Guest** | Unregistered visitor browsing the site. Education level: 6th–8th standard. Needs extremely simple, icon-driven UI. | View home, marketplace, categories, mandi rates, weather, schemes, about, contact, help, privacy |
| **Guest User** | OTP-verified mobile-only user (no password). Education level: 6th–8th standard. May not understand complex forms. | Guest dashboard access, limited features |
| **Registered Farmer (Primary Seller)** | Full account with OTP-verified mobile, email, password, and address. Education level: 6th–8th standard (may vary). Primary goal: sell their farm produce and buy farming inputs. Needs step-by-step guided flows with visual cues. | Full marketplace access, product listing, farm management, profile, membership |
| **Registered Farmer (Primary Buyer)** | Same account, but primarily purchases farming-related items (seeds, tools, equipment, livestock, fertilizers). Needs simple search, big product images, and easy contact-seller flow. | Browse, contact sellers, place orders, wishlist |
| **Buyer/Consumer** | Registered non-farmer user who purchases farm produce directly from farmers | Browse, contact sellers, place orders, wishlist |
| **Seller** | Registered farmer who lists products for sale | List products, manage inventory, respond to offers, view analytics |
| **Service Provider** | Registered user offering services (transport, labour, equipment lease) | List services, receive inquiries |
| **Admin** | Platform administrator accessing the Backend Admin UI (`/admin/*`) | Full system access via NestJS admin panel: user management, content management, mandi data, schemes, memberships, payments, analytics |

### 2.3 Operating Environment

- **Frontend (Client UI):** Next.js 14.x, React 18.x, TailwindCSS 3.x, runs on Node.js 20+
- **Backend (API + Admin UI):** NestJS 10.x, TypeScript 5.x, runs on Node.js 20+
  - Swagger API docs served at `/api/docs`
  - Backend Admin UI served at `/admin/*` (server-side rendered)
- **MySQL:** 8.x (InnoDB engine, utf8mb4 charset) — primary database
- **Redis:** 7.x — cache, OTP, JWT blacklist
- **MongoDB:** 8.x (optional, toggleable via environment variable) — activity logs
- **OS:** Linux (development & production)
- **Browser:** Chrome, Firefox, Safari, Edge (latest 2 versions)

### 2.4 Use Case Summary

| Use Case | Actor | Description |
|----------|-------|-------------|
| UC-01: Browse Home Page | Guest | View landing page with services, hero banner, free info |
| UC-02: Register | Guest | Create account with name, mobile, email, password, address |
| UC-03: Verify OTP | Guest | Enter 6-digit OTP sent to mobile |
| UC-04: Login | Registered User | Login with mobile + password |
| UC-05: Guest Login | Guest | Quick access with mobile + OTP only |
| UC-06: Logout | Authenticated User | Invalidate JWT via Redis blacklist |
| UC-07: Browse Marketplace | Any User | Search/filter products by category, location, price |
| UC-08: View Product Detail | Any User | View full product info, images, seller contact |
| UC-09: List Product | Seller | Create product listing with images, price, quantity |
| UC-10: Manage Products | Seller | Edit/delete own product listings |
| UC-11: Browse Categories | Any User | View N-level category tree with product counts |
| UC-12: View Mandi Rates | Any User | View daily mandi rates filtered by state/crop |
| UC-13: View Weather | Any User | View 7-day forecast and farming advisory |
| UC-14: View Govt Schemes | Any User | Browse central/state government schemes |
| UC-15: AI Assistant | Any User | Chat with AI assistant for farming queries |
| UC-16: View Dashboard | Authenticated User | View KPIs, charts, activity timeline |
| UC-17: Manage Profile | Authenticated User | View/edit profile, change password |
| UC-18: Manage Farm | Authenticated User | Add/edit farm plots, track crops |
| UC-19: View Membership | Authenticated User | View/upgrade membership plans |
| UC-20: Contact Support | Any User | Send message to support team |
| UC-21: View About | Any User | Read about company mission/vision |
| UC-22: View Help/FAQ | Any User | Search and browse frequently asked questions |
| UC-23: View Privacy Policy | Any User | Read privacy policy |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                            │
│                                                               │
│  ┌─────────────────────────┐   ┌───────────────────────────┐ │
│  │   Frontend (Next.js)     │   │  Backend Admin UI (NestJS) │ │
│  │   React + TailwindCSS    │   │  Server-side rendered      │ │
│  │   Port: 3000             │   │  Port: 4000/admin/*        │ │
│  │   Consumer-facing pages  │   │  Admin management panel    │ │
│  └───────────┬─────────────┘   └───────────┬───────────────┘ │
└──────────────┼──────────────────────────────┼────────────────┘
               │  REST API calls (JSON)       │
               ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS / Node.js)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SECTION 1: Swagger API Layer                │ │
│  │          /api/*  │  Docs: /api/docs (Swagger UI)         │ │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │ Auth   │ │ Users    │ │ Products │ │ Marketplace  │  │ │
│  │  │ Module │ │ Module   │ │ Module   │ │ Module       │  │ │
│  │  └────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │ Mandi  │ │ Weather  │ │ Schemes  │ │ AI Assistant │  │ │
│  │  │ Module │ │ Module   │ │ Module   │ │ Module       │  │ │
│  │  └────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │Dashboard│ │ Profile  │ │ Farm Mgmt│ │ Membership   │  │ │
│  │  │ Module │ │ Module   │ │ Module   │ │ Module       │  │ │
│  │  └────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           SECTION 2: Backend Admin UI                    │ │
│  │              /admin/* (Server-rendered)                  │ │
│  │  User Mgmt │ Content Mgmt │ Data Mgmt │ System Config   │ │
│  │  (Calls the same internal services as Section 1)         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Redis  │ │  Mongo   │ │  Config  │ │    Swagger       │  │
│  │ Module  │ │ Module   │ │ Module   │ │    Module        │  │
│  └─────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│  MySQL   │  │  Redis   │  │   MongoDB    │
│  (Primary│  │ (Cache,  │  │  (Activity   │
│   Data)  │  │  OTP,    │  │   Logs,      │
│          │  │  JWT BL) │  │   Optional)  │
└──────────┘  └──────────┘  └──────────────┘
```

> **Architecture Rule:** The Next.js frontend and the NestJS admin UI are both thin clients. All business logic, data validation, and database access live exclusively in the NestJS backend. Neither the frontend nor the admin UI directly query MySQL, MongoDB, or Redis.

### 3.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend (Client UI)** | | |
| Frontend Framework | Next.js (React.js) | 14.2.x |
| UI Library | React | 18.3.x |
| Styling | TailwindCSS | 3.4.x |
| Icons | lucide-react | 0.400.x |
| Charts | Recharts | 2.12.x |
| **Backend (API + Admin UI)** | | |
| Backend Framework | NestJS (Node.js) | 10.4.x |
| Language | TypeScript | 5.5.x |
| API Documentation | Swagger/OpenAPI | via @nestjs/swagger |
| Admin UI Templating | EJS / Hbs / Pug | (server-side rendered) |
| ORM (MySQL) | TypeORM | 0.3.20 |
| ODM (MongoDB) | Mongoose | 8.x |
| Redis Client | ioredis | 5.x |
| Auth | Passport-JWT | 4.0.x |
| Password Hashing | bcrypt | 5.1.x |
| Validation | class-validator + Joi | — |
| **Databases** | | |
| Primary DB | MySQL | 8.x |
| Cache/Session | Redis | 7.x |
| Document DB | MongoDB | 8.x (optional) |

### 3.3 Backend Module Structure

The NestJS backend is organized into two clear sections:

```
backend/src/
├── main.ts                        # Bootstrap, CORS, Swagger, global prefix /api
├── app.module.ts                  # Root module (Config, TypeORM, Redis, Mongo, Auth, Admin)
│
├── config/
│   └── env.validation.ts          # Joi schema for environment variables
│
├── common/
│   └── entities/
│       └── status-master.entity.ts
│
├── redis/
│   ├── redis.module.ts            # Redis client provider
│   ├── redis.service.ts           # Wrapper: get, set, del, exists, expire
│   └── redis.constants.ts         # Injection token (REDIS_CLIENT)
│
├── mongo/
│   ├── mongo.module.ts            # Dynamic module (enabled/disabled by env)
│   ├── schemas/
│   │   └── activity-log.schema.ts
│   └── activity-log.service.ts     # No-op fallback if disabled
│
├── users/
│   └── entities/
│       ├── user.entity.ts
│       ├── address.entity.ts
│       └── entity-address.entity.ts
│
├── auth/                          # --- SECTION 1: Swagger API Layer ---
│   ├── auth.module.ts             # TypeORM, Passport, JWT config
│   ├── auth.controller.ts         # REST endpoints (/api/auth/*)
│   ├── auth.service.ts            # Business logic
│   ├── jwt.strategy.ts            # Passport JWT validation
│   ├── jwt-auth.guard.ts          # Guard with Redis blacklist check
│   └── dto/
│       ├── send-otp.dto.ts
│       ├── verify-otp.dto.ts
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └── guest-login.dto.ts
│
├── admin/                         # --- SECTION 2: Backend Admin UI ---
│   ├── admin.module.ts            # Admin module (server-side rendering)
│   ├── admin.controller.ts        # Routes: /admin/* (rendered pages)
│   ├── admin.service.ts           # Calls same internal services as API layer
│   └── views/                     # EJS/Hbs templates for admin pages
│       ├── layout.ejs
│       ├── dashboard.ejs
│       ├── users.ejs
│       ├── products.ejs
│       ├── mandi.ejs
│       ├── schemes.ejs
│       ├── memberships.ejs
│       └── settings.ejs
│
└── (future API modules)
    ├── products/                  # Product CRUD APIs
    ├── marketplace/               # Marketplace APIs
    ├── mandi/                     # Mandi rates APIs
    ├── weather/                   # Weather APIs
    ├── schemes/                   # Govt schemes APIs
    ├── ai-assistant/              # AI assistant APIs
    ├── dashboard/                 # Dashboard data APIs
    ├── profile/                   # Profile APIs
    ├── farm/                      # Farm management APIs
    └── membership/                # Membership APIs
```

### 3.4 API-Driven Communication Model

```
┌──────────────┐     JSON/HTTP      ┌───────────────┐     TypeORM      ┌────────┐
│  Next.js     │ ──────────────────▶│  NestJS API   │ ────────────────▶│ MySQL  │
│  Frontend    │◀──────────────────│  (Swagger)    │◀────────────────│        │
└──────────────┘                   └───────┬───────┘                  └────────┘
                                           │     Mongoose    ┌──────────────┐
                                           │ ───────────────▶│  MongoDB     │
                                           │◀────────────────│              │
                                           │     ioredis     ┌──────────────┐
                                           │ ───────────────▶│  Redis       │
                                           │◀────────────────│              │
┌──────────────┘                   └───────┴───────┘                  └──────────────┘
│  NestJS      │     Internal       ┌───────────────┐
│  Admin UI    │ ──────────────────▶│  Same NestJS  │
│  (/admin/*)  │◀──────────────────│  Services     │
└──────────────┘                   └───────────────┘
```

**Rules:**
1. The Next.js frontend calls only `/api/*` endpoints (Swagger APIs).
2. The NestJS admin UI (`/admin/*`) calls the same internal service classes — it does not bypass the API layer.
3. No client (frontend or admin UI) directly accesses MySQL, MongoDB, or Redis.
4. All validation, authorization, and business rules are enforced in NestJS services.

### 3.5 Polyglot Persistence — Every Entry in All Three Databases

**Rule:** Every business entry created in the system SHALL be reflected in **all three databases** throughout its lifecycle. MySQL is the transactional source of truth; MongoDB and Redis receive a parallel mirror of every write.

```
                    ┌──────────────────────────────────────────────┐
                    │              NestJS Service                  │
                    │                                              │
   API request ───▶ │  1. Save to MySQL (source of truth)          │
                    │  2. DataSyncService.mirror() — in PARALLEL:  │
                    │       ├─▶ MongoDB  synced_records (copy)     │
                    │       └─▶ Redis    record:<entity>:<id>      │
                    │                  + recent:<entity> list      │
                    └──────────────────────────────────────────────┘
```

| Database | Role | What is stored |
|---|---|---|
| **MySQL** | Source of truth | Normalized row in the entity table (e.g. `service_interest_history`, `users`) |
| **MongoDB** | Analytics / audit copy | Full snapshot in `synced_records` (`entity`, `refId`, `payload`, `sessionId`, `mobile`, `userId`) |
| **Redis** | Hot cache | `record:<entity>:<id>` → JSON snapshot (TTL 24h); `recent:<entity>` → list of latest 200 ids |

**Implementation:** `DataSyncService` (`src/mongo/data-sync.service.ts`) is a global, reusable service. After every MySQL `save()`, the owning service calls `dataSync.mirror({ entity, refId, payload, ... })`. Mongo and Redis writes run in parallel via `Promise.allSettled` — a mirror failure is logged but never fails the request, since MySQL is already committed.

**Currently mirrored entities:** `service_interest`, `user` (registration). All future modules (products, orders, offers, mandi rates, etc.) MUST call `dataSync.mirror()` after their MySQL write.

**Verification commands** are documented in `docs/OPERATIONS.md`.

---

## 4. Functional Requirements

### 4.1 Authentication Module

#### FR-AUTH-01: Send OTP
- **Description:** System shall generate a 6-digit OTP and send it to the user's mobile number.
- **Input:** Mobile number (10 digits, Indian format)
- **Processing:** Generate random 6-digit OTP → Store in Redis with key `otp:{mobile}` and TTL of 300 seconds (5 minutes) → In dev mode, return OTP in response; in production, send via SMS gateway.
- **Output:** Success message, expiry time, (dev mode: OTP value)
- **API:** `POST /api/auth/otp/send`

#### FR-AUTH-02: Verify OTP
- **Description:** System shall verify the OTP entered by the user.
- **Input:** Mobile number, 6-digit OTP
- **Processing:** Compare OTP with Redis stored value → On success, delete OTP key and set `otp-verified:{mobile}` with TTL of 600 seconds (10 minutes) → On failure, return error.
- **Output:** Success/failure message, verified duration
- **API:** `POST /api/auth/otp/verify`

#### FR-AUTH-03: Register New User
- **Description:** System shall register a new user after OTP verification.
- **Input:** Full name, mobile (OTP-verified), email, password, address (line 1, line 2, latitude, longitude)
- **Processing:** Verify mobile is OTP-verified → Check no duplicate email/mobile → Look up active status from `status_master` → Hash password with bcrypt (10 rounds) → Create user record → Create address record → Link address to user via `entity_addresses` → Issue JWT → Send thank-you email (future) → Log activity to MongoDB.
- **Output:** JWT access token, user details, role
- **API:** `POST /api/auth/register`
- **Note:** Captcha has been removed from registration flow per user request.

#### FR-AUTH-04: Login
- **Description:** System shall authenticate a registered user with mobile + password.
- **Input:** Mobile number, password
- **Processing:** Find user by mobile → Compare bcrypt password hash → Check user is active → Issue JWT → Log activity.
- **Output:** JWT access token, user details, role
- **API:** `POST /api/auth/login`

#### FR-AUTH-05: Guest Login
- **Description:** System shall allow guest access with mobile + OTP only (no password).
- **Input:** Mobile number, OTP
- **Processing:** Verify OTP → If user exists, issue guest JWT → If not, create minimal guest account → Issue JWT with role=guest → Log activity.
- **Output:** JWT access token (role=guest), user details
- **API:** `POST /api/auth/guest`

#### FR-AUTH-06: Logout
- **Description:** System shall invalidate the current JWT.
- **Input:** Bearer token (in Authorization header)
- **Processing:** Decode JWT → Calculate remaining TTL → Store token in Redis blacklist `blacklist:{token}` with TTL → Log activity.
- **Output:** Success message
- **API:** `POST /api/auth/logout`
- **Guard:** JwtAuthGuard

#### FR-AUTH-07: Get Current User
- **Description:** System shall return the authenticated user's information from JWT.
- **Input:** Bearer token
- **Output:** User object (id, mobile, role)
- **API:** `GET /api/auth/me`
- **Guard:** JwtAuthGuard

### 4.2 Marketplace Module

#### FR-MKT-01: Browse Products
- **Description:** Users shall browse products with filters.
- **Filters:** Category (N-level tree), search text (title, seller, location), state
- **Output:** Paginated product list with images, price, location, seller, category path
- **Page:** `/marketplace`

#### FR-MKT-02: View Product Detail
- **Description:** Users shall view full product details.
- **Output:** Product images, title, price, category path, location, seller info, features, related products
- **Page:** `/marketplace/[id]`

#### FR-MKT-03: List Product for Sale
- **Description:** Authenticated sellers shall create product listings.
- **Input:** Title, description, category, price, quantity, unit, images, location (GPS), is_negotiable
- **Page:** `/my-products` (Add Product button)

#### FR-MKT-04: Manage Own Products
- **Description:** Sellers shall view, edit, and delete their own product listings.
- **Output:** Product list with status (Active/Sold Out), view count, edit/delete actions
- **Page:** `/my-products`

#### FR-MKT-05: Browse Categories
- **Description:** Users shall browse the N-level category tree.
- **Output:** Category cards with images, listing counts, subcategory counts
- **Page:** `/categories`

### 4.3 Mandi Rates Module

#### FR-MANDI-01: View Mandi Rates
- **Description:** Users shall view daily mandi rates for major crops.
- **Filters:** State, crop/mandi search
- **Output:** Table with crop, variety, state, mandi, min/max/avg price, trend (% change)
- **Page:** `/mandi`

### 4.4 Weather Module

#### FR-WX-01: View Weather Forecast
- **Description:** Users shall view 7-day weather forecast and farming advisory.
- **Input:** City selection
- **Output:** Today's weather card (temp, humidity, wind), 7-day forecast grid, farming advisory (temperature advisory, rain alert, wind advisory)
- **Page:** `/weather`

### 4.5 Government Schemes Module

#### FR-GOV-01: Browse Government Schemes
- **Description:** Users shall browse central and state government schemes and subsidies.
- **Filters:** Category (All, Central, State, Loan)
- **Output:** Scheme cards with title, description, eligibility, deadline, benefits, apply button
- **Page:** `/schemes`

### 4.6 AI Assistant Module

#### FR-AI-01: Chat with AI Assistant
- **Description:** Users shall interact with an AI assistant for farming queries.
- **Input:** Text questions about crops, weather, mandi rates, government schemes
- **Output:** AI-generated responses, suggested questions
- **Page:** `/ai-assistant`
- **Note:** Currently a demo UI; full AI integration is future scope.

### 4.7 Dashboard Module

#### FR-DASH-01: View Dashboard
- **Description:** Authenticated users shall view a dashboard with KPIs and analytics.
- **Output:** KPI cards, charts (sales, revenue), module grid, activity timeline, product lifecycle
- **Page:** `/dashboard`
- **Components:** Sidebar, Header, KpiCards, ChartsSection, ModuleGrid, ActivityTimeline, ProductLifecycle

### 4.8 Farm Management Module

#### FR-FARM-01: Manage Farm Plots
- **Description:** Authenticated users shall manage their farm plots.
- **Input:** Plot name, area, location, current crop, sown date, harvest date, irrigation type, soil type
- **Output:** Farm plot cards with crop details, quick actions (weather, irrigate, schedule)
- **Page:** `/my-farm`

### 4.9 Profile Module

#### FR-PROF-01: View & Edit Profile
- **Description:** Authenticated users shall view and edit their profile information.
- **Fields:** Name, mobile, email, state, district, city
- **Page:** `/profile`

#### FR-PROF-02: Change Password
- **Description:** Users shall change their password.
- **Input:** Current password, new password, confirm password
- **Page:** `/profile`

### 4.10 Membership Module

#### FR-MEM-01: View Membership Plans
- **Description:** Users shall view available membership plans and their current plan.
- **Plans:** Free, Silver (₹99/mo or ₹999/yr), Gold (₹199/mo or ₹1999/yr)
- **Features per plan:** Product listing limits, priority listing, advanced analytics, buyer discovery
- **Page:** `/membership`

### 4.11 Content Pages

#### FR-CONTENT-01: About Us
- **Description:** Display company mission, vision, core values, and statistics.
- **Page:** `/about`

#### FR-CONTENT-02: Contact
- **Description:** Display contact information and a contact form (name, mobile, email, message).
- **Page:** `/contact`

#### FR-CONTENT-03: Help & FAQ
- **Description:** Searchable FAQ with expandable answers and contact options.
- **Page:** `/help`

#### FR-CONTENT-04: Privacy Policy
- **Description:** Display privacy policy covering data collection, usage, security, third-party sharing, user rights, and policy changes.
- **Page:** `/privacy`

### 4.12 Language Support

#### FR-LANG-01: Bilingual Support
- **Description:** The frontend shall support English and Hindi languages.
- **Implementation:** Language toggle in navbar on all public pages.
- **Scope:** All UI text, labels, buttons, and content support both languages.

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time (initial) | < 3 seconds |
| API response time (auth) | < 500ms |
| API response time (list/search) | < 1 second |
| Database query time | < 200ms (indexed) |
| Frontend bundle size | < 500KB (gzipped) |
| Concurrent users (Phase 1) | 1,000 |
| Redis operations | < 10ms |

### 5.2 Scalability

- Backend is stateless (JWT-based) → horizontal scaling via load balancer
- Redis can be clustered for higher throughput
- MySQL read replicas for read-heavy operations (future)
- MongoDB sharding for activity logs (future)
- CDN for static assets and images (future)

### 5.3 Availability

- Target uptime: 99.5% (Phase 1)
- Graceful degradation: MongoDB disabled → activity logging becomes no-op
- Redis unavailable → OTP/captcha features show error, core browsing unaffected

### 5.4 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT signed with secret key (configurable via env)
- JWT blacklisted in Redis on logout
- Input validation on all API endpoints (class-validator DTOs)
- Environment variable validation with Joi on startup
- CORS enabled for frontend origin
- SQL injection prevention via TypeORM parameterized queries
- XSS prevention via React's built-in escaping
- HTTPS in production (via reverse proxy)

### 5.5 Maintainability

- Modular NestJS architecture (each domain is a separate module)
- TypeScript strict typing throughout backend
- Shared components (Navbar, Footer) for frontend consistency
- Database schema follows 3NF with consistent naming conventions
- All tables have audit fields (created_by, updated_by, deleted_by, timestamps)
- Soft deletes via `deleted_at` column on all tables

### 5.6 Reliability

- Environment validation on application startup (fail fast)
- MongoDB connection optional (toggleable via `MONGO_ENABLED`)
- Redis connection required for auth features (OTP, blacklist)
- MySQL connection required for all data operations

### 5.7 Usability — Farmer-Centric Simplified Design

> **Critical Context:** The primary users are Indian farmers with an education level equivalent to 6th–8th standard. The UI must be designed so that someone with basic reading ability can navigate, sell products, and purchase farming items without confusion or assistance.

#### 5.7.1 Core Usability Principles

| Principle | Implementation |
|-----------|---------------|
| **Minimal Text** | Use short, simple words. Avoid technical jargon. Every label should be ≤ 3 words. |
| **Visual-First Design** | Large icons and images for every action. A farmer should understand what a button does by looking at the icon, even if they can't read the label. |
| **Big Touch Targets** | All buttons minimum 48×48px. Form inputs minimum 56px height. Easy to tap on small touchscreens with rough hands. |
| **Step-by-Step Flows** | Never show a long form. Break every task (registration, product listing, purchase) into small 1–2 field steps with a progress indicator. |
| **Hindi as First Language** | Default to Hindi for users in Hindi-speaking states. Language toggle prominently placed. All critical labels in both Hindi and English. |
| **Voice & Image Over Text** | Future: voice input for product listing (farmer speaks, system fills form). For now: large photo upload buttons with camera icon. |
| **Confirmation at Every Step** | After every action, show a simple confirmation screen with a green checkmark and Hindi text like "सफल!" (Success!). |
| **Error Messages in Simple Language** | No technical error codes. Show friendly messages like "कुछ गलत हुआ, दोबारा कोशिश करें" (Something went wrong, please try again). |

#### 5.7.2 UI Simplification Requirements

- **Home Page:** Large category cards with photos (e.g., photo of wheat for Cereals). Two big buttons: "बेचना है" (I want to sell) and "खरीदना है" (I want to buy).
- **Sell Flow (3 steps max):**
  1. Step 1: Take/upload photo of product (big camera button)
  2. Step 2: Select category from image grid (not dropdown) → Enter price (big number pad) → Enter quantity
  3. Step 3: Review and confirm (show summary with images)
- **Buy Flow:** Search by image category → Big product photos → Tap to view → Big "संपर्क करें" (Contact Seller) button → Auto-fill WhatsApp/call
- **Marketplace:** Product cards must show: large image, product name in Hindi+English, price in big font, seller location. No complex filters — just category images and a search bar.
- **Dashboard:** Replace KPI numbers with simple visual indicators (green = good, yellow = attention needed, red = action needed). Use emojis/icons instead of chart labels where possible.
- **Forms:** No more than 3–4 fields per screen. Use auto-fill wherever possible (location auto-detected from GPS, category from photo AI in future).
- **Navigation:** Bottom navigation bar on mobile (like WhatsApp) with 4–5 icons: Home, Sell, Buy, Mandi, Profile. No hamburger menus.
- **Pricing Display:** Always show prices in ₹ with big font. Use terms like "किलो" (kg), "क्विंटल" (quintal) — not English units.
- **No Unnecessary Pages:** Remove pages that a farmer doesn't need from the main navigation (privacy policy, about us, etc. accessible only from footer).

#### 5.7.3 Technical Usability

- Mobile-responsive design (TailwindCSS breakpoints), mobile-first approach
- Bilingual support (English/Hindi) with easy language toggle in navbar
- Consistent navigation (Navbar on public pages, Sidebar on dashboard pages)
- Accessible color contrast (emerald/green theme — familiar to farmers)
- Loading states with simple spinner + Hindi text "लोड हो रहा है..." (Loading...)
- OTP input with auto-focus and backspace navigation (large number pad)
- Offline tolerance: show cached data when network is slow (future)
- Low-bandwidth mode: compress images, show text-first on slow connections (future)

---

## 6. Database Design

### 6.1 Design Principles

- **3NF** for all transactional data
- **UUIDs** (`CHAR(36)`) as primary keys for public/business entities (users, products, orders, offers)
- **BIGINT surrogate keys** for internal/join tables and master-detail rows
- **Soft delete** via `deleted_at` + `deleted_by` on every table
- **Audit fields** on every table: `created_by`, `updated_by`, `created_at`, `updated_at`
- **Status master** table instead of hardcoded enums (generic, reusable per entity type)
- **Master-detail design** for addresses, contacts, images, documents, and translations via reusable `entity_*` join tables
- **Foreign keys and indexes** defined inline for referential integrity and query performance
- **utf8mb4** charset for full Unicode support (including Hindi text)
- **InnoDB** engine for transactional integrity

### 6.2 MySQL Schema Modules

| Module | Tables | Description |
|--------|--------|-------------|
| **Master & Audit** | `status_master`, `audit_logs` | Generic status management, change tracking |
| **Location** | `countries`, `states`, `districts`, `cities`, `villages`, `postal_codes`, `geo_locations` | Hierarchical location with GPS coordinates |
| **Common Master-Detail** | `addresses`, `entity_addresses`, `contact_types`, `contacts`, `entity_contacts`, `images`, `entity_images`, `documents`, `entity_documents`, `translations` | Reusable polymorphic master-detail for any entity |
| **Identity** | `users`, `user_profiles`, `user_devices`, `user_sessions`, `user_preferences`, `user_languages`, `user_social_accounts`, `user_verification`, `user_kyc` | Full user identity management |
| **Security / RBAC** | `roles`, `role_hierarchy`, `permissions`, `permission_groups`, `permission_group_permissions`, `role_permissions`, `user_roles`, `user_permissions` | Fine-grained role-based access control |
| **Category** | `categories`, `category_attributes`, `category_attribute_values` | N-level category tree with custom attributes |
| **Product** | `products`, `product_variants`, `product_videos`, `product_prices`, `product_inventory`, `product_attribute_values`, `product_reviews`, `product_views`, `product_favourites`, `product_history`, `units`, `tags` | Full product lifecycle management (planned, normalized classifieds schema — polymorphic `owner_id`/`owner_type`, `category_id`, `status_id`) |
| **Marketplace & Commerce** | `offers`, `offer_history`, `wishlist`, `saved_searches`, `recent_views`, `product_shares`, `orders`, `order_items`, `order_history` | Offers, orders, wishlist, engagement tracking |
| **Buy/Sell Module (IMPLEMENTED)** | `marketplace_products` | Denormalized, fast-ship OLX-style listing table (see §6.2.1) used by the live `/sell` and `/marketplace` pages. Kept as a *separate* table from the planned normalized `products` table above to avoid clashing while both schemas coexist during incremental rollout. |

#### 6.2.1 `marketplace_products` — Implemented Buy/Sell Listings

Backed by `src/marketplace/*` (NestJS module: `MarketplaceModule`, entity `Product`, table `marketplace_products`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(36) PK | UUID, generated server-side before image upload so the folder name and DB row share the same id |
| `seller_id` | CHAR(36) FK → `users.id` | Always set from the verified JWT (`req.user.userId`), never trusted from request body |
| `title` | VARCHAR(255) | Seller may type in their own local language (Hindi/transliterated); category stays a fixed English key |
| `category` / `sub_category` | VARCHAR(64) | Fixed enum: crops, vegetables, fruits, seeds, tools, fertilizers, livestock, dairy, other |
| `price`, `price_unit`, `quantity`, `quantity_unit` | DECIMAL/VARCHAR | Per-unit pricing |
| `location`, `state`, `district`, `mobile`, `email` | VARCHAR | Contact/location for OLX-style direct contact |
| `image_urls` | JSON | Array of `{ full, thumb }` public paths under `/uploads/products/{category}/{productId}/{full\|thumb}/*.jpg` |
| `status` | VARCHAR(32) | Lifecycle: `pending` → `active` → `expired` → (`reactivate`) `active`; or `rejected` |
| `activated_at` / `expires_at` | TIMESTAMP | Set when admin approves (or seller reactivates); `expires_at = activated_at + PRODUCT_ACTIVE_DAYS` (default 15 days) |
| `views` | BIGINT | Incremented on `GET /marketplace/products/:id` |

**Lifecycle rules (implemented):**
1. Seller submits via `POST /marketplace/products` (JWT required, `multipart/form-data`, up to 5 images) → status `pending`, **not** publicly visible yet.
2. Admin reviews via `GET /marketplace/admin/products/pending` and approves (`POST /marketplace/admin/products/:id/activate`) or rejects (`.../reject`). Admin routes are guarded by `AdminGuard` (`x-admin-key` header, env `ADMIN_API_KEY`).
3. Approved listings are `active` and appear in public `GET /marketplace/products` for `PRODUCT_ACTIVE_DAYS` (default 15) days.
4. An hourly cron (`ProductExpiryCron`, `@nestjs/schedule`) flips overdue `active` rows to `expired`.
5. Seller reactivates their own expired-but-still-available listing via `POST /marketplace/products/:id/reactivate` — goes straight back to `active` for another 15-day window (no re-approval needed).
6. `DELETE /marketplace/products/:id` (owner-only) removes the DB row **and** the entire `uploads/products/{category}/{id}/` folder (both full-size and thumbnail images).
7. Buyer search (`GET /marketplace/products?q=...`) matches `title`/`description`/`category` text **and** a local-language synonym dictionary (`product-search.util.ts`) that maps common Hindi/transliterated product names (e.g. "sabzi", "doodh", "beej") to the corresponding fixed category — so a search in the seller's own language still surfaces the right listings.

### 6.3 MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `activity_logs` | Flexible activity/event logging (action, userId, mobile, metadata, timestamp) |

### 6.4 Redis Key Patterns

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `otp:{mobile}` | Store OTP code | 300s (5 min) |
| `otp-verified:{mobile}` | Mark mobile as OTP-verified | 600s (10 min) |
| `captcha:{id}` | Store captcha answer | 300s (5 min) |
| `blacklist:{token}` | Blacklisted JWT on logout | Until JWT expiry |

### 6.5 Seed Data

The `seed.sql` file provides initial data for:
- `status_master` — Active/Inactive statuses for all entity types
- `contact_types` — Mobile, Email, WhatsApp, etc.
- `units` — Kg, Quintal, Ton, Litre, Dozen, Piece, Acre, Hectare
- `countries` — India
- `states` — Major Indian states
- `roles` — Super Admin, Admin, Farmer, Buyer, Service Provider, Guest
- `permissions` — CRUD permissions per resource

---

## 7. API Specification

### 7.1 Base Configuration

- **Swagger API Base URL:** `http://localhost:4000/api`
- **Swagger Documentation:** `http://localhost:4000/api/docs` (Swagger UI)
- **Backend Admin UI:** `http://localhost:4000/admin` (server-side rendered)
- **Authentication:** Bearer token (JWT) in `Authorization` header
- **Content Type:** `application/json`
- **Global Prefix:** `/api` (for Swagger APIs), `/admin` (for admin UI)
- **All operations are API-driven** — both the Next.js frontend and the NestJS admin UI consume the same backend services

### 7.2 Auth Endpoints

| Method | Path | Description | Auth | Request Body |
|--------|------|-------------|------|-------------|
| GET | `/auth/captcha` | Get captcha challenge | No | — |
| POST | `/auth/otp/send` | Send OTP to mobile | No | `{ mobile: string }` |
| POST | `/auth/otp/verify` | Verify OTP | No | `{ mobile: string, otp: string }` |
| POST | `/auth/register` | Register new user | No | `{ name, mobile, email, password, addressLine1, addressLine2?, latitude?, longitude? }` |
| POST | `/auth/login` | Login with mobile + password | No | `{ mobile: string, password: string }` |
| POST | `/auth/guest` | Guest login with mobile + OTP | No | `{ mobile: string, otp: string }` |
| POST | `/auth/logout` | Logout (blacklist JWT) | Yes | — |
| GET | `/auth/me` | Get current user from JWT | Yes | — |

### 7.2.1 Marketplace / Buy-Sell Endpoints (Implemented)

| Method | Path | Description | Auth | Request Body |
|--------|------|-------------|------|---------------|
| POST | `/marketplace/products` | Post a new listing (up to 5 images) | JWT | `multipart/form-data`: title, category, price, priceUnit, ... + `images[]` |
| GET | `/marketplace/products` | Browse active listings (filters: category, q, state, district, page, limit) | No | — |
| GET | `/marketplace/products/categories` | Distinct categories with at least one active listing | No | — |
| GET | `/marketplace/products/:id` | Product detail (increments `views`) | No | — |
| DELETE | `/marketplace/products/:id` | Delete own listing + its image folder | JWT (owner) | — |
| POST | `/marketplace/products/:id/reactivate` | Reactivate own expired listing | JWT (owner) | — |
| GET | `/marketplace/my-products` | List all of the logged-in seller's products (any status) | JWT | — |
| GET | `/marketplace/admin/products/pending` | List listings awaiting approval | Admin key | — |
| POST | `/marketplace/admin/products/:id/activate` | Approve listing → goes live for 15 days | Admin key | — |
| POST | `/marketplace/admin/products/:id/reject` | Reject a pending listing | Admin key | — |

### 7.3 Response Format

**Success (Auth):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "role": "user",
  "user": {
    "id": "uuid",
    "name": "Rajinder Kumar",
    "mobile": "9876543210",
    "email": "rajinder@example.com"
  }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired OTP",
  "error": "Bad Request"
}
```

---

## 8. Frontend Requirements

### 8.1 Page Inventory

| Route | Page | Type | Auth Required |
|-------|------|------|---------------|
| `/` | Home / Landing | Public | No |
| `/login` | Login & Register tabs | Public | No |
| `/register` | Full registration form | Public | No |
| `/verify-otp` | OTP verification | Public | No |
| `/marketplace` | Marketplace with category sidebar | Public | No |
| `/marketplace/[id]` | Product detail | Public | No |
| `/categories` | Category overview grid | Public | No |
| `/mandi` | Mandi rates table | Public | No |
| `/weather` | Weather forecast | Public | No |
| `/schemes` | Government schemes | Public | No |
| `/ai-assistant` | AI chatbot interface | Public | No |
| `/about` | About Us | Public | No |
| `/contact` | Contact form | Public | No |
| `/help` | Help & FAQ | Public | No |
| `/privacy` | Privacy Policy | Public | No |
| `/dashboard` | Dashboard with KPIs & charts | Protected | Yes |
| `/profile` | User profile management | Protected | Yes |
| `/my-products` | Product listing management | Protected | Yes |
| `/my-farm` | Farm plot management | Protected | Yes |
| `/membership` | Membership plans | Protected | Yes |

### 8.2 Shared Components

| Component | Location | Used In |
|-----------|----------|---------|
| `Navbar` | `app/components/Navbar.jsx` | All public pages |
| `Footer` | `app/components/Footer.jsx` | All public pages |
| `Sidebar` | `app/components/Sidebar.jsx` | Dashboard, Profile, My Products, My Farm, Membership |
| `Header` | `app/components/Header.jsx` | Dashboard pages |
| `HeroBanner` | `app/components/HeroBanner.jsx` | Home page |
| `KpiCards` | `app/components/KpiCards.jsx` | Dashboard |
| `ChartsSection` | `app/components/ChartsSection.jsx` | Dashboard |
| `ModuleGrid` | `app/components/ModuleGrid.jsx` | Dashboard |
| `ActivityTimeline` | `app/components/ActivityTimeline.jsx` | Dashboard |
| `ProductLifecycle` | `app/components/ProductLifecycle.jsx` | Dashboard |

### 8.3 Frontend Design System — Farmer-Simple UI

> **Design Philosophy:** The UI must be usable by a farmer with 6th–8th standard education. Every screen should be understandable within 3 seconds by someone who can read basic Hindi or English.

#### 8.3.1 Visual Design Rules

- **Primary Color:** Emerald/Green (`emerald-600`, `emerald-700`, `kisan-*` custom palette) — green is familiar and trustworthy to farmers
- **Accent Color:** Amber (`amber-400`, `amber-500`) — for warnings and highlights
- **Success Color:** Green with checkmark icon — for confirmations
- **Error Color:** Red with simple Hindi message — for errors
- **Background:** Slate-50 (light gray) — easy on eyes in bright outdoor light
- **Cards:** White with `ring-1 ring-gray-100` and `shadow-sm`
- **Rounded corners:** `rounded-2xl` for cards, `rounded-full` for buttons/badges
- **Typography:** System font, **bold headings**, **`text-base` or larger for body** (not `text-sm` — farmers need readable text)
- **Minimum button size:** 48×48px (tailwind: `min-h-[48px] min-w-[48px]`)
- **Minimum input height:** 56px (tailwind: `h-14`)
- **Icons:** lucide-react throughout — **every button must have an icon**, not just text
- **Images:** Large product images, category photos — images communicate more than text for low-literacy users
- **Responsive:** Mobile-first, breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Max width:** `max-w-7xl` for content containers

#### 8.3.2 Navigation Pattern for Farmers

**Public pages (mobile):** Bottom navigation bar with large icons:

| Icon | Label (Hindi) | Label (English) | Route |
|------|-------------|-----------------|-------|
| 🏠 Home | होम | Home | `/` |
| 🛒 Buy | खरीदें | Buy | `/marketplace` |
| 🌾 Sell | बेचें | Sell | `/my-products` (or `/login` if not authenticated) |
| 📈 Mandi | मंडी | Mandi | `/mandi` |
| 👤 Profile | प्रोफाइल | Profile | `/profile` (or `/login` if not authenticated) |

**Dashboard pages (desktop/tablet):** Sidebar with icons + labels (current Sidebar component).

#### 8.3.3 Sell Product Flow (Simplified for Farmers)

```
Step 1: "क्या बेचना है?" (What do you want to sell?)
  → Big camera button to take photo → OR gallery icon to upload
  → Large category image grid (tap a photo of wheat/vegetables/cattle)

Step 2: "कीमत और मात्रा" (Price & Quantity)
  → Big number pad for price (₹)
  → Big number pad for quantity
  → Simple unit selector with icons: किलो (kg) | क्विंटल (quintal) | टन (ton)

Step 3: "जाँच करें" (Review)
  → Show photo + price + quantity in large card
  → Big green "पक्का करें" (Confirm) button
  → Show success screen: ✅ "आपका उत्पाद बेचने के लिए तैयार है!"
```

#### 8.3.4 Buy Product Flow (Simplified for Farmers)

```
Step 1: "क्या खरीदना है?" (What do you want to buy?)
  → Large category image grid OR search bar with voice icon (future)

Step 2: Browse products
  → Large product cards with photo, name (Hindi+English), price, location
  → Simple sort: "सबसे सस्ता" (Cheapest) | "पास के" (Nearest)

Step 3: View product detail
  → Big photos, price, seller name, location
  → Big green "📞 संपर्क करें" (Contact Seller) button → opens call/WhatsApp
  → Big amber "❤️ पसंद" (Save) button → adds to wishlist
```

### 8.4 Frontend Services Data

The marketplace page uses static data files:
- `app/marketplace/categories.js` — N-level category tree (20 top-level categories)
- `app/marketplace/products.js` — Sample product listings with images, prices, locations

**Category Coverage (20 top-level):**
Cereals/Grains, Pulses/Legumes, Vegetables, Fruits, Dry Fruits & Nuts, Oil Seeds, Spices, Plantation Crops, Flowers/Floriculture, Medicinal & Herbal Plants, Livestock, Poultry, Dairy Products, Fisheries & Aquaculture, Beekeeping, Organic Products, Seeds & Planting Materials, Animal Feed & Fodder, Forestry Products, Value Added Farm Products.

---

## 9. Security Requirements

### 9.1 Authentication & Authorization

- JWT-based stateless authentication
- JWT secret stored in environment variable (`JWT_SECRET`)
- JWT expiry configurable (`JWT_EXPIRES_IN`, default: 1 day)
- JWT blacklisted in Redis on logout (key persists until natural expiry)
- JwtAuthGuard checks Redis blacklist on every protected request
- Passport JWT strategy validates token signature and expiry
- Role field in JWT payload (`user` or `guest`)

### 9.2 Password Security

- Passwords hashed with bcrypt (10 salt rounds)
- Password never returned in any API response
- Password minimum length: 6 characters
- Password change requires current password verification

### 9.3 OTP Security

- 6-digit numeric OTP
- TTL: 300 seconds (5 minutes)
- One-time use (deleted after verification)
- Mobile marked as verified for 600 seconds (10 minutes) after OTP verification
- In dev mode, OTP returned in API response (controlled by `OTP_DEV_MODE`)
- In production, OTP sent via SMS gateway (MSG91/Twilio — future integration)

### 9.4 Input Validation

- All API endpoints use DTOs with class-validator decorators
- Joi schema validates all environment variables on application startup
- Frontend forms have HTML5 validation + custom JavaScript validation
- Mobile number pattern: 10 digits (`[0-9]{10}`)
- Email pattern: standard email regex

### 9.5 Data Protection

- Soft deletes (no hard delete on business data)
- Audit trail on all tables (created_by, updated_by, deleted_by)
- `audit_logs` table tracks old/new values for critical changes
- User KYC data stored with verification status
- Privacy policy page describes data handling practices

---

## 10. External Interfaces

### 10.1 SMS Gateway (Future)

- **Purpose:** Send OTP via SMS in production
- **Providers:** MSG91, Twilio (to be integrated)
- **Trigger:** `POST /api/auth/otp/send` when `OTP_DEV_MODE=false`

### 10.2 Email Service (Future)

- **Purpose:** Send thank-you email on registration, notifications
- **Providers:** SendGrid, Amazon SES (to be integrated)
- **Trigger:** Successful user registration

### 10.3 Weather API (Future)

- **Purpose:** Real-time weather data
- **Providers:** OpenWeatherMap, IMD (to be integrated)
- **Current:** Static/demo data on frontend

### 10.4 Mandi Rates API (Future)

- **Purpose:** Real-time mandi prices
- **Providers:** Agmarknet, data.gov.in APIs (to be integrated)
- **Current:** Static/demo data on frontend

### 10.5 Payment Gateway (Future)

- **Purpose:** Membership payments, product purchases
- **Providers:** Razorpay, PayU (to be integrated)

### 10.6 Push Notifications (Future)

- **Purpose:** Price alerts, weather alerts, order updates
- **Technology:** Firebase Cloud Messaging (FCM)
- **Schema:** `user_devices.fcm_token` field already exists

---

## 11. Future Modules

The following modules are planned for future phases, with the database schema designed for extension:

| Module | Description | Key Tables (planned) |
|--------|-------------|---------------------|
| **CRM** | Lead management, customer interactions | `leads`, `lead_activities`, `lead_assignments` |
| **Communication** | Chat, notifications, SMS/email logs | `chat_rooms`, `chat_messages`, `notifications`, `sms_logs`, `email_logs` |
| **Membership** | Plan management, transactions, coupons | `membership_plans`, `memberships`, `membership_transactions`, `coupons` |
| **Professional Services** | Service categories, providers, appointments | `service_categories`, `service_providers`, `appointments` |
| **Government Schemes** | Scheme management, applications | `government_schemes`, `scheme_categories`, `scheme_applications` |
| **AI** | AI agents, prompts, sessions, feedback | `ai_agents`, `ai_prompts`, `ai_sessions`, `ai_feedback` |
| **Content (CMS)** | Blogs, news, banners, CMS pages, FAQ | `blogs`, `news`, `banners`, `cms_pages`, `faq` |
| **Payments** | Payment gateway, transactions, refunds, invoices | `payment_gateway`, `payments`, `refunds`, `transactions`, `invoices` |
| **Reporting & Analytics** | Advanced analytics, reports | Materialized views, reporting tables |
| **Administration** | Admin panel, system configuration | Admin-specific tables and modules |
| **GraphQL** | Alternative API layer | GraphQL resolvers on top of existing services |

---

## 12. Assumptions & Dependencies

### 12.1 Assumptions

- Users have a valid Indian mobile number (10 digits)
- Primary target audience is Indian farmers with smartphone access
- Internet connectivity is available (2G or better)
- English and Hindi are the initial supported languages (22 languages planned)
- Mandi rates and weather data are initially static/demo (real APIs to be integrated)
- AI assistant is initially a demo (full NLP integration is future scope)
- Payment integration is not required for Phase 1

### 12.2 Dependencies

- **MySQL 8.x** must be installed and running
- **Redis 7.x** must be installed and running
- **MongoDB 8.x** is optional (toggleable via `MONGO_ENABLED` environment variable)
- **Node.js 20+** required for both frontend and backend
- **npm** package manager for dependency installation
- **TypeORM** synchronizes schema in dev mode; migrations required for production

### 12.3 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 4000 | Backend server port |
| `MYSQL_HOST` | localhost | MySQL host |
| `MYSQL_PORT` | 3306 | MySQL port |
| `MYSQL_USER` | kisan | MySQL username |
| `MYSQL_PASSWORD` | — | MySQL password |
| `MYSQL_DATABASE` | kisanpatrika | MySQL database name |
| `MONGO_ENABLED` | false | Enable/disable MongoDB |
| `MONGO_URI` | mongodb://localhost:27017/kisanpatrika | MongoDB connection string |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | — | Redis password (empty = no auth) |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | 1d | JWT expiry duration |
| `OTP_DEV_MODE` | true | Return OTP in API response (dev only) |
| `OTP_TTL_SECONDS` | 300 | OTP time-to-live in seconds |

---

*End of SRS Document*
