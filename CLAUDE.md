# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neuro-Gen is an adaptive agenda-planner for neurodivergent users (ADHD, ASD, Giftedness), combining scheduling, focus tools, emotional regulation, and a shared-access model between primary users (Titulares) and their support network (Apoio). Currently a **documentation/planning-phase repository** — no backend or frontend source code exists yet, only architecture docs.

## Architecture

**Pattern:** Modular monolith (Core) + isolated services (Vault, Notification). See `docs/defContexto/04-arquitetura-visao-geral.md` and `docs/defContexto/05-adrs.md`.

**Services:**
- **Core Service** — Monolithic Spring Boot app with bounded-context modules: `identity`, `link`, `agenda`, `focus`, `emotional`, `vault`, plus `shared` kernel.
- **Vault Service** — Physically isolated Spring Boot app. Separate PostgreSQL instance, separate credentials, communicates via mTLS only. Zero-knowledge: client derives encryption key from master password via Argon2id; server never sees plaintext.
- **Notification Service** — Consumes RabbitMQ; async, never blocks Core.

**Module structure (each bounded context):**
```
<module>/
  domain/         aggregates, entities, VOs, domain events, exceptions, ports
  application/    use cases, commands, results
  api/            REST controllers, request DTOs (Bean Validation), OpenAPI annotations
  infrastructure/ JPA entities, port adapters, technical services, config
```

**Cross-module rule (ADR-001):** No module imports internal classes of another. Inter-module integration uses domain events (`ApplicationEventPublisher`) or shared ports (`SupportAccessPolicy` in `shared`). Example: `link` publishes `LinkRevoked`; `identity` reacts by invalidating Apoio sessions.

## Stack (ADRs 001–008)

| Layer | Technology |
|-------|-----------|
| Backend | Java 21 (virtual threads) + Spring Boot 3.3.x |
| Database | PostgreSQL 16 (two datasources: Core + Vault) |
| Cache | Redis |
| Messaging | RabbitMQ |
| Web | React 18 + TypeScript |
| Mobile | Kotlin Multiplatform (shared logic) + Jetpack Compose (Android) + SwiftUI (iOS) |
| Migrations | Flyway only (`ddl-auto=none`) |
| Auth | Spring Authorization Server; JWT RS256, 15 min access + 30 day refresh |

## Security Invariants

These are non-negotiable constraints from ADR-005 and RF-08.5:
- **Apoio role is structurally denied access to Vault** — not a runtime permission check but hard-coded in the security filter chain. Any test that verifies an `APOIO` account gets `403` on any `/api/v1/vault/*` route is a **mandatory CI security test**, never to be skipped.
- **Vault DB credentials are separate** from Core DB credentials. In prod, `VAULT_DB_URL/USERNAME/PASSWORD` env vars point to a separate instance.
- **Sensitive data** (emotional check-ins, neurodivergence profile, TOTP secrets) is encrypted at the column level with AES-256-GCM. The `SENSITIVE_DATA_KEY` env var must not be rotated after data exists.
- Passwords: Argon2id. JWT: RSA key pair (regenerated on restart in current deploy — tokens invalidate on restart).

## Data Schemas

Four PostgreSQL schemas within Core DB: `ng_identity`, `ng_core`, `ng_sensitive`. Vault DB has `ng_vault`. Sensitive data is in `ng_sensitive` with column-level encryption (ADR-006 — Privacy by Design for LGPD compliance). Migrations live in:
- `src/main/resources/db/migration/` — Core (V1–V4)
- `src/main/resources/db/vault/migration/` — Vault (V1)

## Running Locally

```bash
./mvnw spring-boot:run      # Docker Compose (compose.yaml) starts PostgreSQL automatically
```

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- Email verification tokens appear in logs (`[DEV] Verificação de e-mail`); email sending is simulated via `LoggingEmailSender`.

## Tests

```bash
./mvnw test                 # unit + API slice tests — no Docker required
./mvnw verify               # full pyramid including integration tests (requires Docker for Testcontainers)
```

**Test pyramid (ADR-008):**
- **Domain** — JUnit 5 + AssertJ, no Spring, no DB. Covers aggregate invariants and state machines.
- **Application** — Mockito, covers use cases including error paths.
- **API** — MockMvc standalone, covers HTTP contracts and `GlobalExceptionHandler`.
- **Integration** (`NeuroGenIntegrationTest`) — Testcontainers + real PostgreSQL 16, both datasources + Flyway. **Must include the Vault security test** (APOIO → 403 + audit log). Skipped automatically without Docker; CI fails if skipped.

## TDD Convention (ADR-008)

New behavior must start with a failing test commit. Commit message format:
- `test(module): descrição [TDD-RED]` — failing test
- `feat/fix(module): descrição [TDD-GREEN]` — minimal implementation
- `refactor(module): descrição [TDD-REFACTOR]` — cleanup without behavior change

## Commit & Branch Convention

Conventional Commits in Portuguese. Branch flow: `feature/*` → PR to `develop` → PR to `main`. Merge to `main` only with green CI. The main branch auto-deploys to Render (ADR-007).

## Deployment (Render — ADR-007)

```bash
# Build and test the Docker image locally
docker compose up -d
docker build -t neuro-gen .
docker run --rm -p 8080:8080 \
  -e DB_HOST=host.docker.internal -e DB_NAME=neurogen \
  -e DB_USERNAME=neurogen -e DB_PASSWORD=secret \
  -e SENSITIVE_DATA_KEY="$(openssl rand -base64 32)" \
  neuro-gen
```

Infra-as-code: `render.yaml` (Blueprint). Active profile in production: `prod` (`application-prod.yml`). All config comes from env vars in prod — no secrets in code.

**Known prod limitations:** Free tier hibernates after 15 min; free PostgreSQL expires after 30 days; JWT RSA key regenerates on restart (tokens invalidate).

## Web Frontend (`web/`)

**Stack:** Vite 5 + React 18 + TypeScript + TailwindCSS 3 + Zustand + TanStack Query + React Router v6

### Running

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run type-check # TypeScript check without build
```

Copy `web/.env.example` to `web/.env.local` and set `VITE_API_URL=http://localhost:8080`.

### Architecture

Feature-based module structure — mirrors backend bounded contexts:

```
src/
  app/           # Router, Providers, App root
  features/
    auth/        # Login, register, JWT tokens
    agenda/      # Calendar, tasks, kanban
    focus/       # Pomodoro timer, sessions
    emotional/   # Mood check-ins, journal, trend
    vault/       # Zero-knowledge password vault
    links/       # Titular/Apoio link management
    onboarding/  # 5-step profile setup
    dashboard/   # Home after login
  shared/
    components/  # ui/ (Button, Input, Card, Modal, Badge, Avatar, Spinner, Toast)
                 # layout/ (AppShell, Sidebar, TopBar)
    hooks/       # useLocalStorage, useMediaQuery, usePrefersReducedMotion
    lib/         # api.ts (Axios + JWT interceptor), queryClient.ts, cn.ts
    stores/      # auth.store.ts (Zustand persist), ui.store.ts
    types/       # api.types.ts, auth.types.ts
  styles/        # globals.css (Tailwind + design tokens)
```

Each feature has: `types.ts | services/*.service.ts | hooks/use*.ts | pages/*Page.tsx | components/`

**Module isolation rule:** features never import from each other — only from `@/shared`.

### Design System

Fonts: **Outfit** (display/headings) + **DM Sans** (body) + **JetBrains Mono** (code/numbers).

| Module | Tailwind token | Accent |
|--------|---------------|--------|
| Agenda | `agenda` | Sky blue `#0ea5e9` |
| Focus | `focus` | Violet `#7c3aed` |
| Emotional | `emotional` | Emerald `#10b981` |
| Vault | `vault` | Amber `#f59e0b` |
| Links | `link` | Cyan `#06b6d4` |

Glass card pattern: `glass-card` / `glass-card-hover` utility classes.
Page layout: `<div className="page-container space-y-5 animate-fade-in">`.

### State Management

- **Auth state** (`useAuthStore`): user, tokens, `isAuthenticated`, `hasCompletedOnboarding`
- **UI state** (`useUIStore`): sidebar collapse, reduced motion/density, font scale, toasts

Add a toast: `useUIStore.getState().addToast({ variant: 'success', message: '...' })`

### Vault — Zero-knowledge (ADR-005)

Client-side crypto in `web/src/features/vault/lib/crypto.ts`. Master password never leaves the browser. Use `encryptPayload` / `decryptPayload` — never log plaintext or master password.

### Specialized Slash Commands

| Command | Purpose |
|---------|---------|
| `/new-feature <name>` | Scaffold a full feature module with correct structure |
| `/new-component <Name>` | Create a UI component with correct tokens and a11y |
| `/connect-api <feature>` | Replace mocks with real API calls + loading/error/empty states |
| `/a11y-review <file>` | WCAG 2.1 AA audit checklist for a component/page |

### Accessibility (RNF-USA.2 — WCAG AA mandatory)

- All interactive elements have `focus-visible` ring (defined in globals.css)
- Icon-only buttons always have `aria-label`
- Dynamic regions use `aria-live="polite"` or `role="alert"`
- `prefers-reduced-motion` respected globally via CSS + `usePrefersReducedMotion` hook
- Minimum touch target 44×44px
- Vault module never shown to `APOIO` role — enforced in router guard (`RequireTitular`)

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/defContexto/01-visao-produto.md` | Product vision, personas, scope |
| `docs/defContexto/02-requisitos-funcionais.md` | Functional requirements and epics |
| `docs/defContexto/03-requisitos-nao-funcionais.md` | NFRs: security, privacy (LGPD), performance |
| `docs/defContexto/04-arquitetura-visao-geral.md` | C4 diagrams, layer rationale, rollout plan |
| `docs/defContexto/05-adrs.md` | ADR-001 through ADR-008 (immutable once Accepted) |
| `docs/backend/README.md` | Backend implementation guide |
| `docs/deploy/README.md` | Render deployment guide + live demo script |
| `docs/diagramas/` | PlantUML class, DER, use case, sequence diagrams |
