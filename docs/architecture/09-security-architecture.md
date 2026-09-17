# Security Architecture — KisanPatrika

> Version: 1.0 | Covers identity, authorization, data protection, threat model, and controls.

## 1. Security Posture Summary

| Layer | Current (As-Is) | Target (To-Be) |
|---|---|---|
| Transport | HTTP only | TLS 1.2+ everywhere, HSTS |
| User auth | JWT in `localStorage` | Short-lived access JWT + httpOnly refresh cookie, rotation |
| Admin auth | Cookie session (EJS panel) | Same + MFA for super_admin |
| Passwords | bcrypt (cost 10) | bcrypt (cost ≥12) or argon2 |
| Bot defense | Mandatory captcha on register | Captcha + rate limiting + WAF |
| Input | Global ValidationPipe (whitelist) | Same + output encoding audit |
| CORS | `origin: true` | Explicit origin allowlist |
| Secrets | `.env` on host | Secrets Manager, runtime injection |
| Audit | `audit_logs` + Mongo activity | Same + tamper-evident shipping to SIEM |

## 2. Identity & Authentication

### 2.1 Public users
- **Register**: mandatory server-side captcha (Redis, single-use) → bcrypt hash → email OTP (6-digit, Redis TTL 10 min) → verified account.
- **Login**: email+password → JWT `{ sub, email, role, jti, exp }`.
- **Social**: Google ID-token verified server-side (`google-auth-library`); account linking by verified email.
- **Logout**: jti → Redis blacklist until exp; `JwtStrategy` rejects blacklisted tokens.
- **Target hardening**: refresh-token rotation in `httpOnly; Secure; SameSite=Lax` cookie; access token ≤15 min; reuse-detection revokes session family.

### 2.2 Admin panel (`/admin/*`)
- Separate cookie-session login (`/admin/login`); `AdminSessionGuard` per page; `SuperAdminSessionGuard` for privileged screens.
- Session cookie: `httpOnly`, `Secure` (target), `SameSite=Strict`; idle timeout 30 min.
- Target: TOTP MFA for `super_admin`; login lockout after 5 failures.

## 3. Authorization Model (RBAC)

```
roles (super_admin > admin > user)
permissions → permission_groups
role_permissions (role→perm) · user_roles · user_permissions (overrides)
```

- `RolesGuard`/`@Permissions()` decorator on admin REST endpoints.
- Ownership checks in services (e.g. seller edits only own products; admin override).
- Frontend `AuthGuard` is UX-only — **server always re-authorizes**.

## 4. Data Protection

| State | Control |
|---|---|
| At rest | RDS encryption (target); bcrypt passwords; PII columns documented in Data Architecture §10 |
| In transit | TLS end-to-end (target); internal service calls over private subnet |
| In use | ValidationPipe strips unknown fields; DTOs prevent mass-assignment |
| Secrets | `.env` now → Secrets Manager; no secrets in git; rotation policy 90 days |
| Logs | No passwords/tokens/OTP logged; PII masked |

## 5. Threat Model & Mitigations

| Threat (OWASP) | Vector | Mitigation |
|---|---|---|
| Injection | SQL via inputs | TypeORM parameterized queries; ValidationPipe |
| XSS | Stored product descriptions | React escaping; sanitize rich text if added; CSP headers (target) |
| Broken auth | Token theft via localStorage | Move to httpOnly cookie + rotation; short TTL |
| IDOR | `/products/:id` of other users | Ownership check in service layer |
| Bot registration | Scripted signups | Mandatory captcha + per-IP rate limit (target) |
| Brute force | Login/OTP guessing | Lockout + exponential backoff + OTP attempt cap (target) |
| CSRF | Admin cookie session | SameSite=Strict + CSRF token on admin forms (target) |
| File upload | Malicious files | Mime+size whitelist, sharp re-encode strips payloads, no exec perms on uploads |
| SSRF | `/location/reverse` | Fixed upstream host (Nominatim), no user-supplied URL |
| DoS | Large payloads/imports | 15 MB cap; queue imports; rate limits; WAF |
| Data leak | Verbose errors | Generic error envelope; stack traces only in dev |

## 6. Endpoint Security Matrix

| Surface | Auth | Extra controls |
|---|---|---|
| `POST /auth/register` | none | Captcha required; rate limit (target) |
| `POST /auth/login` | none | Lockout/backoff (target) |
| `GET /marketplace/products*` | none | Read-only |
| `POST /marketplace/products` | JWT | Owner-bound; image validation |
| `/api/v1/admin/*` | JWT + role | RolesGuard; audit-logged |
| `/admin/*` (EJS) | Cookie session | Session guard; CSRF (target); IP allowlist optional |
| `/api/docs` | none | Disable or auth-protect in production |
| `/uploads/*` | none | Read-only static; no directory listing |

## 7. Security Requirements for New Code

1. Every new endpoint: DTO + auth decision documented (public vs JWT vs role).
2. Never trust `req.user` beyond identity — re-check ownership/role in service.
3. No raw SQL string concatenation; QueryBuilder params only.
4. New secrets → env validation schema (`env.validation.ts`) + Secrets Manager entry.
5. PII in logs forbidden; use ids.
6. Dependency scanning in CI (`npm audit`/Snyk) — gate on high/critical.

## 8. Compliance Considerations

- Indian IT Act / DPDP Act 2023: consent at registration, purpose-limited PII, deletion-on-request path (target), breach-notification runbook.
- Data residency: keep primary DB in Indian region (target).
