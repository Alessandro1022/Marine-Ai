# Aetos Build AI

**Bygg smartare. Läck mindre.** — Modern SaaS + PWA for small/medium construction companies. Multi-tenant, strict RBAC, Swedish + English, dark + light mode.

Built by **Aetos Systems**.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS **v3** (do not upgrade to v4)
- Supabase (PostgreSQL + Auth + RLS)
- PWA (manifest + service worker, installable on iOS/Android)
- Zero chart dependencies (custom SVG charts)

## Setup (5 minutes)

### 1. Supabase
1. Create a new project at supabase.com
2. Open **SQL Editor** → paste the whole `supabase/schema.sql` → Run
3. **Authentication → Providers → Email**: turn **Confirm email OFF** (recommended for MVP, so team member creation works instantly)
4. Copy Project URL + anon key from **Settings → API**

### 2. Vercel
1. Push this repo to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 3. First login
Go to `/register` → create your company → you become **Beyer Bey** (owner). Then create your team from the **Team** page.

## Roles (RBAC)
| Role | Description |
|---|---|
| **Beyer Bey** | Owner. Full access, audit logs, settings, all user management |
| **Admin** | Site manager. Projects, orders, schedules, approvals, creates Economy/Worker/Intern |
| **Economy** | Financial controller. Read-only finance, reports, exports |
| **Worker** | Field workforce. Time, materials, assigned orders only |
| **Intern** | Training role. Time + assigned tasks only |

Every server action validates permissions (`src/lib/rbac.ts` + `src/lib/supabase/guard.ts`) **and** every table is protected by Postgres RLS — complete tenant isolation per company.

## Architecture (future-ready)
- `src/lib/rbac.ts` — add new roles/permissions in one place
- `src/app/actions/` — API layer ready for AI features (voice-to-time, forecasts, invoicing)
- `supabase/schema.sql` — enums make new statuses/roles a one-line migration
- i18n dictionaries in `src/lib/i18n/dictionaries.ts` — add languages by adding one object

## PWA
Installable from browser ("Add to Home Screen"). Standalone display, offline shell caching, safe-area support for iPhone.
