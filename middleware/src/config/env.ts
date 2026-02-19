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
  DEMO_MODE: z.coerce.boolean().default(true),

  // Supabase (required when DEMO_MODE=true)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Azure AD - App Registration
  AZURE_TENANT_ID: z.string().min(1, 'AZURE_TENANT_ID is required'),
  AZURE_CLIENT_ID: z.string().min(1, 'AZURE_CLIENT_ID is required'),
  AZURE_CLIENT_SECRET: z.string().min(1).optional(),

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

  /**
   * Intentional deployment gate (P1):
   * - DEMO_MODE=true is blocked in production.
   * - DEMO_MODE=false is blocked until JWT/MSAL auth is implemented.
   *
   * This middleware is dev/test-only until real JWT auth is shipped.
   * Do not remove this guard without implementing and validating authMiddleware JWT flow.
   */
  if (data.DEMO_MODE && data.NODE_ENV === 'production') {
    throw new Error('DEMO_MODE=true is not allowed in production. Set DEMO_MODE=false and configure SharePoint.');
  }

  // Validate Supabase config when DEMO_MODE is on
  if (data.DEMO_MODE) {
    if (!data.SUPABASE_URL || !data.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DEMO_MODE=true');
    }
  }

  // DEMO_MODE=false hard-fail — JWT auth not yet implemented
  if (!data.DEMO_MODE) {
    throw new Error('JWT authentication is not yet implemented. Set DEMO_MODE=true for development.');
  }

  // Validate portal token secret in production
  if (data.NODE_ENV === 'production' && data.PORTAL_TOKEN_SECRET.includes('dev-')) {
    throw new Error('PORTAL_TOKEN_SECRET must not contain "dev-" in production. Set a secure random secret.');
  }

  return data;
}

export const env = loadEnv();
export type Env = typeof env;
