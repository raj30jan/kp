# KisanPatrika — Tech Stack & Versions

> Last updated: September 2026

## Runtime

| Component      | Version   |
|----------------|-----------|
| Node.js        | v22.22.1  |
| npm            | 9.2.0     |
| TypeScript (BE) | 5.5.x    |
| TypeScript (FE) | 7.0.2     |

## Backend (NestJS)

| Package                | Version  | Purpose                          |
|------------------------|----------|----------------------------------|
| @nestjs/common         | 10.4.x   | Core framework                   |
| @nestjs/core           | 10.4.x   | Core framework                   |
| @nestjs/config         | 3.2.x    | Env config & validation          |
| @nestjs/swagger        | 7.4.x    | OpenAPI/Swagger docs              |
| @nestjs/typeorm        | 10.0.x   | TypeORM integration               |
| @nestjs/jwt            | 10.2.x   | JWT authentication               |
| @nestjs/passport       | 10.0.x   | Passport strategies              |
| @nestjs/mongoose       | 11.0.x   | MongoDB ODM                      |
| @nestjs/schedule       | 4.1.x    | Cron jobs (product expiry)       |
| @nestjs/platform-express| 10.4.x  | Express adapter                 |
| typeorm                | 0.3.20   | MySQL ORM                        |
| mysql2                 | 3.11.x   | MySQL driver                     |
| mongoose               | 9.9.x    | MongoDB ODM                      |
| ioredis                | 5.4.x    | Redis client (JWT blacklist)     |
| ejs                    | 6.0.x    | Admin UI server-side rendering   |
| class-validator        | 0.14.x   | DTO validation                   |
| class-transformer      | 0.5.x    | DTO transformation               |
| bcrypt                 | 5.1.x    | Password hashing                 |
| passport-jwt           | 4.0.x    | JWT strategy                     |
| multer                 | 2.3.x    | File uploads (product images)    |
| sharp                  | 0.35.x   | Image processing (thumbnails)    |
| nodemailer             | 10.0.x   | Email/OTP delivery               |
| joi                    | 17.13.x  | Env schema validation            |
| uuid                   | 9.0.x    | UUID generation                  |
| cookie-parser          | 1.4.x    | Admin session cookies            |

## Frontend (Next.js)

| Package        | Version | Purpose                        |
|----------------|---------|--------------------------------|
| next           | 14.2.x  | React framework (App Router)   |
| react          | 18.3.x  | UI library                     |
| react-dom      | 18.3.x  | DOM rendering                   |
| tailwindcss    | 3.4.x   | Utility-first CSS               |
| lucide-react   | 0.400.x | Icon set                       |
| recharts       | 2.12.x  | Charts & data visualization     |
| postcss        | 8.4.x   | CSS processing                 |
| autoprefixer   | 10.4.x  | CSS vendor prefixes            |

## Infrastructure

| Service    | Version | Purpose                         |
|------------|---------|---------------------------------|
| MySQL      | 8.4.11  | Primary relational database     |
| Redis      | 8.0.5   | JWT blacklist & caching         |
| MongoDB    | 8.0.4   | Activity logs & data sync       |

## Architecture Summary

- **Backend**: NestJS 10 + TypeORM + MySQL 8 (normalized to 3NF)
- **Admin UI**: Server-rendered EJS templates at `/admin/*`
- **Public UI**: Next.js 14 App Router at `/` (separate frontend)
- **API**: REST at `/api/v1/*` with Swagger docs at `/api/docs`
- **Auth**: JWT + cookie-based admin sessions, role-based guards
- **Real-time**: Redis for token blacklist, MongoDB for activity logging
