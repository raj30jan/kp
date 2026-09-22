# Linux Commands — KisanPatrika Ops Reference

Shell commands used to build, run, inspect and clean up the KisanPatrika
backend (NestJS, port 4000) and frontend (Next.js, port 3000) on Linux.
Run from the repo root unless a `cwd` is noted. See `SQL_COMMANDS.md` for
MySQL / MongoDB / Redis and `COMMANDS.md` for the older combined list.

---

## 1. Build & run

```bash
# Backend — type-check only (fast, no emit)
cd backend && npx tsc --noEmit -p tsconfig.json

# Backend — build then start
cd backend && npm run build && node dist/main.js

# Backend — dev with hot reload
cd backend && npm run start:dev

# Frontend — production build (also lints + type-checks)
cd frontend && npx next build

# Frontend — dev
cd frontend && npm run dev
```

## 2. Ports & processes

```bash
# Who is listening on 4000 / 3000
lsof -i :4000 -sTCP:LISTEN
lsof -i :3000 -sTCP:LISTEN

# Free port 4000 (EADDRINUSE) and confirm
kill $(lsof -t -i:4000) 2>/dev/null; sleep 1; lsof -t -i:4000 || echo "port 4000 free"
fuser -k 4000/tcp                        # alternative

# Running Node processes for this project
ps aux | grep -E "dist/main.js|next" | grep -v grep

# Full restart cycle for the backend
cd backend && npm run build && (kill $(lsof -t -i:4000) 2>/dev/null; sleep 1) && nohup node dist/main.js > /tmp/kp-backend.log 2>&1 &
sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/marketplace/products
```

## 3. Logs

```bash
tail -f /tmp/kp-backend.log                # follow backend log
grep -n "ERROR\|Exception" /tmp/kp-backend.log | tail -30
journalctl -u mysql -n 50 --no-pager       # DB service logs
```

## 4. systemd services (databases)

```bash
sudo systemctl status mysql redis-server mongod
sudo systemctl start  mysql redis-server mongod
sudo systemctl restart redis-server
sudo systemctl enable mysql               # start on boot
```

## 5. Environment files

```bash
cat backend/.env | grep -v "^#" | grep -v "^$"          # effective backend env
grep -n "OTP_DEV_MODE\|LOGIN_OTP_REQUIRED\|NODE_ENV" backend/.env
sed -i '/^gcloud /d' backend/.env                        # remove a stray pasted line
cp backend/.env.example backend/.env                     # fresh env from template
```

Key flags added in this release:

| Var | Default | Notes |
|-----|---------|-------|
| `LOGIN_OTP_REQUIRED` | `true` | Email OTP second step after password login (API + admin) |
| `OTP_DEV_MODE` | `true` (dev) / **forced `false` in production** | Returns OTP in API response for testing |
| `OTP_TTL_SECONDS` | `300` | Login/registration OTP lifetime |
| `PRODUCT_ACTIVE_DAYS` | `15` | Listing live window after approval |

## 6. Uploads — images, videos, QR

```bash
# Tree of one product's uploads (images full/thumb + video)
find backend/uploads/products -maxdepth 4 -type d | head -40

# Largest video files (verify <= 50 MB after compression)
find backend/uploads/products -path "*/video/*" -type f -printf "%s %p\n" | sort -nr | head | awk '{printf "%.1f MB  %s\n", $1/1048576, $2}'

# Any video over the 50 MB cap? (should print nothing)
find backend/uploads/products -path "*/video/*" -type f -size +50M

# Membership QR uploaded by super admin
ls -la backend/uploads/settings/

# Disk usage of uploads
du -sh backend/uploads backend/uploads/products backend/uploads/settings 2>/dev/null

# Remove orphaned product folders older than 30 days (review list first!)
find backend/uploads/products -mindepth 2 -maxdepth 2 -type d -mtime +30
```

## 7. ffmpeg (video compression)

```bash
# Path of the bundled binary used by product-video.util.ts
node -e "console.log(require('ffmpeg-static'))" --prefix backend

# Probe a stored clip (duration / bitrate / resolution)
$(cd backend && node -p "require('ffmpeg-static')") -i backend/uploads/products/<cat>/<id>/video/<file>.mp4 -hide_banner 2>&1 | grep -E "Duration|Stream"

# Manually re-compress a clip to ~45 MB (example for a 60 s clip)
ffmpeg -y -i in.mp4 -vf "scale='min(1280,iw)':-2" -r 30 -c:v libx264 -preset veryfast -b:v 5900k -c:a aac -b:a 96k -movflags +faststart out.mp4
```

## 8. API smoke tests (curl)

```bash
API=http://localhost:4000/api/v1

# Units master used by the sell form
curl -s $API/marketplace/products/units | head -c 400

# Public payment info (UPI + QR) for /membership
curl -s $API/membership/payment-info

# Step 1 login → expect { otpRequired, challengeId, devOtp? }
curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"9999999999","password":"Password@123"}'

# Step 2 verify OTP
curl -s -X POST $API/auth/login/verify-otp -H 'Content-Type: application/json' \
  -d '{"challengeId":"<id>","otp":"123456"}'

# Post a listing with images + video (mobile mandatory)
curl -s -X POST $API/marketplace/products -H "Authorization: Bearer $TOKEN" \
  -F title="Wheat 20 quintal" -F category=crops -F price=2200 -F priceUnit=per_quintal \
  -F quantity=20 -F quantityUnit=quintal -F mobile=9999999999 -F state=Punjab \
  -F images=@/path/a.jpg -F video=@/path/clip.mp4

# Public detail must NOT contain mobile/email
curl -s $API/marketplace/products/<id> | grep -c '"mobile"'   # expect 0

# Contact reveal (403 MEMBERSHIP_REQUIRED without paid access)
curl -s -X POST $API/marketplace/products/<id>/contact -H "Authorization: Bearer $TOKEN"
```

## 9. Git hygiene

```bash
git status --short --untracked-files=all
git diff --stat
git add -A && git commit -m "feat: land sales, video upload, email-OTP login, UPI membership, bilingual pages"
```
