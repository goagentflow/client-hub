/**
 * Shared test data for invite endpoint tests.
 */

const HUB_ID = 'hub-inv-1';
const TENANT_ID = 'tenant-agentflow';

export const INVITE_FIXTURES = {
  HUB_ID,
  TENANT_ID,
  API: `/api/v1/hubs/${HUB_ID}/invites`,

  EMAIL_HUB: {
    id: HUB_ID,
    tenantId: TENANT_ID,
    accessMethod: 'email',
    clientDomain: 'example.com',
    companyName: 'Example Co',
  },

  INVITE_RESULT: {
    id: 'inv-1',
    hubId: HUB_ID,
    email: 'test@example.com',
    accessLevel: 'full_access',
    message: null,
    invitedBy: 'user-staff-1',
    invitedByName: 'Hamish Nicklin',
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },

  ENV_MOCK: {
    NODE_ENV: 'test',
    PORT: 3001,
    AUTH_MODE: 'demo',
    DATA_BACKEND: 'azure_pg',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CORS_ORIGIN: 'http://localhost:5173',
    LOG_LEVEL: 'silent',
    AZURE_TENANT_ID: 'test',
    AZURE_CLIENT_ID: 'test',
    AZURE_JWKS_URI: undefined,
    STAFF_ROLE_NAME: 'Staff',
    PORTAL_TOKEN_SECRET: 'test-portal-secret-must-be-at-least-32-chars-long',
    TRUST_PROXY: false,
    RESEND_API_KEY: 'test-key',
    RESEND_FROM_EMAIL: 'noreply@goagentflow.com',
  },
};
