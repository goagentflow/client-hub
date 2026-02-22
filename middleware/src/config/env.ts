import { z } from 'zod';
import 'dotenv/config';

const authModes = ['azure_ad', 'demo'] as const;
const dataBackends = ['azure_pg', 'mock'] as const;

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => Number(val)),

  // Auth mode: azure_ad = real JWT auth, demo = X-Dev-User-Email header
  AUTH_MODE: z.enum(authModes).default('demo'),

  // Data backend: azure_pg = PostgreSQL via Prisma, mock = in-memory/Supabase mock
  DATA_BACKEND: z.enum(dataBackends).default('mock'),

  // PostgreSQL (required when DATA_BACKEND=azure_pg)
  DATABASE_URL: z.string().min(1).optional(),

  // Azure AD - App Registration
  AZURE_TENANT_ID: z.string().min(1, 'AZURE_TENANT_ID is required'),
  AZURE_CLIENT_ID: z.string().min(1, 'AZURE_CLIENT_ID is required'),
  AZURE_CLIENT_SECRET: z.string().min(1).optional(),

  // Azure AD JWT validation
  AZURE_JWKS_URI: z.string().url().optional(),
  STAFF_ROLE_NAME: z.string().default('Staff'),

  // Portal auth
  PORTAL_TOKEN_SECRET: z.string().min(32).default('dev-portal-secret-change-in-production-min-32-chars'),

  // Proxy trust (only enable behind a reverse proxy)
  TRUST_PROXY: z.coerce.boolean().default(false),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

function loadEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.entries(formatted)
      .filter(([key, value]) => key !== '_errors' && value && '_errors' in value)
      .map(([key, value]) => `  ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${missing}`);
  }

  const data = result.data;

  // Production guard: block demo auth AND mock data in production
  if (data.NODE_ENV === 'production') {
    if (data.AUTH_MODE === 'demo') {
      throw new Error('AUTH_MODE=demo is not allowed in production. Set AUTH_MODE=azure_ad.');
    }
    if (data.DATA_BACKEND === 'mock') {
      throw new Error('DATA_BACKEND=mock is not allowed in production. Set DATA_BACKEND=azure_pg.');
    }
  }

  // Validate mode-specific config
  if (data.DATA_BACKEND === 'azure_pg' && !data.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DATA_BACKEND=azure_pg');
  }

  // Validate portal token secret in production
  if (data.NODE_ENV === 'production' && data.PORTAL_TOKEN_SECRET.includes('dev-')) {
    throw new Error('PORTAL_TOKEN_SECRET must not contain "dev-" in production. Set a secure random secret.');
  }

  return data;
}

export const env = loadEnv();
export type Env = typeof env;
