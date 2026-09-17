import 'dotenv/config' // load .env BEFORE modules are evaluated (MongoModule reads it)
import { NestExpressApplication } from '@nestjs/platform-express'
import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded } from 'express'
import cookieParser = require('cookie-parser')
import { join } from 'path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Allow the Next.js frontend to call these APIs
  app.enableCors({ origin: true, credentials: true })

  // Raise default body-size limits (product image base64/JSON payloads
  // used to hit the 100kb express default -> 413 Payload Too Large).
  // Real image uploads go through multipart/form-data (multer) instead,
  // but keep JSON limits generous for any remaining base64 fields.
  app.use(json({ limit: '15mb' }))
  app.use(urlencoded({ extended: true, limit: '15mb' }))
  app.use(cookieParser())

  // Serve uploaded product images at http://localhost:4000/uploads/...
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })

  // Backend Admin UI (SRS §3.3, Section 2) — server-side rendered with EJS
  app.setBaseViewsDir(join(__dirname, 'admin-ui', 'views'))
  app.setViewEngine('ejs')

  // Global request validation: strips unknown fields, rejects bad payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // All routes prefixed with /api/v1, except the server-rendered
  // Backend Admin UI which lives at /admin/* (SRS §7.1). Note: the
  // AdminUiController's own route paths ('admin/accounts', not
  // 'admin/users') are deliberately chosen to avoid colliding with the
  // existing 'admin/users' REST API (AdminUsersController), which stays
  // under /api/v1 and is consumed by the Next.js frontend.
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'admin', method: RequestMethod.ALL },
      { path: 'admin/login', method: RequestMethod.ALL },
      { path: 'admin/logout', method: RequestMethod.ALL },
      { path: 'admin/accounts', method: RequestMethod.ALL },
      { path: 'admin/accounts/(.*)', method: RequestMethod.ALL },
      { path: 'admin/products', method: RequestMethod.ALL },
      { path: 'admin/products/(.*)', method: RequestMethod.ALL },
      { path: 'admin/complaints', method: RequestMethod.ALL },
      { path: 'admin/complaints/(.*)', method: RequestMethod.ALL },
      { path: 'admin/memberships', method: RequestMethod.ALL },
      { path: 'admin/memberships/(.*)', method: RequestMethod.ALL },
      { path: 'admin/leads', method: RequestMethod.ALL },
      { path: 'admin/leads/(.*)', method: RequestMethod.ALL },
      { path: 'admin/categories', method: RequestMethod.ALL },
      { path: 'admin/categories/(.*)', method: RequestMethod.ALL },
      { path: 'admin/settings', method: RequestMethod.ALL },
    ],
  })

  // Swagger documentation at /api/docs
  const config = new DocumentBuilder()
    .setTitle('KisanPatrika API')
    .setDescription('REST APIs for the KisanPatrika farmer marketplace platform')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Register, login, logout, OTP, captcha, guest access')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)
  // Increase HTTP server timeout for long-running imports (2 hours)
  const server = app.getHttpServer()
  server.setTimeout(7200000)
  server.keepAliveTimeout = 7200000
  server.requestTimeout = 7200000
  console.log(`API running:     http://localhost:${port}/api/v1`)
  console.log(`Swagger docs:    http://localhost:${port}/api/docs`)
}
bootstrap()
