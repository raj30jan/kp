import * as Joi from 'joi'

/**
 * Joi schema that validates every .env variable at application startup.
 * If a required variable is missing or invalid, NestJS refuses to boot
 * with a clear error message — this prevents silent misconfiguration.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),

  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().default(3306),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().allow('').required(),
  MYSQL_DATABASE: Joi.string().required(),

  MONGO_ENABLED: Joi.boolean().default(false),
  MONGO_URI: Joi.string().default('mongodb://localhost:27017/kisanpatrika'),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Returns OTPs in API responses for local testing. Hard-disabled in
  // production so a missing/forgotten env var can never leak login codes.
  OTP_DEV_MODE: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    then: Joi.valid(false).default(false),
    otherwise: Joi.boolean().default(true),
  }),
  OTP_TTL_SECONDS: Joi.number().default(300),
  // Second-factor email OTP after password login (API + admin panel). Default ON.
  LOGIN_OTP_REQUIRED: Joi.boolean().default(true),

  ADMIN_API_KEY: Joi.string().optional(),
  PRODUCT_ACTIVE_DAYS: Joi.number().default(15),

  // data.gov.in AGMARKNET mandi prices (optional — /mandi returns 503 if unset)
  MANDI_API_KEY: Joi.string().optional(),
  MANDI_RESOURCE_ID: Joi.string().optional(),
})
