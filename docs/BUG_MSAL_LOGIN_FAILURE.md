# Bug Report: MSAL Azure AD Login Not Working

**Date:** 20 Feb 2026
**Severity:** Blocker — prevents real Azure AD authentication testing
**Reporter:** Hamish Nicklin (via Claude Code session)

---

## Summary

Clicking "Sign in with Microsoft" on the login page (`localhost:8080/login`) fails to complete Azure AD authentication. Two approaches were tried — popup and redirect — both fail.

---

## Environment

- **Frontend:** Vite dev server on `http://localhost:8080`
- **Middleware:** Express on `http://localhost:3001` with `DEMO_MODE=false`
- **Browser:** Chrome 144 (macOS)
- **MSAL library:** `@azure/msal-browser` (version in package.json)
- **Frontend .env:**
  ```
  VITE_USE_MOCK_API=false
  VITE_API_BASE_URL=http://localhost:3001
  VITE_AZURE_CLIENT_ID=94870691-5a2b-4f8d-86c4-627199a63de9
  VITE_AZURE_TENANT_ID=81fb6fd6-e413-4b3f-bdd5-2bd9049fd45f
  VITE_AZURE_BACKEND_CLIENT_ID=56966474-7166-4a20-a360-1adcb4c2b3a9
  ```

### Azure AD App Registrations

| App | Client ID | Purpose |
|-----|-----------|---------|
| AgentFlow Frontend | `94870691-5a2b-4f8d-86c4-627199a63de9` | SPA — acquires tokens via MSAL |
| AgentFlow Middleware | `56966474-7166-4a20-a360-1adcb4c2b3a9` | Backend API — validates JWTs |

### Redirect URIs (Frontend app reg)

Both registered as **Single-page application** platform:
- `http://localhost:5173`
- `http://localhost:8080`

---

## Approach 1: Popup Flow (Original)

### Behaviour
1. Click "Sign in with Microsoft"
2. Button shows "Signing in..."
3. A popup window briefly appears then closes immediately
4. Error message: "Microsoft sign-in failed. Please try again."

### Error from console (after adding logging)
```json
{
  "errorCode": "timed_out",
  "errorMessage": "See https://aka.ms/msal.js.errors#timed_out for details"
}
```

### Root cause (partial)
The Chrome DevTools Protocol session (from the Claude in Chrome extension) interferes with MSAL's popup window. The "'Claude' started debugging this browser" banner was visible. MSAL opens a popup to `login.microsoftonline.com`, but the debugging session blocks or disrupts the popup lifecycle, causing a timeout.

**Note:** This may also fail WITHOUT the debugging session due to a separate scope/consent issue (see "Unchecked Items" below). We couldn't isolate this because the popup was always disrupted.

---

## Approach 2: Redirect Flow (Attempted Fix)

Switched from `loginPopup()` to `loginRedirect()` to avoid popup blocker issues.

### Behaviour
1. Click "Sign in with Microsoft"
2. Page appears to refresh (navigates to `localhost:8080/login` again)
3. No navigation to `login.microsoftonline.com` occurs
4. No error messages in console
5. No network requests to Microsoft observed

### Code path
```
Login.tsx button onClick
  → loginWithMsal() in auth.service.ts
    → getMsalInstance() — creates PublicClientApplication
    → msalInstance.initialize()
    → msalInstance.loginRedirect({ scopes: ['api://56966474.../access_as_user'] })
```

### What should happen
`loginRedirect()` should navigate the entire browser tab to:
```
https://login.microsoftonline.com/81fb6fd6-e413-4b3f-bdd5-2bd9049fd45f/oauth2/v2.0/authorize?client_id=94870691...&redirect_uri=http://localhost:8080&scope=api://56966474.../access_as_user...
```

### What actually happens
The page reloads at `localhost:8080/login` without ever navigating to Microsoft. No errors are thrown or logged. The `loginRedirect()` call appears to resolve silently without effect.

---

## Relevant Files

| File | Purpose |
|------|---------|
| `src/config/msal.ts` | MSAL instance config (lazy init, scopes) |
| `src/services/auth.service.ts` | `loginWithMsal()`, `handleMsalRedirect()`, `getAccessToken()` |
| `src/pages/Login.tsx` | Login page UI, calls `loginWithMsal()` on button click |
| `src/App.tsx` | `MsalRedirectHandler` component (handles redirect response on load) |
| `src/hooks/use-auth.ts` | `useMsalLogin` hook (currently unused after refactor) |
| `middleware/src/middleware/auth.ts` | JWT validation (Azure AD RS256 via JWKS) |
| `middleware/src/config/env.ts` | `DEMO_MODE` parsing (fixed: was using `z.coerce.boolean()`) |

---

## Fixes Already Applied During Session

### 1. `DEMO_MODE` boolean parsing (middleware)
**File:** `middleware/src/config/env.ts`
**Problem:** `z.coerce.boolean()` treats the string `"false"` as truthy (`Boolean("false") === true`)
**Fix:** Changed to `z.string().default('true').transform((val) => val.toLowerCase() === 'true')`

### 2. CORS origin port mismatch (middleware)
**File:** `middleware/.env`
**Problem:** `CORS_ORIGIN=http://localhost:5173` but frontend runs on port 8080
**Fix:** Changed to `CORS_ORIGIN=http://localhost:8080`

### 3. Supabase adapter guard (middleware)
**File:** `middleware/src/adapters/supabase.adapter.ts`
**Problem:** Throws when `DEMO_MODE=false`, but we need Supabase in dev even with real auth
**Fix:** Only throw in production: `if (!env.DEMO_MODE && env.NODE_ENV === 'production')`

### 4. SharePoint requirement relaxed (middleware)
**File:** `middleware/src/config/env.ts`
**Problem:** `DEMO_MODE=false` requires `SHAREPOINT_SITE_URL` which doesn't exist yet
**Fix:** Only enforce in production: `if (data.NODE_ENV === 'production')`

### 5. Redirect URI added (Azure Portal)
**Problem:** Only `http://localhost:5173` was registered
**Fix:** Added `http://localhost:8080` as SPA redirect URI on frontend app reg

---

## Unchecked Items (Likely Next Issues)

These haven't been tested yet because we couldn't get past the login step:

### 1. Backend API scope not exposed
The frontend requests scope `api://56966474-7166-4a20-a360-1adcb4c2b3a9/access_as_user`. This scope must be configured in the **backend** app registration under **Expose an API**:
- Application ID URI must be set to `api://56966474-7166-4a20-a360-1adcb4c2b3a9`
- A scope named `access_as_user` must be created
- The frontend app must have this API permission granted (with admin consent if required)

### 2. Staff app role not assigned
The middleware checks `roles.includes('Staff')` in the JWT. For this to work:
- An app role named `Staff` must be created in the backend app registration under **App roles**
- Hamish's user must be assigned this role under **Enterprise Applications** → **Users and groups**

### 3. `handleRedirectPromise()` race condition
The `MsalRedirectHandler` in `App.tsx` calls `handleRedirectPromise()` on mount. If `loginRedirect()` and `handleRedirectPromise()` create separate MSAL instances (due to lazy init + async import), they may conflict. Consider:
- Ensuring a single MSAL instance is shared
- Calling `handleRedirectPromise()` before any other MSAL operations
- Using `@azure/msal-react` wrapper instead of manual integration

---

## Suggested Investigation Steps

1. **Test `loginRedirect` in browser console directly:**
   ```js
   import('@azure/msal-browser').then(async ({ PublicClientApplication }) => {
     const pca = new PublicClientApplication({
       auth: {
         clientId: '94870691-5a2b-4f8d-86c4-627199a63de9',
         authority: 'https://login.microsoftonline.com/81fb6fd6-e413-4b3f-bdd5-2bd9049fd45f',
         redirectUri: 'http://localhost:8080',
       }
     });
     await pca.initialize();
     await pca.loginRedirect({ scopes: ['api://56966474-7166-4a20-a360-1adcb4c2b3a9/access_as_user'] });
   });
   ```
   This isolates MSAL from our React code. If this also just refreshes, the issue is MSAL config or Azure AD. If it navigates to Microsoft, the issue is in our React integration.

2. **Test in a non-debugged browser window** — open `localhost:8080/login` in a regular Chrome window (no extensions) and try popup flow.

3. **Check Azure Portal** — verify the backend app registration has **Expose an API** configured with the `access_as_user` scope.

4. **Consider `@azure/msal-react`** — the official React wrapper handles `handleRedirectPromise()` lifecycle automatically and avoids the race conditions we're hitting with manual integration.

---

## Current State of Code

The codebase currently has the **redirect flow** implementation (not popup). To revert to popup for testing in a non-debugged browser, change `loginRedirect` back to `loginPopup` in `auth.service.ts` and remove the `MsalRedirectHandler` from `App.tsx`.

The middleware is correctly configured with `DEMO_MODE=false` and will validate real Azure AD JWTs when a token is successfully acquired.
