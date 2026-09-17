# KisanPatrika — Architecture Documentation

> Version: 1.0 | Complete architecture document set for the KisanPatrika farmer marketplace platform.

## Document Index

| # | Document | Purpose |
|---|---|---|
| 01 | [As-Is Architecture](01-as-is-architecture.md) | Current-state system: components, data stores, auth, gaps |
| 02 | [To-Be Architecture](02-to-be-architecture.md) | Target cloud architecture and the As-Is→To-Be transformations |
| 03 | [Solution Architecture](03-solution-architecture.md) | Business capabilities → building blocks, principles, key flows |
| 04 | [High-Level Design](04-high-level-design.md) | Layered design, module map, request pipeline, deployment units |
| 05 | [Low-Level Design](05-low-level-design.md) | Classes, DTOs, sequences, Redis keys, error matrix |
| 06 | [API Specification](06-api-specification.md) | REST endpoint catalog, contracts, error codes |
| 07 | [Integration Architecture](07-integration-architecture.md) | Internal patterns + external systems (Nominatim, SMTP, Google, S3, future) |
| 08 | [Data Architecture](08-data-architecture.md) | MySQL schema domains, Redis/Mongo models, flows, indexing, governance |
| 09 | [Security Architecture](09-security-architecture.md) | AuthN/Z, data protection, threat model, endpoint security matrix |
| 10 | [Deployment Architecture](10-deployment-architecture.md) | Environments, prod topology, CI/CD, observability, scaling |
| 11 | [DR Architecture](11-dr-architecture.md) | RPO/RTO, backup plan, DR runbook, drills |
| 12 | [Technical Specification](12-technical-specification.md) | Versions, standards, conventions, performance budgets |
| 13 | [Architecture Decision Records](13-architecture-decision-records.md) | ADR-001…014 with register |
| 14 | [Implementation Roadmap](14-implementation-roadmap.md) | Phased plan: hardening → cloud → resilience → DR → growth |

## Reading Order

- **New team member**: 01 → 03 → 04 → 06
- **Planning a change**: 13 (ADRs) → relevant domain doc → 14 (roadmap)
- **Ops/SRE**: 10 → 11 → 09
- **Auditor/reviewer**: 01 → 02 → 09 → 13

## Related Docs

- `docs/SRS.md` — requirements
- `docs/TECH_STACK.md` — version inventory
- `docs/OPERATIONS.md`, `docs/COMMANDS.md` — run commands

## Maintenance

- Update the relevant doc with each architectural change; record significant decisions as new ADRs (next number).
- Keep As-Is current; revise To-Be only via roadmap review.
