# AgentFlow Client Hub v0.1

A client relationship portal built on Microsoft 365. AgentFlow is building this to use with our own clients before selling the full platform to professional services firms.

## What This Is

Two hub types, each with staff and client views:

- **Pitch Hubs** — Managing new business pitches (proposals, videos, documents, meetings)
- **Client Hubs** — Ongoing client relationships (projects, health scoring, expansion opportunities)

The frontend wireframe is complete for both hub types. The middleware API layer (113 endpoints) is in active development, with Azure AD authentication code-complete.

## New Developer? Start Here

1. **`README.md`** — You're here. Setup instructions and project overview.
2. **`progress/STATUS.md`** — Where the project is now, full roadmap, key decisions.
3. **`AGENTS.md`** — Architecture canon and coding standards.
4. **`docs/PRODUCTION_ROADMAP.md`** — Detailed phase plan with endpoint inventory.
5. **`docs/API_SPECIFICATION.md`** — Complete API contract (113 endpoints).
6. **`docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md`** — Auth design (if working on auth).

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
- Node.js 18+ — [install with nvm](https://github.com/nvm-sh/nvm)
- pnpm — `npm install -g pnpm`

### Frontend
```sh
git clone <REPO_URL>
cd agentflow-pitch-hub-wireframe
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
pnpm test                # 84 tests across 5 files
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
    /routes                 # 113 API endpoints
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

Phase 0b (codebase refactor) is complete — migrated to Prisma 6 ORM, replaced DEMO_MODE with AUTH_MODE + DATA_BACKEND config, completed route migration from Supabase adapter. See `progress/STATUS.md` for full details.

## Key Documents

- [progress/STATUS.md](./progress/STATUS.md) — Master project status and roadmap
- [AGENTS.md](./AGENTS.md) — Architecture canon and coding standards
- [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md) — Detailed phase plan
- [docs/API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) — Complete API contract
- [docs/PHASE_2_CLIENT_HUBS.md](./docs/PHASE_2_CLIENT_HUBS.md) — Phase 2 specification
- [docs/Vision_and_Assumptions.md](./docs/Vision_and_Assumptions.md) — Product vision
