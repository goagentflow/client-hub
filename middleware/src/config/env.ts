import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => Number(val)),

  // Demo mode — Supabase adapter instead of SharePoint
  DEMO_MODE: z.string().default('true').transform((val) => val.toLowerCase() === 'true'),

  // Supabase (required when DEMO_MODE=true)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Azure AD - App Registration
  AZURE_TENANT_ID: z.string().min(1, 'AZURE_TENANT_ID is required'),
  AZURE_CLIENT_ID: z.string().min(1, 'AZURE_CLIENT_ID is required'),
  AZURE_CLIENT_SECRET: z.string().min(1).optional(),

  // Azure AD JWT validation
  AZURE_JWKS_URI: z.string().url().optional(),
  STAFF_ROLE_NAME: z.string().default('Staff'),

  // SharePoint (optional in demo mode)
  SHAREPOINT_SITE_URL: z.string().url().optional(),

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

  // DEMO_MODE=true is blocked in production (must use real JWT auth)
  if (data.DEMO_MODE && data.NODE_ENV === 'production') {
    throw new Error('DEMO_MODE=true is not allowed in production. Set DEMO_MODE=false and configure SharePoint.');
  }

  // Validate mode-specific config
  if (data.DEMO_MODE) {
    if (!data.SUPABASE_URL || !data.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DEMO_MODE=true');
    }
  } else if (data.NODE_ENV === 'production') {
    // Production: SharePoint is required
    if (!data.SHAREPOINT_SITE_URL) {
      throw new Error('SHAREPOINT_SITE_URL is required when DEMO_MODE=false in production');
    }
  }

  // Validate portal token secret in production
  if (data.NODE_ENV === 'production' && data.PORTAL_TOKEN_SECRET.includes('dev-')) {
    throw new Error('PORTAL_TOKEN_SECRET must not contain "dev-" in production. Set a secure random secret.');
  }

  return data;
}

export const env = loadEnv();
export type Env = typeof env;
