# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000 (may fall back to 3001+)
npm run build        # tsc -b && vite build
npm run type-check   # TypeScript check without build (fastest correctness check)
npm run lint         # ESLint with --max-warnings 0 (zero tolerance)
```

Copy `.env.example` → `.env.local`. Set `VITE_MOCK=true` to run entirely without a backend — MSW intercepts all `/api/v1/*` requests via a Service Worker.

## Architecture

**Stack:** Vite 5 + React 18 + TypeScript + TailwindCSS 3 + Zustand + TanStack Query v5 + React Router v6 + MSW v2

**`@` alias** maps to `./src`. Use it everywhere — no relative `../` imports from `features/`.

### Feature modules

Each feature under `src/features/<name>/` mirrors a backend bounded context and is fully self-contained:

```
<feature>/
  types.ts            domain types + display config objects
  services/*.service.ts   Axios calls against /api/v1/...
  hooks/use*.ts       TanStack Query wrappers (queryKey, queryFn, mutations)
  pages/*Page.tsx     route-level components
  components/         sub-components used only by this feature
```

**Module isolation rule:** features never import from each other — only from `@/shared`. Cross-feature navigation uses `<Link to="/...">` or `useNavigate`.

### Shared layer (`src/shared/`)

| Path | Contents |
|---|---|
| `components/ui/` | Button, Input, Card, Modal, Badge, Avatar, Spinner, Toast (exported from `index.ts`) |
| `components/layout/` | AppShell (desktop sidebar + mobile drawer), Sidebar, TopBar |
| `stores/auth.store.ts` | Zustand persist — `user`, `tokens`, `isAuthenticated`, `hasCompletedOnboarding` |
| `stores/ui.store.ts` | Zustand persist — `sidebarCollapsed`, `mobileSidebarOpen`, `reducedMotion`, `reducedDensity`, `fontScale`, toasts |
| `lib/api.ts` | Axios instance with **relative** `baseURL: '/api/v1'`; JWT interceptor; refresh logic |
| `lib/cn.ts` | `clsx` + `tailwind-merge` utility |
| `types/` | `api.types.ts`, `auth.types.ts` |

### State management split

- **Server state** (tasks, events, check-ins, vault entries, links, notifications): TanStack Query. `staleTime: 2 min`, `gcTime: 10 min`.
- **Client/UI state**: Zustand (`useAuthStore`, `useUIStore`). Both are persisted to localStorage via `zustand/middleware/persist`.

### API layer critical invariant

`api.ts` uses `baseURL: '/api/v1'` (relative, not `http://localhost:8080/api/v1`). Vite dev proxy routes `/api` → backend. MSW Service Worker intercepts same-origin requests. **Never change to an absolute URL** — it breaks MSW.

### Routing

`src/app/router.tsx` — all routes lazy-loaded with `React.lazy`. Two route guards:
- `RequireAuth` — redirects to `/login` if not authenticated
- `RequireTitular` — redirects to `/dashboard` if role is `APOIO` (enforces Vault access denial)

Vault (`/vault`) is wrapped in `<RequireTitular>` — this is a hard security constraint, never remove it.

## Mock layer (MSW)

Activated by `VITE_MOCK=true`. Files:
- `src/mocks/browser.ts` — registers the Service Worker
- `src/mocks/handlers.ts` — all HTTP handlers; validates credentials via `MOCK_CREDENTIALS`
- `src/mocks/data/seed.ts` — in-memory state, reset on page reload

Test users:
| Email | Password | Role |
|---|---|---|
| `raul.fsm692@gmail.com` | `Raul_Melo@2026` | TITULAR |
| `titular@demo.com` | *(any)* | TITULAR |
| `apoio@demo.com` | *(any)* | APOIO |

If the vault or login stops working after code changes: open DevTools → Application → Service Workers → Unregister all → hard refresh. Stale SW cache is the typical cause.

## Design system

**Fonts:** Outfit (display/headings) + DM Sans (body) + JetBrains Mono (code/numbers).

**Module accent tokens** (Tailwind):

| Feature | Token | Hex |
|---|---|---|
| Agenda | `agenda` | `#6366f1` |
| Focus | `focus` | `#7c3aed` |
| Emotional | `emotional` | `#0891b2` |
| Vault | `vault` | `#d97706` |
| Links | `link` | `#a855f7` |

Glass surface pattern: `glass-card` / `glass-card-hover` utility classes.  
Page layout: `<div className="page-container space-y-5 animate-fade-in">`.  
Add a toast: `useUIStore.getState().addToast({ variant: 'success', message: '...' })`.

## Mobile responsiveness

- Desktop (≥ `lg`): sidebar inline in flex layout.
- Mobile (< `lg`): sidebar is a fixed drawer. Toggle via `useUIStore → setMobileSidebarOpen(true/false)`. The hamburger button in TopBar triggers it; nav link clicks close it via the `onClose` prop on `<Sidebar>`.
- Modal component renders as a bottom sheet on mobile (`max-sm:` variants), centered dialog on `sm+`.

## Accessibility constraints (WCAG 2.1 AA — mandatory)

- All icon-only buttons must have `aria-label`.
- Dynamic regions use `aria-live="polite"` or `role="alert"`.
- Minimum touch target: 44×44px.
- `prefers-reduced-motion` respected via CSS + `usePrefersReducedMotion` hook and `[data-reduced-motion]` attribute.
- Emotional check-in screens must include the LGPD disclaimer: `"Este registro é apenas para autoconhecimento. Não substitui acompanhamento profissional de saúde mental."`

## Slash commands (specialized skills)

| Command | Purpose |
|---|---|
| `/new-feature <name>` | Scaffold full feature module with correct structure |
| `/new-component <Name>` | Create UI component with correct tokens and a11y |
| `/connect-api <feature>` | Replace mocks with real API calls + loading/error/empty states |
| `/a11y-review <file>` | WCAG 2.1 AA audit checklist |
