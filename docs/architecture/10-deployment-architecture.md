# Deployment Architecture — KisanPatrika

> Version: 1.0 | Covers environments, topology, CI/CD, and release process.

## 1. Environments

| Env | Purpose | Infra | Data |
|---|---|---|---|
| **Local** | Dev machines | `next dev` :3000, `nest start --watch` :4000, local MySQL/Redis/Mongo | Seed data |
| **Staging** | Pre-prod validation | Mirrors prod at small scale | Anonymized prod snapshot |
| **Production** | Live | Multi-AZ (see §3) | Real data |

Config via env vars validated by Joi (`env.validation.ts`); each env has its own secret set.

## 2. Current (Dev) Topology

```
localhost:3000  Next.js dev server
localhost:4000  NestJS (API /api/v1 + EJS /admin + /uploads + Swagger /api/docs)
localhost:3306  MySQL 8.4        localhost:6379  Redis 8.0
localhost:27017 MongoDB 8.0 (optional)
```

## 3. Target Production Topology

```
                        ┌─────────────── AWS Region (ap-south-1, Mumbai) ───────────────┐
                        │                                                               │
  Route53 ──▶ CloudFront/Cloudflare (CDN + WAF + TLS termination edge)                    │
                        │        │                                                      │
                        │        ▼                                                      │
                        │  ┌─────────────┐    Public subnets (2 AZs)                    │
                        │  │     ALB     │───────────────┐                              │
                        │  └──────┬──────┘               │                              │
                        │         │        Private subnets (2 AZs)                      │
                        │   ┌─────▼──────────────────────▼─────┐                        │
                        │   │  ECS/EC2 ASG                     │                        │
                        │   │  ┌──────────┐  ┌──────────┐      │                        │
                        │   │  │ Next.js  │  │ NestJS   │ ×2+  │  (+ worker service)    │
                        │   │  │ frontend │  │ API      │      │                        │
                        │   │  └──────────┘  └──────────┘      │                        │
                        │   └────┬───────────┬──────────┬──────┘                        │
                        │        │           │          │                               │
                        │  ┌─────▼─────┐ ┌───▼──────┐ ┌─▼────────────┐  ┌───────────┐   │
                        │  │ RDS MySQL │ │ElastiCache│ │ MongoDB     │  │ S3 bucket │   │
                        │  │ Multi-AZ  │ │ Redis    │ │ Atlas M10+  │  │ + CDN     │   │
                        │  └───────────┘ └──────────┘ └─────────────┘  └───────────┘   │
                        │                                                               │
                        │  VPC endpoints · NAT GW · Secrets Manager · CloudWatch        │
                        └───────────────────────────────────────────────────────────────┘
```

- **Frontend alternative**: Vercel/Netlify for Next.js (simpler); API stays on ECS.
- **Admin panel**: served by API service at `/admin/*`; restrict via WAF IP allowlist or VPN (optional).

## 4. Containerization (target)

| Image | Base | Entrypoint |
|---|---|---|
| `kisanpatrika-frontend` | `node:22-alpine` | `next start` (standalone build) |
| `kisanpatrika-api` | `node:22-alpine` | `node dist/main.js` |
| `kisanpatrika-worker` | same as api | `node dist/worker.js` (BullMQ consumers) |

Multi-stage Dockerfiles; non-root user; healthcheck `GET /healthz`.

## 5. CI/CD Pipeline (GitHub Actions, target)

```
push/PR → lint (eslint, next lint)
        → unit tests (jest)
        → build (nest build, next build)
        → docker build + scan (trivy)
        → push to ECR
        → deploy to staging (ECS service update)
        → run DB migrations (numbered SQL, idempotent)
        → smoke tests (/healthz, key API)
        → manual approval → deploy to prod (rolling, 1-at-a-time)
        → post-deploy verify + auto-rollback on health-check failure
```

## 6. Database Migration Process

1. Migrations live in `backend/database/migrations/NNN_*.sql`, applied in order.
2. CI step runs pending migrations against target DB before app deploy (backward-compatible changes only — expand/contract pattern).
3. Rollback: each migration ships a `down` section or companion rollback script.
4. `synchronize: false` enforced — TypeORM never alters schema at runtime.

## 7. Configuration Management

| Var group | Examples | Source |
|---|---|---|
| DB | `MYSQL_HOST/PORT/USER/PASSWORD/DATABASE` | Secrets Manager |
| Redis/Mongo | `REDIS_URL`, `MONGO_URI`, `MONGO_ENABLED` | Secrets Manager |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN` | Secrets Manager |
| SMTP | `SMTP_HOST/USER/PASS` | Secrets Manager |
| OAuth | `GOOGLE_CLIENT_ID` | Secrets Manager |
| Frontend | `NEXT_PUBLIC_API_URL` | Build-time env |
| Feature flags | `MONGO_ENABLED`, rate limits | Env / config service |

## 8. Observability Stack (target)

| Signal | Tool | Notes |
|---|---|---|
| Metrics | CloudWatch / Prometheus + Grafana | API latency, error rate, DB CPU, queue depth |
| Logs | Structured JSON → Loki/CloudWatch | Correlation ID per request |
| Traces | OpenTelemetry → Tempo/X-Ray | FE→API→DB spans |
| Errors | Sentry (FE + BE) | Release-tagged |
| Uptime | Healthchecks + external probe | `/healthz`, `/readyz` |
| Alerts | PagerDuty/SNS | p95>1s, 5xx>1%, DB>80%, queue backlog |

## 9. Scaling Plan

| Tier | Trigger | Action |
|---|---|---|
| Frontend | CPU>60% / RPS | Add replica (or Vercel auto) |
| API | CPU>60% / p95 latency | ASG scale-out 2→6 |
| Worker | Queue depth > threshold | Scale consumers |
| MySQL | Read pressure | Read replica; vertical resize |
| Redis | Memory >70% | Larger node / cluster mode |

## 10. Release & Rollback

- **Versioning**: semver tags; API versioned `/api/v1`.
- **Deploy**: rolling; keep ≥1 healthy task; drain connections (graceful shutdown).
- **Rollback**: previous task definition redeploy; DB rollback script if migration ran (expand/contract minimizes need).
- **Zero-downtime rule**: schema changes must be backward compatible with the previous app version.
