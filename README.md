# AgentFlow Pitch Hub v0.1

A client pitch portal built on Microsoft 365. This is AgentFlow eating its own dog food — we're building a minimal pitch hub to use ourselves before selling the full platform to professional services firms.

## What This Is

**Wireframes only.** This front-end is a complete UI for the Pitch Hub, built in React/TypeScript. All buttons, forms, and interactions are visual placeholders. There is no middleware connection yet — that's being built separately by Stephen.

The wireframes cover two user experiences:
- **AgentFlow Staff View** — where we manage pitches, upload content, and track engagement
- **Client View** — what prospects see when they log into their hub

## Where This Fits

This is v0.1 of a larger product vision. The full AgentFlow Hubs platform will be a client relationship tool for professional services firms, with AI-powered insights and Microsoft 365 integration throughout.

**Read the full vision:** See [VISION_AND_ASSUMPTIONS.md](./VISION_AND_ASSUMPTIONS.md) for:
- The complete product vision
- How v0.1 fits within it
- All middleware technical assumptions
- Graph API permissions required
- Open questions for discovery

## Tech Stack

- **Vite** — build tool
- **TypeScript** — type safety
- **React** — UI framework
- **Tailwind CSS** — styling
- **shadcn/ui** — component library

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

## Development

### Prerequisites

- Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Setup
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Editing Options

**Lovable:** Visit the [Lovable Project](https://lovable.dev/projects/2d3fa705-4a22-46bc-ab6d-2969a7cce80a) and prompt changes directly. Commits automatically.

**Local IDE:** Clone, edit, push. Changes sync back to Lovable.

**Cursor + AI:** Use Cursor with Claude Code CLI, Gemini CLI, or Codex CLI. See `.cursorrules` for project context.

## Project Structure
```
/src
  /components    # UI components
  /pages         # Page views
  /lib           # Utilities (will include Graph API helpers)
  /assets        # Images, icons
/docs
  VISION_AND_ASSUMPTIONS.md
```

## Deployment

**Preview:** Open [Lovable](https://lovable.dev/projects/2d3fa705-4a22-46bc-ab6d-2969a7cce80a) → Share → Publish

**Custom domain:** Project → Settings → Domains → Connect Domain. [Docs](https://docs.lovable.dev/features/custom-domain#custom-domain)

## What's Next

1. **Hamish:** Complete wireframes for all sections
2. **Stephen:** Research and prototype Microsoft Graph API integrations
3. **Together:** Connect front-end to middleware, test with real M365 tenant

## Key Documents

- [VISION_AND_ASSUMPTIONS.md](./VISION_AND_ASSUMPTIONS.md) — Full product vision and middleware assumptions
- `.cursorrules` — Context for AI coding assistants

---

*This is a wireframe prototype. No real data, no real authentication, no real API calls — yet.*