import "dotenv/config";

import {z} from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),

  DATABASE_URL: z.string().startsWith("postgresql://"),
  API_BASE_URL: z.string().default("http://localhost:3333"),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),

  STRIPE_SECRET_KEY: z.string().catch(""),
  STRIPE_WEBHOOK_SECRET: z.string().catch(""),
  STRIPE_INSCRICAO_COUPON_ID: z.string().default("isencao-inscricao"),

  CLOUDINARY_CLOUD_NAME: z.string().catch(""),
  CLOUDINARY_API_KEY: z.string().catch(""),
  CLOUDINARY_API_SECRET: z.string().catch(""),

  SMTP_HOST: z.string().catch(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().catch(""),
  SMTP_PASS: z.string().catch(""),
  SMTP_FROM: z.string().catch(""),

  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
