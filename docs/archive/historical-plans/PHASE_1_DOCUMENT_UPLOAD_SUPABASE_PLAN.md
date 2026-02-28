# Phase 1 (MVP): Document Upload + Authenticated Download via Supabase Storage

> **HISTORICAL IMPLEMENTATION PLAN (completed).**
> Document upload/download has been implemented and deployed.
> Use `docs/CURRENT_STATE.md` for live behavior and `docs/PRODUCTION_ROADMAP.md` for what remains.

**Date:** 24 Feb 2026  
**Status:** Complete (implemented + deployed; retained for history)  
**Audience:** Historical reference

---

## Goal

Implement real document file upload/download for the current MVP deployment (Cloud Run + Supabase PostgreSQL) using Supabase Storage.

This unblocks:
- Staff upload in `POST /api/v1/hubs/:hubId/documents` (currently 501)
- Staff authenticated download flow
- Portal authenticated download flow for client-visible docs

This does **not** change the long-term production target (Azure Blob + AV scanning). This is an MVP-fast path.

---

## Why this revision is needed

The original draft had a good direction, but it left several high-risk gaps:

1. Staff download regression risk: only portal UI was rewired, but staff UI also relies on `downloadUrl`.
2. Legacy document breakage: old rows may contain external URLs (not storage paths), so signed-URL-only logic can fail.
3. Contract test drift: `contract.test.ts` still expects `POST /documents` to return 501.
4. OOM risk: 50 MB memory uploads without Cloud Run concurrency cap is unsafe.
5. Insufficient file validation detail: MIME allowlist alone is not enough.
6. Delete cleanup ambiguity: bulk/single delete behavior needed explicit path-handling rules.
7. Unnecessary work item: portal endpoint allowlist change is already covered by current regex.

This plan addresses all of those.

---

## Scope

### In scope

- Document file upload endpoint implementation
- New staff + portal document download endpoints returning signed URLs
- Supabase Storage service wrapper
- Frontend staff + portal download wiring
- Delete cleanup (single + bulk)
- Test coverage and docs updates

### Out of scope

- Proposal upload (`POST /hubs/:hubId/proposal`) remains 501
- Video upload (`POST /hubs/:hubId/videos`) remains 501
- AV quarantine/scanning (deferred to Azure Blob target phase)
- Signed upload URLs / direct-browser uploads

---

## Storage design (MVP)

### Bucket

- Bucket: `hub-documents`
- Access: private
- Max file size: 50 MB

### Stored reference format in DB

Reuse `hub_document.download_url` as a storage reference, but use an explicit scheme:

- Supabase object: `supabase://hub-documents/{tenantId}/{hubId}/{docId}/{safeFileName}`
- Legacy external links remain supported:
  - `https://...` and `http://...` continue to work as passthrough downloads

This avoids a schema migration while preserving backward compatibility.

---

## Security + validation rules

### Allowed MIME types

- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.ms-powerpoint`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `text/csv`
- `text/plain`
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

### Required checks

- Reject missing file
- Reject unknown MIME
- Require valid extension/MIME pairing
- Sanitize filename for object path safety (no path separators, no control chars)
- Enforce max size via Multer limit (50 MB)

### Auth and visibility rules

- Staff download route: any document in hub (tenant + hub scoped)
- Portal download route: only `visibility='client'` and `isProposal=false`

---

## Implementation plan

## Phase 0: Operational prerequisites

1. Create private bucket `hub-documents` in Supabase project `gsucaxeqzluzbmvonsmj`.
2. Add secrets in GCP Secret Manager:
   - `CLIENTHUB_SUPABASE_URL`
   - `CLIENTHUB_SUPABASE_SERVICE_ROLE_KEY`
3. Update Cloud Build deploy step:
   - set both secrets in `availableSecrets`
   - inject into Cloud Run as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
4. Cloud Run upload safety:
   - increase memory to `1Gi`
   - set explicit concurrency cap (recommended `--concurrency 10`)
5. Compliance prerequisite: Supabase DPA signed before go-live.

---

## Phase 1: Middleware storage service

Create `middleware/src/services/storage.service.ts`.

Functions:
- `uploadDocumentObject(input)` -> uploads bytes to bucket path
- `createDownloadUrl(storageRef, expirySeconds)` -> returns signed URL or passthrough URL for legacy links
- `deleteDocumentObject(storageRef)` -> best-effort delete
- `isSupabaseStorageRef(value)` -> type guard

Rules:
- Centralize parsing of `supabase://bucket/path` refs
- Default signed URL expiry: 900 seconds
- Throw typed errors for config missing / unsupported ref format

Config:
- Add to `middleware/src/config/env.ts`:
  - `SUPABASE_URL: z.string().url().optional()`
  - `SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()`
- In service, fail with clear 500 error code `STORAGE_NOT_CONFIGURED` if endpoint invoked without config.

---

## Phase 2: Upload middleware + route

Install:
- `pnpm add multer`
- `pnpm add -D @types/multer`

Create `middleware/src/middleware/upload.ts`:
- `multer.memoryStorage()`
- file size limit: 50 MB
- file filter enforcing MIME allowlist

Update `middleware/src/routes/documents.route.ts`:
- Replace `POST /` 501 with real multipart handler
- Validate `name`, `category`, `visibility`
- Generate `docId` before upload (UUID)
- Build path: `{tenantId}/{hubId}/{docId}/{safeFileName}`
- Upload to Supabase storage
- Insert `hub_document` row with:
  - `id = docId`
  - `downloadUrl = supabase://...`
  - metadata fields populated from request/file/user context
- If DB create fails after storage upload, attempt storage delete rollback
- Return mapped DTO with 201

---

## Phase 3: Download endpoints

### Staff route

Add in `middleware/src/routes/documents.route.ts`:
- `GET /:docId/download`

Behavior:
1. Lookup doc by `id + hubId + isProposal=false`
2. Resolve signed URL via storage service
3. Increment `downloads` counter (`update` fire-and-forget with logging)
4. Return `{ url }`

### Portal route

Add in `middleware/src/routes/portal.route.ts`:
- `GET /documents/:docId/download`

Behavior:
1. Lookup by `id + hubId + visibility='client' + isProposal=false`
2. Resolve signed URL
3. Increment downloads (fire-and-forget)
4. Return `{ url }`

---

## Phase 4: Mapper behavior + backward compatibility

Update `middleware/src/db/document.mapper.ts`:

- `mapDocument()` returns:
  - `downloadUrl: /api/v1/hubs/{hubId}/documents/{id}/download`
- add `mapDocumentForPortal()` returning:
  - `downloadUrl: /api/v1/hubs/{hubId}/portal/documents/{id}/download`

Update `portal.route.ts` to use `mapDocumentForPortal()` for list responses.

Compatibility note:
- Old DB rows with direct external URLs still work because download endpoints must pass through non-`supabase://` URLs unchanged.

---

## Phase 5: Frontend wiring (staff + portal)

Update `src/services/document.service.ts`:
- Add `downloadDocument(hubId, docId, opts?: { portal?: boolean })`
- Non-mock mode:
  - call staff/portal download endpoint
  - read `{ url }`
  - open returned URL in new tab
- Mock mode:
  - fallback to existing `document.downloadUrl`

Update call sites:
- Staff:
  - `src/components/DocumentsSection.tsx`
  - `src/components/documents/DocumentDetailPanel.tsx`
  - any staff action that directly opens `downloadUrl`
- Portal:
  - `src/components/ClientDocumentsSection.tsx`
  - `src/components/client-documents/DocumentPreviewDialog.tsx`

Important:
- No `src/services/api.ts` allowlist change is required.
  - Existing `PORTAL_ENDPOINT_PATTERNS` already matches `/hubs/:hubId/portal/...`

---

## Phase 6: Delete cleanup

Update `middleware/src/routes/documents.route.ts`:

### Single delete
1. Fetch document first to capture storage ref
2. Delete DB row
3. If ref is `supabase://...`, attempt storage delete (non-blocking, logged on error)
4. Return 204 regardless of cleanup outcome

### Bulk delete
1. Fetch matched docs first (for refs)
2. Execute `deleteMany`
3. Best-effort storage delete for captured refs
4. Return `{ updated }`

This preserves current API behavior while reducing orphaned files.

---

## Phase 7: Tests + contract updates

Create `middleware/src/__tests__/document-upload.test.ts`:
- Upload happy path
- Validation failures (missing file/fields, unsupported MIME, size error)
- Staff download happy path + 404
- Portal download visibility enforcement
- Legacy URL passthrough behavior
- Delete cleanup calls storage delete for `supabase://` refs

Update existing tests:
- `contract.test.ts`: remove `POST /hubs/:hubId/documents` from 501 expectations
- Add assertions for new download endpoints status shape

Test strategy:
- Mock storage service; do not hit real Supabase in unit/contract tests

---

## Docs to update in same PR

When implementation lands, update:
- `docs/CURRENT_STATE.md`
- `docs/PRODUCTION_ROADMAP.md`
- `progress/STATUS.md`

Specifically:
- Mark document upload endpoint as real
- Add both download endpoints to endpoint accounting
- Adjust real/placeholder counts (contract + non-contract if applicable)

---

## File list (planned)

### New

- `middleware/src/services/storage.service.ts`
- `middleware/src/middleware/upload.ts`
- `middleware/src/__tests__/document-upload.test.ts`

### Modified

- `middleware/src/config/env.ts`
- `middleware/.env.example`
- `cloudbuild-middleware.yaml`
- `middleware/src/routes/documents.route.ts`
- `middleware/src/routes/portal.route.ts`
- `middleware/src/db/document.mapper.ts`
- `middleware/package.json`
- `src/services/document.service.ts`
- `src/components/DocumentsSection.tsx`
- `src/components/documents/DocumentDetailPanel.tsx`
- `src/components/ClientDocumentsSection.tsx`
- `src/components/client-documents/DocumentPreviewDialog.tsx`
- `middleware/src/__tests__/contract.test.ts`

---

## Deployment checklist

1. Bucket exists and is private
2. Secrets created and mapped in Cloud Build
3. Cloud Run deploy config updated (`1Gi`, explicit concurrency cap)
4. Middleware deployed
5. Frontend deployed
6. Smoke test all upload/download/delete scenarios

---

## Verification checklist

1. `cd middleware && pnpm test`
2. `cd middleware && pnpm typecheck`
3. `cd .. && npm run typecheck`
4. `cd .. && npm run build`
5. Staff upload PDF via UI -> appears in list
6. Staff download from list and detail panel -> file opens
7. Portal client can download client-visible document
8. Portal client cannot download internal document (404/forbidden behavior as designed)
9. Delete document removes DB row and triggers storage cleanup attempt
10. No 501s for staff document upload route

---

## Risks and mitigations

1. Memory pressure during uploads
- Mitigation: 50 MB hard limit + 1Gi memory + concurrency cap.

2. Orphaned storage objects on partial failure
- Mitigation: DB-failure rollback delete on upload, best-effort cleanup on delete, log failures for manual cleanup.

3. Legacy link documents break
- Mitigation: explicit passthrough logic for `http(s)` download refs.

4. Endpoint count/documentation drift
- Mitigation: update CURRENT_STATE/ROADMAP/STATUS in same PR.
