/**
 * Document upload/download contract tests
 *
 * Verifies:
 * - POST upload creates document with 201
 * - Validation rejects missing file/fields
 * - GET download returns signed URL
 * - Portal download enforces visibility
 * - Delete cleans up storage
 * - Legacy URL passthrough
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { STAFF_HEADERS, CLIENT_HEADERS, loadApp, makePortalToken, portalHeaders, mockRepo, mockAdminRepo, makeMockRepo } from './test-setup.js';

// Mock storage service
const mockUpload = vi.fn().mockResolvedValue('supabase://hub-documents/tenant-agentflow/hub-1/doc-new/test.pdf');
const mockCreateUrl = vi.fn().mockResolvedValue('https://supabase.co/signed-url');
const mockDeleteObj = vi.fn().mockResolvedValue(undefined);
const mockIsRef = vi.fn().mockImplementation((v: string) => v.startsWith('supabase://'));

vi.mock('../services/storage.service.js', () => ({
  uploadDocumentObject: (...args: unknown[]) => mockUpload(...args),
  createDownloadUrl: (...args: unknown[]) => mockCreateUrl(...args),
  deleteDocumentObject: (...args: unknown[]) => mockDeleteObj(...args),
  isSupabaseStorageRef: (...args: unknown[]) => mockIsRef(...args),
}));

// Mock getPrisma + createTenantRepository for portal access
vi.mock('../db/prisma.js', () => ({ getPrisma: () => ({}) }));
const portalRepo = makeMockRepo('tenant-agentflow');
vi.mock('../db/tenant-repository.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return { ...orig, createTenantRepository: () => portalRepo };
});

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

beforeEach(() => {
  mockUpload.mockClear();
  mockCreateUrl.mockClear();
  mockDeleteObj.mockClear();
  mockIsRef.mockClear();
  mockIsRef.mockImplementation((v: string) => v.startsWith('supabase://'));
});

// Helper: stub document
const STUB_DOC = {
  id: 'doc-new',
  hubId: 'hub-1',
  tenantId: 'tenant-agentflow',
  projectId: null,
  name: 'Test Document',
  description: null,
  fileName: 'test.pdf',
  fileSize: 9,
  mimeType: 'application/pdf',
  category: 'reference',
  visibility: 'client',
  uploadedAt: new Date('2024-06-01'),
  uploadedBy: 'user-1',
  uploadedByName: 'Hamish Nicklin',
  downloadUrl: 'supabase://hub-documents/tenant-agentflow/hub-1/doc-new/test.pdf',
  embedUrl: null,
  views: 0,
  downloads: 0,
  isProposal: false,
};

// ── Upload ────────────────────────────────────────────────────

describe('POST /hubs/:hubId/documents (upload)', () => {
  it('returns 201 with valid multipart upload', async () => {
    const hubDoc = mockRepo.hubDocument as { create: ReturnType<typeof vi.fn> };
    hubDoc.create.mockResolvedValueOnce(STUB_DOC);

    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .attach('file', Buffer.from('hello pdf'), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('name', 'Test Document')
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(201);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when no file is provided', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .field('name', 'Test Document')
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .attach('file', Buffer.from('hello'), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported MIME type', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .attach('file', Buffer.from('echo hello'), { filename: 'script.sh', contentType: 'text/x-shellscript' })
      .field('name', 'Script')
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when extension is not allowed (even with allowed MIME)', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .attach('file', Buffer.from('fake pdf'), { filename: 'malware.exe', contentType: 'application/pdf' })
      .field('name', 'Executable disguised as PDF')
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid visibility', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(STAFF_HEADERS)
      .attach('file', Buffer.from('hello pdf'), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('name', 'Invalid visibility')
      .field('category', 'reference')
      .field('visibility', 'public');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-staff users with 403', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/documents')
      .set(CLIENT_HEADERS)
      .attach('file', Buffer.from('hello'), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('name', 'Test Document')
      .field('category', 'reference')
      .field('visibility', 'client');

    expect(res.status).toBe(403);
  });
});

// ── Staff Download ────────────────────────────────────────────

describe('GET /hubs/:hubId/documents/:docId/download', () => {
  it('returns signed URL for existing document', async () => {
    const hubDoc = mockRepo.hubDocument as { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    hubDoc.findFirst.mockResolvedValueOnce({
      id: 'doc-1',
      downloadUrl: 'supabase://hub-documents/tenant-agentflow/hub-1/doc-1/report.pdf',
      downloads: 5,
    });

    const res = await request(app)
      .get('/api/v1/hubs/hub-1/documents/doc-1/download')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url', 'https://supabase.co/signed-url');
    expect(mockCreateUrl).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for non-existent document', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/documents/nonexistent/download')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(404);
  });
});

// ── Portal Download ───────────────────────────────────────────

describe('GET /hubs/:hubId/portal/documents/:docId/download', () => {
  afterEach(() => {
    // Reset adminRepo default so isPublished:true doesn't leak to non-portal tests
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockReset();
    adminHub.findFirst.mockResolvedValue(null);
  });

  it('returns signed URL for client-visible document', async () => {
    // Portal uses adminRepo for hub-access check (isPublished)
    // Set twice — hub-access may fire from both portalRouter and catch-all intelligence routers
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({
      id: 'hub-1', tenantId: 'tenant-agentflow', isPublished: true,
    });

    // After hub-access re-scopes, portalRepo is used for the document query
    const portalDoc = portalRepo.hubDocument as { findFirst: ReturnType<typeof vi.fn> };
    portalDoc.findFirst.mockResolvedValueOnce({
      id: 'doc-1',
      downloadUrl: 'supabase://hub-documents/tenant-agentflow/hub-1/doc-1/report.pdf',
      downloads: 3,
    });

    const token = await makePortalToken('hub-1');
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/documents/doc-1/download')
      .set(portalHeaders(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
  });

  it('returns 404 for internal-only document', async () => {
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({
      id: 'hub-1', tenantId: 'tenant-agentflow', isPublished: true,
    });

    const portalDoc = portalRepo.hubDocument as { findFirst: ReturnType<typeof vi.fn> };
    portalDoc.findFirst.mockResolvedValueOnce(null);

    const token = await makePortalToken('hub-1');
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/documents/doc-internal/download')
      .set(portalHeaders(token));

    expect(res.status).toBe(404);
  });
});

// ── Delete Cleanup ────────────────────────────────────────────

describe('DELETE /hubs/:hubId/documents/:docId (storage cleanup)', () => {
  it('calls deleteDocumentObject for supabase:// refs', async () => {
    const hubDoc = mockRepo.hubDocument as {
      findFirst: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };

    hubDoc.findFirst.mockResolvedValueOnce({
      id: 'doc-1',
      downloadUrl: 'supabase://hub-documents/tenant-agentflow/hub-1/doc-1/report.pdf',
    });

    const res = await request(app)
      .delete('/api/v1/hubs/hub-1/documents/doc-1')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(204);
    // Allow async fire-and-forget to complete
    await new Promise((r) => setTimeout(r, 50));
    expect(mockDeleteObj).toHaveBeenCalledWith(
      'supabase://hub-documents/tenant-agentflow/hub-1/doc-1/report.pdf',
    );
  });

  it('does not call deleteDocumentObject for legacy https:// URLs', async () => {
    const hubDoc = mockRepo.hubDocument as {
      findFirst: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };

    hubDoc.findFirst.mockResolvedValueOnce({
      id: 'doc-2',
      downloadUrl: 'https://example.com/legacy-doc.pdf',
    });

    const res = await request(app)
      .delete('/api/v1/hubs/hub-1/documents/doc-2')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(204);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockDeleteObj).not.toHaveBeenCalled();
  });
});
