# KisanPatrika — Operations & Data-Flow Guide

Linux commands to run, monitor, and verify the platform. Written for
management walkthroughs: each section shows the flow and how to prove that
**every entry lands in MySQL + MongoDB + Redis** (SRS §3.5).

---

## 1. Start the stack

```bash
# Databases (systemd services)
sudo systemctl start mysql redis-server mongod
sudo systemctl status mysql redis-server mongod --no-pager

# Backend API (NestJS) — port 4000
cd ~/projects/kisanpatrika/backend
npm run build
nohup node dist/main.js > /tmp/kisan-backend.log 2>&1 &

# Frontend (Next.js) — port 3000
cd ~/projects/kisanpatrika/frontend
npm run dev          # development
# or: npm run build && npm run start   # production
```

## 2. Health checks

```bash
# Is the API up?
curl -s http://localhost:4000/api/v1/auth/captcha | head -c 200; echo

# Are all three databases reachable?
mysql -u kisan -p'Kisan@123' kisanpatrika -e "SELECT 1"        # MySQL
redis-cli ping                                                # Redis -> PONG
mongosh --quiet --eval "db.runCommand({ping:1})" kisanpatrika # Mongo -> ok:1

# Watch backend logs live
tail -f /tmp/kisan-backend.log
```

## 3. Prove the 3-database write (management demo)

Fire one service-interest entry through the public API:

```bash
curl -s -X POST http://localhost:4000/api/v1/service-interest \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-001","serviceCode":"HIRE_MACHINERY","serviceName":"Hire Machinery","sourcePage":"home"}'
# -> {"id":N,"message":"Service interest recorded"}
```

Then show the SAME entry in all three stores:

```bash
# 1) MySQL — source of truth
mysql -u kisan -p'Kisan@123' kisanpatrika -e \
  "SELECT id, session_id, service_code, contact_status, created_at FROM service_interest_history ORDER BY id DESC LIMIT 3;"

# 2) MongoDB — analytics/audit copy
mongosh --quiet kisanpatrika --eval \
  "db.synced_records.find({entity:'service_interest'}).sort({_id:-1}).limit(3).pretty()"

# 3) Redis — hot cache (snapshot + recent list)
redis-cli GET "record:service_interest:1"
redis-cli LRANGE "recent:service_interest" 0 4
```

## 4. Support-team workflow (service leads)

```bash
# Pending leads for the calling team (needs a JWT from login)
TOKEN=<jwt>
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/v1/service-interest?status=PENDING"

# Mark a lead contacted / guided / closed
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contactStatus":"CONTACTED","notes":"Called farmer, explained listing"}' \
  http://localhost:4000/api/v1/service-interest/1/status
```

## 5. Useful inspection commands

```bash
# MySQL — table sizes / recent rows
mysql -u kisan -p'Kisan@123' kisanpatrika -e "SHOW TABLES;"
mysql -u kisan -p'Kisan@123' kisanpatrika -e \
  "SELECT COUNT(*) users FROM users; SELECT COUNT(*) leads FROM service_interest_history;"

# Mongo — collections and counts
mongosh --quiet kisanpatrika --eval \
  "print('activity_logs:', db.activity_logs.countDocuments()); print('synced_records:', db.synced_records.countDocuments());"

# Redis — all keys, TTL of a record
redis-cli KEYS "*"
redis-cli TTL "record:service_interest:1"

# Processes / ports
ss -tlnp | grep -E ":3000|:4000"
pgrep -af "dist/main|next"
```

## 6. Stop / restart

```bash
pkill -f "dist/main"        # stop backend
pkill -f "next"             # stop frontend
sudo systemctl stop mysql redis-server mongod   # stop databases (rarely needed)
```

---

## Data-flow summary for management

1. User clicks a service on the home page → frontend calls `POST /api/v1/service-interest`.
2. NestJS writes the row to **MySQL** (source of truth).
3. `DataSyncService` mirrors it to **MongoDB** (`synced_records`) and **Redis** (`record:*` + `recent:*`) **in parallel**.
4. Support team queries the lead list (`GET /service-interest?status=PENDING`), calls the user, and updates `contact_status` — the same record stays consistent across all three databases.

This pattern is mandatory for every future module (products, orders, offers, mandi rates, …) so the SaaS platform keeps one consistent, auditable data layer.
