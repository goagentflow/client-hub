/**
 * Azure AD JWT authentication tests
 *
 * Uses scoped _jwksResolver injection — does NOT mock jose globally.
 * Portal auth tests (portal-auth.test.ts) are unaffected.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import request from 'supertest';
import type { Express } from 'express';

// Import shared mocks (supabase, env, logger, pino-http)
import { STAFF_HEADERS } from './test-setup.js';

// Test constants — must match env mock in test-setup.ts
const TEST_TENANT_ID = 'test';
const TEST_CLIENT_ID = 'test';
const ISSUER = `https://login.microsoftonline.com/${TEST_TENANT_ID}/v2.0`;

let app: Express;
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];

beforeAll(async () => {
  // Generate RS256 key pair for test signing
  const keyPair = await generateKeyPair('RS256');
  privateKey = keyPair.privateKey;

  const jwk = await exportJWK(keyPair.publicKey);
  jwk.kid = 'test-key-id';
  jwk.alg = 'RS256';
  jwk.use = 'sig';

  // Inject test JWKS resolver into auth module (scoped, not global mock)
  const { setJwksResolver } = await import('../middleware/auth.js');
  setJwksResolver(createLocalJWKSet({ keys: [jwk] }));

  // Load app after JWKS resolver is set
  const mod = await import('../app.js');
  app = mod.app as unknown as Express;
});

/** Helper: create a signed Azure AD test JWT */
async function makeAzureToken(overrides: Record<string, unknown> = {}): Promise<string> {
  const payload = {
    oid: 'azure-user-1',
    tid: TEST_TENANT_ID,
    preferred_username: 'test@agentflow.com',
    name: 'Test User',
    roles: ['Staff'],
    ...overrides,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
    .setIssuer(ISSUER)
    .setAudience(TEST_CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
}

describe('Azure AD JWT authentication', () => {
  it('valid JWT with Staff role → 200 with staff access', async () => {
    const token = await makeAzureToken();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('azure-user-1');
    expect(res.body.user.role).toBe('staff');
    expect(res.body.user.email).toBe('test@agentflow.com');
    expect(res.body.user.displayName).toBe('Test User');
    expect(res.body.user.tenantId).toBe(TEST_TENANT_ID);
  });

  it('valid JWT without roles → client access (isStaff: false)', async () => {
    const token = await makeAzureToken({ roles: [] });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('client');
  });

  it('valid JWT with api:// audience format → accepted', async () => {
    const token = await new SignJWT({
      oid: 'azure-user-2', tid: TEST_TENANT_ID, roles: ['Staff'],
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(ISSUER)
      .setAudience(`api://${TEST_CLIENT_ID}`)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('azure-user-2');
  });

  it('expired JWT → 401 immediately (no fallthrough to demo auth)', async () => {
    const token = await new SignJWT({ oid: 'user-1', tid: TEST_TENANT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(ISSUER)
      .setAudience(TEST_CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime('-1h')
      .sign(privateKey);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Bearer token present but invalid → 401 immediately, not fallthrough
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('wrong audience → 401 immediately', async () => {
    const token = await new SignJWT({ oid: 'user-1', tid: TEST_TENANT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(ISSUER)
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('wrong issuer → 401 immediately', async () => {
    const token = await new SignJWT({ oid: 'user-1', tid: TEST_TENANT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer('https://login.microsoftonline.com/wrong-tenant/v2.0')
      .setAudience(TEST_CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('missing oid claim → 401 (invalid token claims)', async () => {
    const token = await new SignJWT({ tid: TEST_TENANT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(ISSUER)
      .setAudience(TEST_CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Azure JWT validates but missing oid → handleAzureJwt sends 401 directly
    expect(res.status).toBe(401);
  });

  it('demo header still works when no Bearer token provided', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('staff');
    expect(res.body.user.email).toBe('hamish@goagentflow.com');
  });

  it('staff JWT user has no portalHubId in response', async () => {
    const token = await makeAzureToken();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // No portalHubId in response — staff user
    expect(res.body.user).not.toHaveProperty('portalHubId');
  });
});

describe('GET /auth/me response shape', () => {
  it('returns user profile with expected fields including permissions and domain', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('hubAccess');
    expect(Array.isArray(res.body.hubAccess)).toBe(true);

    const { user } = res.body;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('displayName');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('tenantId');
    expect(user).toHaveProperty('permissions');
    expect(user).toHaveProperty('domain');

    // Staff user permissions
    expect(user.permissions.isAdmin).toBe(true);
    expect(user.permissions.canConvertHubs).toBe(true);
    expect(user.permissions.canViewAllHubs).toBe(true);

    // Domain extracted from email
    expect(user.domain).toBe('goagentflow.com');
  });
});
