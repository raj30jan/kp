# KisanPatrika — Setup Command Reference

All commands used (or required) to set up the frontend and backend from scratch.
Run from the project root `/home/rajinder/projects/kisanpatrika` unless noted.

---

## 1. Frontend (Next.js)

```bash
# Go to frontend folder
cd frontend

# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Production build + start
npm run build
npm start
```

---

## 2. MySQL — Install & Configure

```bash
# Check if client/server are present
mysql --version
dpkg -l | grep -i mysql
systemctl status mysql

# Install the MySQL server (client alone is not enough)
sudo apt update
sudo apt install -y mysql-server

# Start and enable the service
sudo systemctl start mysql
sudo systemctl enable mysql
systemctl status mysql

# Login as root (Ubuntu uses socket auth — no MySQL password, use sudo)
sudo mysql
```

### Apply schema & seed data

```bash
# Option A: from shell
sudo mysql < backend/database/schema.sql
sudo mysql < backend/database/seed.sql

# Option B: from inside the mysql> prompt
# SOURCE /home/rajinder/projects/kisanpatrika/backend/database/schema.sql;
# SOURCE /home/rajinder/projects/kisanpatrika/backend/database/seed.sql;

# Verify
sudo mysql -e "USE kisanpatrika; SHOW TABLES;"
```

### Create the application user (used by backend .env)

```bash
sudo mysql -e "CREATE USER IF NOT EXISTS 'kisan'@'localhost' IDENTIFIED BY 'Kisan@123';
GRANT ALL PRIVILEGES ON kisanpatrika.* TO 'kisan'@'localhost';
FLUSH PRIVILEGES;"

# Test login with password
mysql -u kisan -p
```

---

## 3. Redis — Install (required for OTP / captcha / logout)

```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server

# Verify — should reply PONG
redis-cli ping
```

---

## 4. MongoDB — Install (activity logs; optional at first)

MongoDB is not in Ubuntu's default repos — use MongoDB's official apt repository.

```bash
# 0. Prerequisite: curl (not installed by default on Ubuntu 26.04)
sudo apt install -y curl

# 1. Import MongoDB's GPG signing key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# 2. Add the official repo (the "noble" 24.04 repo works on newer Ubuntu too)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# 3. Install
sudo apt update
sudo apt install -y mongodb-org

# 4. Start and enable the server
sudo systemctl start mongod
sudo systemctl enable mongod
systemctl status mongod

# 5. Verify — should print { ok: 1 }
mongosh --eval "db.runCommand({ ping: 1 })"

# After MongoDB is running, enable it in the backend:
# edit backend/.env  ->  MONGO_ENABLED=true
```

### Troubleshooting

```bash
# "MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017"
# -> mongod server is not running; start it:
sudo systemctl start mongod

# If mongod fails to start, check the log:
sudo journalctl -u mongod -n 20 --no-pager

# Common fix: data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
sudo systemctl restart mongod
```

---

## 5. Backend (NestJS)

```bash
cd backend

# Create local env file from the template
cp .env.example .env

# Install all dependencies (NestJS, TypeORM, mysql2, ioredis, joi,
# bcrypt, passport-jwt, @nestjs/swagger ...)
npm install

# MongoDB support (already in package.json after this)
npm install @nestjs/mongoose mongoose

# Type-check without emitting files
npx tsc --noEmit

# Start dev server with hot reload
npm run dev
# API:     http://localhost:4000/api/v1
# Swagger: http://localhost:4000/api/docs

# Production build + start
npm run build
npm start
```

---

## 6. Quick verification checklist

```bash
# MySQL up and schema applied
sudo mysql -e "USE kisanpatrika; SHOW TABLES;"

# Redis responding
redis-cli ping

# MongoDB responding (if installed)
mongosh --eval "db.runCommand({ ping: 1 })"

# Backend compiles
cd backend && npx tsc --noEmit

# Backend runs
npm run dev
```

---

## 7. Service ports summary

| Service   | Port  | URL                              |
|-----------|-------|----------------------------------|
| Frontend  | 3000  | http://localhost:3000            |
| Backend   | 4000  | http://localhost:4000/api/v1     |
| Swagger   | 4000  | http://localhost:4000/api/docs   |
| MySQL     | 3306  | localhost                        |
| Redis     | 6379  | localhost                        |
| MongoDB   | 27017 | mongodb://localhost:27017        |
