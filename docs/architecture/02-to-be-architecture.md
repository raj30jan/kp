# To-Be Architecture — KisanPatrika

> Version: 1.0 | Horizon: production launch → 12 months

## 1. Vision

Evolve KisanPatrika from a single-host dev build into a **secure, observable, horizontally scalable cloud deployment** — without rewriting the working NestJS/Next.js core. The target keeps the modular monolith (right-sized for current load) while adding the operational layer it lacks: TLS, reverse proxy, managed data services, object storage, CI/CD, monitoring, and DR.

## 2. Target System Context

```
                          ┌─────────────────────────── Cloud (e.g. AWS) ───────────────────────────┐
                          │                                                                        │
   Users (HTTPS) ──▶ DNS ─▶ CDN/WAF (CloudFront or Cloudflare)                                       │
                          │        │                                                               │
                          │        ▼                                                               │
                          │   ┌─────────┐   ┌──────────────────────────────┐                       │
                          │   │  ALB /  │──▶│  Frontend tier               │                       │
                          │   │  Nginx  │   │  Next.js on Vercel/ECS ×N    │                       │
                          │   └────┬────┘   └──────────────────────────────┘                       │
                          │        │                                                               │
                          │        ▼                                                               │
                          │   ┌──────────────────────────────┐    ┌──────────────┐                 │
                          │   │  API tier                    │───▶│  Worker tier │                 │
                          │   │  NestJS ×N (ECS/EC2 ASG)     │    │  BullMQ jobs │                 │
                          │   │  /api/v1  +  /admin (EJS)    │    │  email, ETL  │                 │
                          │   └───────┬──────────┬───────────┘    └──────┬───────┘                 │
                          │           │          │                     │                         │
                          │     ┌─────▼────┐ ┌───▼─────┐ ┌─────────────▼───┐ ┌──────────────┐      │
                          │     │ RDS      │ │ElastiC. │ │ MongoDB Atlas / │ │ S3 + CDN     │      │
                          │     │ MySQL    │ │ Redis   │ │ DocumentDB      │ │ uploads      │      │
                          │     │ Multi-AZ │ │         │ │ activity logs   │ │              │      │
                          │     └──────────┘ └─────────┘ └─────────────────┘ └──────────────┘      │
                          │                                                                        │
                          │   Observability: CloudWatch/Prometheus + Grafana, Sentry, ELK/Loki       │
                          │   Secrets: AWS Secrets Manager / SSM   CI/CD: GitHub Actions             │
                          └────────────────────────────────────────────────────────────────────────┘

   External: Nominatim/Maps API, SMTP/SES, Google OAuth, (future) SMS gateway, payment gateway
```

## 3. Key Transformations (As-Is → To-Be)

| # | Area | From | To |
|---|---|---|---|
| 1 | Hosting | Single dev machine | Cloud VPC: public subnet (LB) + private subnets (app, data) |
| 2 | Frontend | `next dev`/`next start` on :3000 | Vercel or containerized Next.js behind CDN |
| 3 | API | Single NestJS process | ≥2 replicas behind ALB, stateless, autoscaling |
| 4 | Uploads | Local `uploads/` dir | S3 + CDN; presigned uploads; sharp thumbnails async |
| 5 | MySQL | Local 8.4 | RDS MySQL Multi-AZ, automated backups, read replica (later) |
| 6 | Redis | Local | ElastiCache (or Upstash) — OTP, captcha, blacklist, BullMQ queues |
| 7 | MongoDB | Optional local | Atlas/DocumentDB for activity logs & AI sessions |
| 8 | Async work | In-process cron only | BullMQ workers: email, image processing, imports, expiry jobs |
| 9 | Auth | JWT in localStorage | Access token (short TTL) + refresh token in `httpOnly` cookie; rotation |
| 10 | CORS | `origin: true` | Explicit allowlist of frontend origins |
| 11 | TLS | None | End-to-end HTTPS; HSTS; TLS at LB + internal |
| 12 | Secrets | `.env` files | Secrets Manager, injected at runtime |
| 13 | Observability | Console logs | Structured logs → Loki/ELK; metrics → Grafana; traces → OTel; errors → Sentry |
| 14 | CI/CD | Manual | GitHub Actions: lint → test → build → migrate → deploy |
| 15 | DR | None | Backups + cross-region restore runbook (see DR doc) |
| 16 | Rate limiting | None | API gateway/Nginx limits + per-IP throttles on auth endpoints |

## 4. Target Component View

- **Edge**: CDN for static assets & images; WAF rules (OWASP top-10, geo rules optional).
- **Frontend tier**: Next.js SSR/SSG; env-driven API base URL; i18n EN/HI retained.
- **API tier**: NestJS monolith, stateless; health endpoints `/healthz`, `/readyz`; graceful shutdown.
- **Admin panel**: stays EJS in API process short-term; candidate for extraction to the Next.js app or a separate service later (ADR-007).
- **Worker tier**: BullMQ consumers — notifications, image thumbnails, Excel imports, scheduled product-expiry (migrating `@nestjs/schedule` jobs).
- **Data tier**: RDS MySQL (primary), ElastiCache Redis, MongoDB Atlas, S3.

## 5. Target Quality Attributes

| Attribute | Target |
|---|---|
| Availability | 99.9% (Multi-AZ data, ≥2 app replicas) |
| Scalability | Horizontal API/FE scaling; queue-based backpressure |
| Performance | p95 API < 300 ms; CDN-cached images; DB indexes per LLD |
| Security | TLS everywhere, refresh-token rotation, WAF, least-privilege IAM, secrets manager |
| Observability | Dashboards, alerts (error rate, latency, queue depth, DB CPU), audit trail in MongoDB |
| Recoverability | RPO ≤ 15 min (PITR/binlog), RTO ≤ 4 h (see DR doc) |
| Maintainability | Same modular monolith; ADR-governed changes |

## 6. Non-Goals (this horizon)

- Microservices decomposition — deferred; modular monolith is sufficient.
- Multi-region active-active — single region + DR restore only.
- Real-time websockets for chat — polling/notifications first; revisit with AI assistant feature.
