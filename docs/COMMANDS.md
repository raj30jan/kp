# Command Reference — Linux, MySQL, MongoDB, Redis

A learning reference of commands actually used while building and operating
KisanPatrika. Grouped by tool, from basic to project-specific.

---

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
