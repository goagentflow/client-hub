# AgentFlow Client Hub v0.1

A client relationship portal built on Microsoft 365. AgentFlow is building this to use with our own clients before selling the full platform to professional services firms.

## What This Is

Two hub types, each with staff and client views:

- **Pitch Hubs** — Managing new business pitches (proposals, videos, documents, meetings)
- **Client Hubs** — Ongoing client relationships (projects, status updates, health scoring, expansion opportunities)

The frontend wireframe is largely complete for both hub types. Some client-portal routes intentionally show "Coming Soon" placeholders where backend capabilities are still in development. The middleware API layer is in active development, with production deployment live for the implemented subset.

## New Developer? Start Here

1. **`README.md`** — You're here. Setup instructions and project overview.
2. **`docs/CURRENT_STATE.md`** — Canonical live-vs-aspirational status.
3. **`docs/PRODUCTION_ROADMAP.md`** — Detailed phase plan and endpoint inventory.
4. **`progress/STATUS.md`** — Implementation log and decisions history.
5. **`AGENTS.md`** — Architecture canon and coding standards.
6. **`docs/API_SPECIFICATION.md`** — Historical aspirational API contract draft (not source of truth for live behavior).

## Tech Stack

**Frontend:**
- Vite (build tool)
- TypeScript
- React
- Tailwind CSS
- shadcn/ui components
- MSAL.js (@azure/msal-browser) for Azure AD login

**Middleware:**
- Express (Node.js)
- TypeScript
- Prisma 6 (ORM)
- jose (JWT validation — Azure AD RS256 + portal HS256)
- Zod (input validation)
- Pino (structured logging)

## Development

### Prerequisites
- Node.js 20+ — [install with nvm](https://github.com/nvm-sh/nvm)
- pnpm — `npm install -g pnpm`

### Frontend
```sh
git clone <REPO_URL>
cd client-hub
npm install
npm run dev              # http://localhost:5173
```

### Middleware
```sh
cd middleware
pnpm install
cp .env.example .env     # Defaults: AUTH_MODE=demo, DATA_BACKEND=azure_pg
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
npx prisma generate      # Generate Prisma client
pnpm run dev             # http://localhost:3001
```

### Tests
```sh
cd middleware
pnpm test                # 159 tests across 11 files
```

## Project Structure

```
/src                        # Frontend (React)
  /components               # UI components
  /pages                    # Page views
  /services                 # API client, auth service
  /lib                      # Utilities
/middleware                  # Backend (Express)
  /src
    /config                 # Environment config (AUTH_MODE, DATA_BACKEND)
    /middleware              # Auth, hub-access, inject-repository
    /routes                 # API route modules (real + placeholder endpoints)
    /adapters               # Data layer adapters
    /db                     # Prisma client, TenantRepository, AdminRepository
  /prisma
    schema.prisma           # Database schema
/docs                       # Architecture docs, API spec, phase plans
/progress                   # STATUS.md — master project status
```

## Brand Guidelines

| Colour | Hex | Usage |
|--------|-----|-------|
| Gradient Blue | `#a6c3e8` | Headers, buttons, hero sections |
| Gradient Purple | `#c6b8e4` | Backgrounds, accents, gradients |
| Deep Navy | `#2c3e50` | Text overlays, navigation, icons |
| Warm Cream | `#fdfaf6` | Main background |
| Soft Coral | `#f7a89d` | Call-to-action buttons (use sparingly) |
| Sage Green | `#a1bba2` | Illustrations, icons, balance elements |
| Dark Grey | `#3c3c3c` | Primary body text |
| Medium Grey | `#6b6b6b` | Secondary text, metadata |
| Bold Royal Blue | `#3d5fa8` | Headings, emphasis |
| Rich Violet | `#7952b3` | Alternating headings, key terms |

**Font:** Calibri (fallback to system sans-serif)

**Logo:** https://www.goagentflow.com/assets/images/AgentFlowLogo.svg

## Current Status

MVP is live on Cloud Run + Supabase PostgreSQL. Phase 0b (codebase refactor), Phase 1.5 (portal email verification), Phase 2a (invite endpoints), and Phase 2b (status updates) are complete and deployed. For exact live-vs-aspirational behavior, read `docs/CURRENT_STATE.md`.

## Key Documents

- [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) — Canonical live vs aspirational state
- [progress/STATUS.md](./progress/STATUS.md) — Master project status and roadmap
- [AGENTS.md](./AGENTS.md) — Architecture canon and coding standards
- [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md) — Detailed phase plan
- [docs/API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) — Historical aspirational API contract draft
- [docs/PHASE_2_CLIENT_HUBS.md](./docs/PHASE_2_CLIENT_HUBS.md) — Historical Phase 2 product spec (goal-state)
- [docs/Vision_and_Assumptions.md](./docs/Vision_and_Assumptions.md) — Product vision and long-horizon assumptions
