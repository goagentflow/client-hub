# Unified Access Remediation Plan (P0 to P2)

**Date:** 26 February 2026  
**Owner:** Engineering  
**Scope:** Security, compliance, and rollout hardening for unified access implementation

---

## 1. Purpose

This plan addresses critical review findings across the unified access implementation and defines a release-safe remediation sequence.

Goals:

1. Remove security/compliance blockers before release.
2. Align implementation with documented behavior.
3. Add validation and observability to support safe scale.

---

## 2. P0 — Must Fix Before Release

## P0.1 Remove secret/PII leakage in logs

**Issue:** Verification codes are currently logged when email provider config is missing.  
**Risk:** Violates security policy (`never log secrets/personal data`).

**Actions:**

1. Remove OTP/code logging from `sendVerificationCode` fallback.
2. Keep non-sensitive operational logging only.
3. Add regression test/assertion to prevent accidental reintroduction.

**Acceptance criteria:**

1. No logs contain OTP/code values in any environment.
2. Existing email verification tests pass.

---

## P0.2 Harden `/public/access/request-link` input validation

**Issue:** Endpoint currently validates only non-empty email.

**Actions:**

1. Add strict schema validation (`email` format, trim/lowercase, max length).
2. Return consistent 400 response for invalid input.
3. Add security tests for malformed/abusive input.

**Acceptance criteria:**

1. Invalid email payloads return 400.
2. Valid normalized payloads continue to return non-enumerating success.

---

## P0.3 Replace JWT query-token with one-time opaque recovery token

**Issue:** Recovery token in URL currently embeds email identity and is replayable.

**Actions:**

1. Replace signed JWT query token with high-entropy opaque token.
2. Store token hash server-side with expiry and one-time consumption semantics.
3. Add DB migration for `access_recovery_token` storage.
4. Treat reused tokens as expired/used and deny access.
5. In `/my-access`, clear query token from browser URL after capture (`history.replaceState`).

**Acceptance criteria:**

1. Recovery URL token does not contain decodable email/PII.
2. First valid use succeeds; replay fails.
3. Expired/used token path shows expiry UX.

---

## P0.4 Add missing security tests for recovery flow

**Issue:** Coverage exists for happy path but misses key abuse paths.

**Actions:**

1. Add tests for invalid email input.
2. Add tests for rate-limit behavior.
3. Add tests for token replay and malformed tokens.

**Acceptance criteria:**

1. New tests pass in middleware suite.
2. Total middleware suite remains green.

---

## P0.5 Update authoritative docs for shipped behavior

**Issue:** Behavior changed but source-of-truth docs are not updated.

**Actions:**

1. Update `docs/CURRENT_STATE.md` (live capability + test count + endpoints).
2. Update `docs/PRODUCTION_ROADMAP.md` baseline and near-term hardening items.
3. Update `progress/STATUS.md` milestones and quality baseline.
4. Update `docs/README.md` if summary ordering/coverage changed.

**Acceptance criteria:**

1. Docs reflect unified access recovery + staff launcher reality.
2. No stale baseline counts in active docs.

---

## 3. P1 — Next Sprint (Post-Release Hardening)

## P1.1 Align response contract and ranking details with plan

1. Add `recommended.reason` to API payload.
2. Align tie-break implementation exactly with documented rule order.
3. Add focused tests for ranking ties.

## P1.2 Remove environment hardcoding from AFv2 access pages

1. Replace hardcoded API base URL with deploy-time config or same-origin proxy path.
2. Validate staging/prod parity.

## P1.3 Upgrade distributed rate limiting

1. Move from in-memory rate limiter to shared store for multi-instance Cloud Run behavior.
2. Add limiter observability metrics.

---

## 4. P2 — Scale & Assurance

## P2.1 Cross-repo smoke and UAT automation

1. End-to-end checks across `AFv2-temp`, `client-hub`, and `agentflow-insight-pulse`:
   - `/access` split page
   - client recovery request
   - single-hub direct-link behavior
   - expired token UX
   - staff launcher route-out

## P2.2 Security and data-protection assurance

1. Add periodic log scanning for secret/PII leak patterns.
2. Add security test cases to CI gate for public auth/recovery endpoints.

## P2.3 Product integration expansion

1. Extend `my-access` entitlements beyond client-hub where identity source is reliable.
2. Keep product labels and ranking logic consistent with UX guidance.

---

## 5. Execution Order

1. Complete all P0 items in one release branch.
2. Run middleware tests, typechecks, and frontend build checks.
3. Perform manual smoke in browser for `/access`, `/access/client`, `/my-access`, and `/launcher`.
4. Release behind rollback-ready deployment.
5. Start P1 in next sprint.

---

## 6. Release Gate (Go/No-Go)

Release is **No-Go** if any of the following remain true:

1. OTP/code values appear in logs.
2. Recovery tokens are replayable.
3. Recovery token reveals client email/PII.
4. Invalid email input is accepted by request-link endpoint.
5. Authoritative docs are not updated.

Release is **Go** only when all P0 acceptance criteria are met.
