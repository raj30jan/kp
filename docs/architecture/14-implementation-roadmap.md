# Implementation Roadmap — KisanPatrika

> Version: 1.0 | Phased plan from current dev state → production-grade platform. Aligned to ADRs and To-Be architecture.

## Phase 0 — Foundation Hardening (Weeks 1–3)

**Goal**: make the current codebase production-ready in hygiene, no infra change yet.

| # | Item | Ref |
|---|---|---|
| 0.1 | Restrict CORS to explicit frontend origin | Security §1 |
| 0.2 | Add `/healthz` + `/readyz` endpoints | Deployment §8 |
| 0.3 | Structured JSON logging + request correlation id | HLD §7 |
| 0.4 | `schema_migrations` tracking table + migration runner script | ADR-003 |
| 0.5 | Jest unit tests for `AuthService`, `ProductService`; supertest smoke for auth+products | Tech Spec §11 |
| 0.6 | `npm audit` gate in CI; fix high/critical | Security §7 |
| 0.7 | Disable/protect Swagger in prod profile | Security §6 |

**Exit criteria**: CI green (lint+test+build), health endpoints live, CORS locked.

## Phase 1 — Cloud Baseline (Weeks 4–8)

**Goal**: deploy to cloud with managed data services and TLS.

| # | Item | Ref |
|---|---|---|
| 1.1 | Terraform VPC (public/private subnets, 2 AZs), ALB, security groups | Deployment §3 |
| 1.2 | Dockerfiles (FE, API); ECR push; ECS services | Deployment §4 |
| 1.3 | RDS MySQL Multi-AZ + migrate `schema.sql`+seed; ElastiCache Redis; Atlas MongoDB | To-Be §3 |
| 1.4 | Secrets Manager wiring; remove `.env` from hosts | Security §4 |
| 1.5 | TLS via ACM at ALB + CloudFront/Cloudflare CDN + WAF basics | To-Be §2 |
| 1.6 | GitHub Actions pipeline: lint→test→build→migrate→deploy staging→prod | Deployment §5 |
| 1.7 | CloudWatch dashboards + SNS alerts (5xx, p95, DB CPU) | Deployment §8 |

**Exit criteria**: prod URL live over HTTPS; deploys via pipeline; dashboards green.

## Phase 2 — Resilience & Scale (Weeks 9–14)

**Goal**: async processing, durable media, stronger auth.

| # | Item | Ref |
|---|---|---|
| 2.1 | BullMQ worker service; migrate email + product-expiry cron to queues | ADR-009 |
| 2.2 | S3 + presigned uploads; migrate `uploads/`; sharp thumbnails via `image` queue | ADR-010 |
| 2.3 | httpOnly refresh-cookie auth + rotation; FE auth refactor | ADR-008 |
| 2.4 | Rate limiting (auth endpoints, global) + WAF rules | Security §5 |
| 2.5 | Excel import → `import` queue + status polling (drop 2h timeout) | HLD §8 |
| 2.6 | Sentry (FE+BE) + OpenTelemetry traces | Deployment §8 |
| 2.7 | Redis geo-cache for Nominatim; circuit breaker | Integration §3.1 |

**Exit criteria**: uploads on S3/CDN; no in-process long jobs; refresh-token auth live.

## Phase 3 — DR & Operations (Weeks 15–18)

**Goal**: meet RPO ≤15 min / RTO ≤4 h and operational maturity.

| # | Item | Ref |
|---|---|---|
| 3.1 | RDS PITR + cross-region snapshot copies; Atlas backups; S3 CRR | DR §3 |
| 3.2 | DR runbook + quarterly restore test automation | DR §4, §6 |
| 3.3 | Status page + incident comms template | DR §7 |
| 3.4 | Admin MFA (TOTP) + session hardening (SameSite=Strict, CSRF) | Security §2.2 |
| 3.5 | PII masking in logs; DPDP consent + deletion-request path | Security §8 |
| 3.6 | Autoscaling policies (API 2→6, worker on queue depth) | Deployment §9 |

**Exit criteria**: successful timed DR drill; MFA on; autoscaling verified under load test.

## Phase 4 — Growth Features (Weeks 19+)

**Goal**: business expansion on the hardened platform.

| # | Item | Ref |
|---|---|---|
| 4.1 | SMS OTP channel (MSG91/Twilio) via `mail`/`sms` queue | Integration §3.5 |
| 4.2 | Payments (Razorpay/UPI) for membership + featured listings; webhook verification | Integration §3.5 |
| 4.3 | Live mandi prices + weather API integration (cached pulls) | Integration §3.5 |
| 4.4 | AI assistant backend (sessions in MongoDB) | Integration §3.5 |
| 4.5 | Read replica for reporting/analytics queries | Deployment §9 |
| 4.6 | Evaluate admin-panel extraction (ADR-007 triggers) | ADR-007 |

## Dependency Notes

- Phase 2 items 2.1–2.3 depend on Phase 1 infra (Redis/S3/secrets in place).
- DR (Phase 3) requires Phase 1 RDS/Atlas — cannot start earlier.
- Payments (4.2) requires HTTPS + secrets + queue (Phases 1–2) before webhook work.

## Risk Watchlist

| Risk | Phase | Mitigation |
|---|---|---|
| Migration downtime on first RDS cutover | 1 | Staging rehearsal; expand/contract; maintenance window |
| Refresh-cookie refactor breaks FE auth | 2 | Feature-flag rollout; keep bearer fallback one release |
| BullMQ split-brain cron (API + worker both run jobs) | 2 | Cron only in worker entrypoint |
| Cost creep (Multi-AZ + Atlas + CDN) | 1–3 | Right-size; budget alerts; review monthly |
