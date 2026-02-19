**PROMPT HEADER (USE EVERY TIME):**
Coding under GOLDEN_RULES.md.
Workflow: Question → Plan → Approval → Code.
Follow SRP, DRY, SoC, Security by Default.
Output only clean final code.

## 1. INTERACTION PROTOCOL (MANDATORY)

1. Ask first: 1-3 clarifying questions if brief is ambiguous
2. Plan first: Outline file structure, modules, data flow before coding
3. Search first: Check codebase for existing implementations before creating
4. **Refactor first: Remove duplication and dead code before adding features**
5. Diff only: When editing, show diffs not full files
6. Wait for approval: Get explicit "Proceed" before coding

## 2. ARCHITECTURE

1. One component/module per file (≤300 lines)
2. Each function does one thing (≤40 lines)
3. Apply SRP and SoC - separate data, logic, presentation
4. Enforce DRY, KISS, YAGNI
5. **Extract shared logic to /utils, /hooks, /helpers, or DTOs**
6. Composition over inheritance
7. One-way imports - no circular dependencies
8. Barrel exports (index files) for clean imports
9. No magic numbers or hidden constants
10. Delete or justify unused dependencies

## 3. SECURITY (VIOLATION = FAILURE)

1. Never hardcode secrets - use .env variables
2. Never commit .env or keys - use .gitignore
3. Validate and sanitise ALL input (server + client)
4. Encode output to DOM (prevent XSS)
5. Parameterised queries only (prevent injection)
6. Least privilege for API and DB access
7. Avoid eval, dynamic imports from user data, inline scripts
8. Dependencies: minimal, vetted, version-locked
9. Never log secrets, passwords, or personal data
10. Assume all data untrusted until validated

## 4. DATA & APIs

1. Use DTOs or typed interfaces - never expose internal models
2. **Single source of truth for state/config (e.g., store/context)**
3. Type all inputs/outputs where language supports
4. Avoid O(n²) where O(n) exists
5. Cache repeated reads and API calls
6. Paginate and limit results by default
7. Single-item endpoints return the DTO directly; list endpoints return `{items, pagination}`; errors return `{code, message, correlationId?}`
8. Handle and log errors with context
9. Document APIs with inline examples or OpenAPI
10. Validate all request data before processing
11. **Configure production settings: Separate environment-specific values (e.g., API keys, log levels) from code.**

## 5. FRONTEND

1. **Functional components only - typed props (using a modern type system like TypeScript) required**
2. Separate logic (hooks) from rendering
3. Global state via context/store - avoid prop drilling >2 levels
4. Handle loading, success, error states
5. CSS modular or scoped - no global leaks
6. Optimise assets, lazy-load routes
7. Never fetch in render functions
8. Ensure accessibility and keyboard navigation

## 6. BACKEND

1. Separate routes, controllers, services
2. Consistent error handling and response structures
3. Retries, timeouts, circuit breakers for external calls
4. Structured logs - not free-text
5. Background jobs must be idempotent
6. Never block event loop with heavy computation
7. Limit concurrent operations, protect shared resources

## 7. TESTING

1. At least one test per core function/route
2. Mock external calls - never hit live APIs
3. Run type check, lint, tests before commit
4. Cover happy and failure paths
5. Test security: invalid inputs, overflow, injection
6. Test data in fixtures, not inline
7. **Test types: Focus on unit tests for services/logic, and integration tests for component behavior.**

## 8. PERFORMANCE

1. Structured logs and metrics for key operations
2. Avoid unnecessary re-renders/recomputation
3. Lazy-load or defer non-critical resources
4. Profile and measure hotspots regularly
5. Cache expensive computations when repeatable
6. Add tracing to async workflows

## 9. MAINTENANCE

1. Delete dead/duplicate code proactively
2. Remove console logs, debug prints, commented blocks
3. **Atomic commits: Each commit should focus on one logical change (add, change, OR remove).**
4. Document architectural decisions in comments or ADR
5. Verify no file >300 lines before commit
6. On refactor: confirm no orphaned code remains
7. Each PR states what changed and why
8. **Maintain a high-level, non-technical Project Summary document (e.g., in a README or Wiki) that is updated with a simple summary of any architectural change, new feature, or major data flow modification. This document must be readable by a non-developer.**

## 10. ANTI-PATTERNS (AVOID)

- Copy-pasted code
- Global mutable state
- Mixed UI and business logic
- Inline secrets or credentials
- Magic numbers or hardcoded URLs
- Over-engineering ("just in case")
- Commented-out old code
- Gigantic components or services
- Unhandled async errors
- Logging sensitive data

## 11. DEFINITION OF DONE

Before submitting code, verify:

✅ Architecture planned and documented
✅ No duplication or dead code
✅ All inputs validated, outputs encoded
✅ Tests, lint, type check pass
✅ Commits atomic and documented
✅ Code readable, secure, under size limits
✅ No hardcoded secrets or debug logs
✅ Security rules followed (section 3)