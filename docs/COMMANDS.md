# Command Reference — Linux, MySQL, MongoDB, Redis

A learning reference of commands actually used while building and operating
KisanPatrika. Grouped by tool, from basic to project-specific.


kill $(lsof -t -i:4000) 2>/dev/null; sleep 1; lsof -t -i:4000 || echo "port 4000 free"

node dist/main.js


----
# Delete all categories

cd /home/rajinder/projects/kisanpatrika/backend && node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('DELETE FROM categories');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('All categories deleted');
  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });
"


---


# create mysql users 

cd /home/rajinder/projects/kisanpatrika/backend && node -e "
const bcrypt = require('bcryptjs');
const hash1 = bcrypt.hashSync('Password@123', 10);
const hash2 = bcrypt.hashSync('Password@123', 10);
console.log(hash1);
console.log(hash2);
" 2>&1


#### check opening ports of backend 

lsof -i :4000 -sTCP:LISTEN 2>/dev/null || fuser 4000/tcp 2>/dev/null; ps aux | grep "dist/main.js" | grep -v grep




## 1. Linux (bash)

### 1.1 Navigation & files
```bash
pwd                          # print working directory
ls -la                       # list all files, long format
cd <dir>                     # change directory
mkdir -p a/b/c                # create nested directories
rm -f file.txt                # force-delete a file
rm -rf dir/                   # recursively delete a directory (careful!)
mv old.txt new.txt            # rename/move
cp -r src/ dest/               # copy recursively
find . -name "*.ts"            # find files by name pattern
```

### 1.2 Viewing & editing file content
```bash
cat file.txt                  # print whole file
head -n 50 file.txt            # first 50 lines
tail -n 50 file.txt            # last 50 lines
tail -f /tmp/app.log            # follow a log file live
grep -rn "TODO" src/            # recursive search with line numbers
wc -l file.txt                 # count lines
```

### 1.3 Processes & ports
```bash
ps aux | grep node             # list node processes
pgrep -af "dist/main|next"      # find backend/frontend process by name
kill -9 <PID>                   # force kill a process
pkill -f "dist/main"            # kill by matching command line
ss -tlnp | grep -E ":3000|:4000" # what's listening on ports 3000/4000
top                             # live CPU/memory usage
df -h                           # disk space
du -sh */                       # size of each folder
```

### 1.4 systemd services (databases)
```bash
sudo systemctl start mysql redis-server mongod
sudo systemctl stop mysql redis-server mongod
sudo systemctl restart mysql
sudo systemctl status mysql redis-server mongod --no-pager
sudo journalctl -u mysql -n 100 --no-pager   # last 100 log lines for a service
```

### 1.5 Running the app
```bash
# Backend (NestJS)
cd backend
npm install
npm run build
nohup node dist/main.js > /tmp/kisan-backend.log 2>&1 &   # run in background
npm run dev                                                # dev with hot-reload

# Frontend (Next.js)
cd frontend
npm install
npm run dev            # development server, port 3000
npm run build && npm run start   # production build + serve
```

### 1.6 Permissions & environment
```bash
chmod +x script.sh             # make a file executable
env | grep MYSQL                # show matching environment variables
export NODE_ENV=production      # set an env var for the current shell
```

---

## 2. MySQL

### 2.1 Connect
```bash
mysql -u kisan -p'Kisan@123' kisanpatrika     # connect directly to the DB
mysql -u kisan -p                              # connect, then USE kisanpatrika;
```

### 2.2 Explore schema
```sql
SHOW DATABASES;
USE kisanpatrika;
SHOW TABLES;
DESCRIBE marketplace_products;         -- column list, types, keys
SHOW CREATE TABLE marketplace_products\G  -- full DDL incl. indexes/FKs
SHOW INDEX FROM marketplace_products;
```

### 2.3 Query data
```sql
SELECT COUNT(*) FROM marketplace_products;
SELECT id, title, status, expires_at FROM marketplace_products ORDER BY created_at DESC LIMIT 10;
SELECT * FROM marketplace_products WHERE status = 'pending';
SELECT * FROM marketplace_products WHERE seller_id = '<uuid>';
```

### 2.4 Modify data / schema
```sql
-- Run the full schema (idempotent CREATE TABLE IF NOT EXISTS statements)
SOURCE /home/rajinder/projects/kisanpatrika/backend/database/schema.sql;

-- Manually approve a listing (what the admin API does internally)
UPDATE marketplace_products
SET status = 'active', activated_at = NOW(), expires_at = NOW() + INTERVAL 15 DAY
WHERE id = '<uuid>';

-- Add a column later (example)
ALTER TABLE marketplace_products ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0;
```

### 2.5 From the shell (no interactive prompt)
```bash
mysql -u kisan -p'Kisan@123' kisanpatrika -e "SELECT COUNT(*) FROM marketplace_products;"
mysql -u kisan -p'Kisan@123' kisanpatrika < backend/database/schema.sql   # apply schema file
mysqldump -u kisan -p'Kisan@123' kisanpatrika > backup.sql                # backup
mysql -u kisan -p'Kisan@123' kisanpatrika < backup.sql                    # restore
```

---

## 3. MongoDB

### 3.1 Connect
```bash
mongosh                                   # connect to default localhost:27017
mongosh "mongodb://localhost:27017/kisanpatrika"
```

### 3.2 Explore
```js
show dbs
use kisanpatrika
show collections
db.synced_records.countDocuments()
db.synced_records.find().sort({ _id: -1 }).limit(5).pretty()
db.synced_records.find({ entity: 'product' }).sort({ _id: -1 }).limit(3).pretty()
```

### 3.3 One-liners from the shell
```bash
mongosh --quiet --eval "db.runCommand({ping:1})" kisanpatrika
mongosh --quiet kisanpatrika --eval "print('synced_records:', db.synced_records.countDocuments())"
```

### 3.4 Query / write
```js
db.synced_records.find({ entity: 'product', refId: '<uuid>' })
db.synced_records.deleteMany({ entity: 'product', refId: '<uuid>' })  // manual cleanup if needed
```

---

## 4. Redis

### 4.1 Connect
```bash
redis-cli                       # connect to localhost:6379
redis-cli ping                  # -> PONG if alive
```

### 4.2 Keys & values
```bash
redis-cli KEYS "*"                          # list ALL keys (dev only, slow in prod)
redis-cli KEYS "record:product:*"            # pattern match
redis-cli GET "record:product:<uuid>"        # get a cached snapshot
redis-cli LRANGE "recent:product" 0 9        # last 10 ids in a recent-list
redis-cli TTL "otp:9876543210"               # seconds until a key expires
redis-cli DEL "record:product:<uuid>"        # delete a key
redis-cli FLUSHDB                            # wipe current DB (dev only!)
```

---

## 5. Marketplace module — end-to-end verification

```bash
# 1) Seller posts a product (replace TOKEN with a real JWT from /auth/login)
curl -s -X POST http://localhost:4000/api/v1/marketplace/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Fresh Tomatoes" -F "category=vegetables" \
  -F "price=25" -F "priceUnit=per_kg" \
  -F "images=@/path/to/photo1.jpg" -F "images=@/path/to/photo2.jpg"
# -> { "id": "<uuid>", "status": "pending", "message": "..." }

# 2) Confirm images landed on disk (full + thumb folders)
ls -la backend/uploads/products/vegetables/<uuid>/full
ls -la backend/uploads/products/vegetables/<uuid>/thumb

# 3) Admin approves it (ADMIN_API_KEY from backend/.env)
curl -s -X POST http://localhost:4000/api/v1/marketplace/admin/products/<uuid>/activate \
  -H "x-admin-key: <ADMIN_API_KEY>"

# 4) Now it is publicly visible
curl -s "http://localhost:4000/api/v1/marketplace/products?category=vegetables"

# 5) Verify the MySQL row directly
mysql -u kisan -p'Kisan@123' kisanpatrika -e \
  "SELECT id, status, activated_at, expires_at FROM marketplace_products WHERE id='<uuid>';"

# 6) Owner deletes it later (also removes the uploads/ folder above)
curl -s -X DELETE http://localhost:4000/api/v1/marketplace/products/<uuid> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. KisanPatrika — Project-Specific Commands

### 6.1 Start / restart backend server
```bash
# Kill existing process on port 4000 and start fresh
fuser -k 4000/tcp 2>/dev/null; sleep 2; cd /home/rajinder/projects/kisanpatrika/backend && node dist/main.js

# Build then start
cd /home/rajinder/projects/kisanpatrika/backend && npx nest build && node dist/main.js

# Dev mode with hot-reload
cd /home/rajinder/projects/kisanpatrika/backend && npm run dev
```

### 6.2 Check if server is running
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/admin/login
# 200 = running
```

### 6.3 Kill process on a specific port
```bash
fuser -k 4000/tcp 2>/dev/null       # kill whatever is on port 4000
kill -9 $(lsof -t -i:4000) 2>/dev/null   # alternative
lsof -i:4000                        # check what's using port 4000
```

### 6.4 MySQL — remote database (kpatrika on 34.100.237.141)
```bash
# Connect to remote DB
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika

# Show tables
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "SHOW TABLES;"

# Count categories
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "SELECT COUNT(*) FROM categories;"

# Import schema (replace database name in SQL first)
sed 's/kisanpatrika/kpatrika/g' /home/rajinder/projects/kisanpatrika/backend/database/schema.sql | mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306

# Import seed data
sed 's/kisanpatrika/kpatrika/g' /home/rajinder/projects/kisanpatrika/backend/database/seed.sql | mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306
```

### 6.5 Delete all categories (via Node.js script)
```bash
cd /home/rajinder/projects/kisanpatrika/backend && node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('DELETE FROM categories');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('All categories deleted');
  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });
"
```

### 6.6 Delete all categories (via MySQL CLI)
```bash
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM categories;
SET FOREIGN_KEY_CHECKS = 1;
"
```

### 6.7 Manage uploaded category images
```bash
# List all category images
ls -la /home/rajinder/projects/kisanpatrika/backend/uploads/categories/

# Delete images older than 20 minutes
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -mmin +20 -delete

# Delete images older than 15 minutes
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -mmin +15 -delete

# Delete ALL category images
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -delete

# Count category images
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f | wc -l
```

### 6.8 Build and deploy
```bash
# Build backend
cd /home/rajinder/projects/kisanpatrika/backend && npx nest build

# Trigger Google Cloud Build
gcloud beta builds triggers run --name=kpatrika --branch=main
```

### 6.9 Category admin UI URLs
```
List View:   http://localhost:4000/admin/categories
Tree View:   http://localhost:4000/admin/categories?view=tree
Import:      http://localhost:4000/admin/categories/import
New:         http://localhost:4000/admin/categories/new
Edit:        http://localhost:4000/admin/categories/<id>/edit
View:        http://localhost:4000/admin/categories/<id>/view
```

### 6.10 Admin login credentials
```
URL:     http://localhost:4000/admin/login
Email:   raj30jan@gmail.com
Pass:    Password@123
Role:    admin

Email:   testuser@example.com
Pass:    Password@123
Role:    super_admin
```

### 6.11 Import schema + seed into remote database
```bash
# Full reset: import schema and seed data in one go
sed 's/kisanpatrika/kpatrika/g' /home/rajinder/projects/kisanpatrika/backend/database/schema.sql | mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 && \
sed 's/kisanpatrika/kpatrika/g' /home/rajinder/projects/kisanpatrika/backend/database/seed.sql | mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 && \
echo "Schema + seed imported successfully"
```

### 6.12 Verify database tables and counts
```bash
# Check tables, categories count, users count, status_master count
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "
SELECT COUNT(*) AS categories, 
       (SELECT COUNT(*) FROM users) AS users, 
       (SELECT COUNT(*) FROM status_master) AS status_rows 
FROM categories;"
```

### 6.13 Delete old category images by age (cleanup)
```bash
# Delete images older than N minutes (replace N)
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -mmin +N -delete

# Examples:
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -mmin +20 -delete  # older than 20 min
find /home/rajinder/projects/kisanpatrika/backend/uploads/categories -type f -mmin +15 -delete  # older than 15 min
```

### 6.14 Full server restart cycle (build + kill + start + verify)
```bash
cd /home/rajinder/projects/kisanpatrika/backend && \
npx nest build && \
fuser -k 4000/tcp 2>/dev/null; sleep 2; \
node dist/main.js &
sleep 8; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/admin/login
```

### 6.15 Fix EADDRINUSE (port already in use)
```bash
# Method 1: fuser
fuser -k 4000/tcp 2>/dev/null; sleep 2

# Method 2: lsof + kill
kill -9 $(lsof -t -i:4000) 2>/dev/null; sleep 2

# Method 3: find and kill all node processes on port 4000
for pid in $(lsof -t -i:4000); do kill -9 $pid; done; sleep 2

# Then restart
cd /home/rajinder/projects/kisanpatrika/backend && node dist/main.js
```

### 6.16 MySQL — check if database exists and has tables
```bash
# Check if kpatrika database exists
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='kpatrika';"

# Count tables in kpatrika
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "SELECT COUNT(*) AS table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='kpatrika';"

# List all tables
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "SHOW TABLES;"
```

### 6.17 MySQL — create database (if missing)
```bash
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 -e "CREATE DATABASE IF NOT EXISTS kpatrika;"
```

### 6.18 Check .env MySQL configuration
```bash
grep -E 'MYSQL_|DATABASE' /home/rajinder/projects/kisanpatrika/backend/.env
```

### 6.19 Remove stray lines from .env (e.g. accidentally pasted commands)
```bash
# Remove a specific line (e.g. gcloud command that got into .env)
sed -i '/^gcloud beta builds/d' /home/rajinder/projects/kisanpatrika/backend/.env

# Verify
cat /home/rajinder/projects/kisanpatrika/backend/.env | grep -v '^#' | grep -v '^$'
```

### 6.20 Check server logs / errors
```bash
# Check if node process is running
pgrep -af "dist/main"

# Read terminal output of background node process (replace PID)
read_terminal --process-id <PID> --name node

# Check server response with headers
curl -s -I http://localhost:4000/admin/login
```

### 6.21 AI image generation — Pollinations.ai URL format
```bash
# Generate a single test image via Pollinations.ai (turbo model, 128x128, <100KB)
curl -s -o /tmp/test-icon.jpg "https://image.pollinations.ai/prompt/realistic%20photo%20of%20tomato%2C%20agricultural%20product%2C%20white%20background%2C%20sharp%20focus%2C%20no%20text?width=128&height=128&nologo=true&model=turbo&seed=12345" && \
ls -la /tmp/test-icon.jpg

# Generate with flux model (higher quality, slower)
curl -s -o /tmp/test-icon.png "https://image.pollinations.ai/prompt/realistic%20photo%20of%20potato%2C%20agricultural%20product%2C%20white%20background?width=256&height=256&nologo=true&model=flux&seed=99999" && \
ls -la /tmp/test-icon.png
```

### 6.22 Compress images using sharp (Node.js)
```bash
cd /home/rajinder/projects/kisanpatrika/backend && node -e "
const sharp = require('sharp');
const fs = require('fs');
const input = '/tmp/test-icon.png';
const output = '/tmp/test-icon-compressed.jpg';
sharp(input).resize(128, 128).jpeg({ quality: 80 }).toBuffer().then(buf => {
  fs.writeFileSync(output, buf);
  console.log('Original:', fs.statSync(input).size, 'bytes');
  console.log('Compressed:', buf.length, 'bytes');
}).catch(e => console.error(e.message));
"
```

### 6.23 Bulk update category icons (set NULL for cleanup)
```bash
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "
UPDATE categories SET icon = NULL WHERE icon IS NOT NULL;
SELECT COUNT(*) AS with_icon FROM categories WHERE icon IS NOT NULL;
"
```

### 6.24 Check category hierarchy (parent-child relationships)
```bash
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "
SELECT id, name, slug, parent_id, level, is_leaf, icon 
FROM categories 
ORDER BY level, display_order 
LIMIT 20;
"

# Count categories by level
mysql -u bcx -pbcxpass123 -h 34.100.237.141 -P 3306 kpatrika -e "
SELECT level, COUNT(*) AS count FROM categories GROUP BY level ORDER BY level;
"
```
