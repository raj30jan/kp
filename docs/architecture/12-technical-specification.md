# Technical Specification — KisanPatrika

> Version: 1.0 | Normative technical standards, versions, and conventions. See also `docs/TECH_STACK.md`.

## 1. Runtime & Language Versions

| Component | Version | Notes |
|---|---|---|
| Node.js | v22.22.1 | LTS line |
| npm | 9.2.0 | Lockfiles committed |
| TypeScript (backend) | 5.5.x | Strict mode |
| TypeScript (frontend) | 7.0.2 | Pages currently JSX |
| MySQL | 8.4.11 | InnoDB, utf8mb4 |
| Redis | 8.0.5 | — |
| MongoDB | 8.0.4 | Optional via `MONGO_ENABLED` |

## 2. Backend Stack (NestJS 10)

| Package | Version | Purpose |
|---|---|---|
| @nestjs/common, core, platform-express | 10.4.x | Framework |
| @nestjs/config + joi 17.13 | 3.2.x | Env validation (fail-fast) |
| @nestjs/typeorm + typeorm 0.3.20 + mysql2 3.11 | — | MySQL ORM; `synchronize:false` |
| @nestjs/mongoose + mongoose 9.9 | 11.0.x | MongoDB ODM |
| @nestjs/jwt + passport-jwt 4.0 | 10.2.x | JWT auth |
| @nestjs/swagger 7.4 | — | OpenAPI at `/api/docs` |
| @nestjs/schedule 4.1 | — | Cron (product expiry) |
| ioredis 5.4 | — | Redis client |
| bullmq 6.3 | — | Queues (target) |
| bcrypt 5.1 | — | Password hashing |
| multer 2.3 + sharp 0.35 | — | Uploads + image processing |
| nodemailer 10.0 | — | Email |
| class-validator 0.14 + class-transformer 0.5 | — | DTO validation |
| ejs 6.0 | — | Admin SSR |
| xlsx 0.18 | — | Excel import |
| google-auth-library 11 | — | Google sign-in |

## 3. Frontend Stack (Next.js 14)

| Package | Version | Purpose |
|---|---|---|
| next | 14.2.x | App Router, SSR/SSG |
| react / react-dom | 18.3.x | UI |
| tailwindcss 3.4 + postcss + autoprefixer | — | Styling |
| lucide-react 0.400 | — | Icons |
| recharts 2.12 | — | Dashboard charts |

## 4. API Standards

- REST, JSON, `/api/v1` prefix; `/admin/*` excluded (EJS).
- DTO validation mandatory; `whitelist + forbidNonWhitelisted + transform`.
- Pagination `page`/`limit`; error envelope `{ statusCode, message, error }`.
- Swagger annotations required on every controller/DTO.
- Naming: plural nouns (`/products`), kebab-case paths, camelCase fields.

## 5. Database Standards

- Engine InnoDB, charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- PKs: surrogate ids; timestamps `created_at`/`updated_at` on all business tables.
- FKs enforced; deletes restricted or soft (status column).
- All DDL via numbered migrations; `synchronize:false` is non-negotiable.
- Indexes required for every WHERE/JOIN/ORDER-BY column in hot queries (see Data Architecture §8).

## 6. Coding Conventions

| Area | Convention |
|---|---|
| Backend files | `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `dto/*.dto.ts` |
| Frontend | JSX pages under `app/<route>/page.jsx`; shared UI in `app/components/`; API calls only via `lib/api.js` |
| i18n | `text = { en: …, hi: … }` maps per page/component via `LangProvider` |
| Auth (FE) | `kp_token` in localStorage; route whitelist in `lib/auth-guard.js` |
| Errors | NestJS exception classes; FE displays `message` |
| Comments | Explain *why*, not what; section banners for logical blocks |

## 7. Environment Variables (canonical)

| Var | Required | Purpose |
|---|---|---|
| `PORT` | no (4000) | API port |
| `MYSQL_HOST/PORT/USER/PASSWORD/DATABASE` | yes | MySQL |
| `REDIS_HOST/PORT` (or `REDIS_URL`) | yes | Redis |
| `MONGO_URI`, `MONGO_ENABLED` | no | MongoDB |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | yes | Auth |
| `SMTP_HOST/PORT/USER/PASS` | yes | Email |
| `GOOGLE_CLIENT_ID` | no | Social login |
| `NEXT_PUBLIC_API_URL` | yes (FE) | API base URL |

All validated at boot by `env.validation.ts`; missing required vars → process exits.

## 8. Performance Budgets

| Metric | Budget |
|---|---|
| API p95 latency | < 300 ms (reads), < 800 ms (writes) |
| Product list page | < 2 s first load |
| Image upload | ≤ 5 MB/file, ≤ 5 files |
| DB query | < 100 ms p95; no N+1 (use joins/selects) |
| Marquee/landing | No blocking API calls; static-first |

## 9. Browser & Device Support

- Evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 versions).
- Mobile-first responsive (Tailwind breakpoints); primary users on Android Chrome.
- Low-bandwidth consideration: compressed images (sharp/webp), lazy loading.

## 10. Accessibility & i18n

- WCAG 2.1 AA target: contrast, focus states, alt text on images.
- Full EN/HI parity on user-facing strings; Hindi is first-class, not an afterthought.

## 11. Quality Gates

- `npm run lint` clean (both apps).
- `nest build` + `next build` succeed.
- Jest unit tests for new services; supertest for new endpoints (target coverage: services ≥70%).
- Manual smoke: register→OTP→login→list product→admin approve→visible.
