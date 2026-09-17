# Disaster Recovery (DR) Architecture — KisanPatrika

> Version: 1.0 | Strategy: **Backup & Restore** (single region, cross-AZ) evolving to **Pilot Light**.

## 1. Objectives

| Metric | Target | Rationale |
|---|---|---|
| **RPO** (max data loss) | ≤ 15 min | MySQL binlog/PITR + frequent snapshots |
| **RTO** (max downtime) | ≤ 4 h | IaC rebuild + restore runbook |
| **Availability** | 99.9% | Multi-AZ data tier, ≥2 app replicas |

## 2. Failure Scenarios & Response

| Scenario | Detection | Response | Data loss |
|---|---|---|---|
| Single app instance dies | Health check | ASG replaces; LB reroutes | None |
| AZ failure | AWS health | Multi-AZ failover (RDS/Redis auto) | None |
| DB corruption / bad deploy | Alerts, reports | PITR restore to new instance, repoint | ≤ 5 min |
| Region failure | External probe | Full DR restore in secondary region | ≤ 15 min |
| Accidental data deletion | Audit/complaint | PITR or table-level restore from snapshot | ≤ snapshot interval |
| Redis loss | Health check | Rebuild node; OTPs/captcha re-issued; blacklist rebuilt on next login | Ephemeral only — acceptable |
| S3 loss | — | Versioning + cross-region replication | None |

## 3. Backup Plan

| Store | Method | Frequency | Retention | Location |
|---|---|---|---|---|
| MySQL (RDS) | Automated snapshots + binlog PITR | Daily snap; continuous binlog | 35 days PITR, 90 days snaps | Cross-region copy weekly |
| MongoDB (Atlas) | Cloud backups | Daily + continuous | 30 days | Cross-region |
| Redis | No backup needed (ephemeral) | — | — | — |
| S3 uploads | Versioning + CRR | Continuous | Indefinite | Replica region |
| Schema/migrations | In git | Per change | Forever | GitHub |
| Secrets | Secrets Manager replication | Continuous | — | Replica region |

## 4. DR Runbook (Region Loss)

```
1. DECLARE: incident commander confirms region outage >30 min.
2. DNS: repoint Route53 (health-check failover or manual) to DR region.
3. DATA:
   a. Promote/create RDS instance from latest cross-region snapshot + binlog replay (PITR).
   b. Restore MongoDB Atlas cluster in DR region.
   c. S3 replica bucket already current (CRR).
   d. Recreate ElastiCache (empty — ephemeral).
4. APP: deploy last-known-good images via IaC (Terraform) + ECS services (FE, API, worker).
5. CONFIG: inject replicated secrets; set env endpoints to DR resources.
6. VERIFY: /healthz, login flow, product list, image load, admin panel.
7. COMMUNICATE: status page update; ETA notices.
8. FAILBACK (when primary returns): reverse-replicate deltas, scheduled cutover.
```

## 5. DR Tiers by Component

| Component | DR approach | Notes |
|---|---|---|
| Frontend | Rebuild from image/IaC | Stateless; Vercel alt = instant |
| API + workers | Rebuild from image/IaC | Stateless |
| MySQL | Snapshot + PITR restore | Longest pole — drives RTO |
| MongoDB | Atlas restore | Parallel with MySQL |
| Redis | Recreate empty | Users re-verify OTP if mid-flow |
| Uploads | S3 CRR | Already replicated |
| Admin panel | With API | Same restore |

## 6. Testing & Drills

| Activity | Frequency | Owner |
|---|---|---|
| Restore test (snapshot → staging, verify data) | Quarterly | Backend lead |
| Full DR drill (runbook execution, timed) | Half-yearly | Team |
| Backup integrity check (automated restore job) | Monthly | CI |
| Runbook review/update | After each drill or major change | Architect |

## 7. Current Gaps → Actions

- **No backups configured** (local dev) → enable RDS automated backups at first cloud deploy.
- **No IaC** → Terraform the target topology so DR rebuild is scripted, not manual.
- **No secondary region** → start with cross-region snapshot copies (cheap), graduate to pilot light.
- **No status page** → add simple status endpoint + comms template.
