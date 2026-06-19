# SponsorAtlas

**UK visa sponsorship intelligence platform.** Find UK employers with proven Skilled Worker sponsorship history, real hiring signals, and salary compatibility — in one dark, fast, premium dashboard.

> _Stop applying blindly to weak sponsors._

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06b6d4)

---

## ✨ What's built

This is a **complete, runnable Next.js 14 application** with rich mock data — no external services required to run it.

| Area | Status | Notes |
| --- | --- | --- |
| **Landing page** | ✅ | Hero, animated grid, count-up stats, how-it-works, pricing preview, CTA |
| **Sponsor Search** | ✅ | URL-synced filters, fuzzy search + suggestions, sort, infinite scroll, mobile bottom-sheet filters, Pro-feature blur teaser |
| **Sponsor Detail** | ✅ | CoS bar chart (Recharts), job signals, suggested SOC roles, similar sponsors, sticky Fit widget, JSON-LD |
| **AI Sponsorship Fit** | ✅ | Local heuristic scorer with score ring, breakdown, gap analysis, alternatives (swappable for OpenAI) |
| **SOC Code Intelligence** | ✅ | Autocomplete, 89 occupations, 2026 going/lower rates, ISL/TSL badges, eligibility calculator |
| **Dashboard** | ✅ | Sidebar nav, usage meter, saved sponsors, alerts CRUD, upgrade banner, settings |
| **Pricing** | ✅ | 3-tier cards (Free / Pro / Pro+), "Most Popular" highlight, FAQ, trust badges |
| **Design system** | ✅ | Slate-950 dark theme, emerald/cyan accents, Inter, animations, `prefers-reduced-motion`, WCAG-minded contrast |
| **API routes** | ✅ | `/api/sponsors`, `/api/soc-codes`, `/api/fit-check` |
| **Prisma schema + seed** | ✅ | Full schema; seed loads 126 sponsors, 89 SOC codes, sample users/saves/fit-checks |
| **SEO** | ✅ | Dynamic `sitemap.xml`, `robots.txt`, per-page metadata, Open Graph, structured data |
| Auth (NextAuth) | 🔌 stub | Wire `GOOGLE_CLIENT_*` + `NEXTAUTH_SECRET`; dashboard currently uses a demo user |
| Stripe billing | 🔌 stub | Checkout buttons toast a placeholder; add keys + webhook route |
| OpenAI Fit scoring | 🔌 stub | Local scorer used by default; set `OPENAI_API_KEY` and swap the call in `api/fit-check` |
| Resend email alerts | 🔌 stub | Alert config UI is live; add `RESEND_API_KEY` + a cron job to send |

🔌 = clearly-marked integration point, ready for credentials.

---

## 🚀 Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it — the app runs entirely on bundled mock data (`src/lib/mock-data.ts`, `src/lib/soc-data.ts`). No database or API keys needed.

### Production build

```bash
npm run build && npm run start
```

All 126 sponsor pages are statically generated (SSG) at build time.

---

## 🗄️ Optional: connect a real database

The app ships with a complete Prisma schema and seed script for when you're ready to go live.

```bash
cp .env.example .env          # set DATABASE_URL (Supabase / Railway / Neon)
npm run prisma:generate
npm run prisma:push           # create tables (enables pg_trgm extension)
npm run prisma:seed           # load 126 sponsors + 89 SOC codes + sample users
```

Then swap the mock-data calls in pages/API routes for Prisma queries — the data
shapes already match the schema, so this is mostly find/replace.

---

## 🎨 Design system

| Token | Value |
| --- | --- |
| Background | `slate-950` `#020617` |
| Surface | `slate-900` `#0f172a` |
| Primary | `emerald-500` `#10b981` |
| Secondary | `cyan-500` `#06b6d4` |
| Headings / body | Inter (variable) |
| Numbers | `tabular-nums` |

Accents, gradients and animations follow the UX guidance baked into
`src/app/globals.css` and `tailwind.config.ts`. Motion respects
`prefers-reduced-motion`; touch targets are ≥40px; all interactive icons have
`aria-label`s.

---

## 📁 Project structure

```
prisma/
  schema.prisma          # Sponsor, SocCode, User, SavedSponsor, OpportunityAlert, FitCheck
  seed.ts                # deterministic seed from the mock data modules
src/
  app/
    page.tsx             # landing
    search/              # sponsor search (Suspense + client)
    sponsors/[id]/       # sponsor detail (SSG)
    soc-codes/           # SOC intelligence + eligibility calculator
    pricing/             # plans + FAQ
    dashboard/           # authed dashboard (demo user)
    api/                 # sponsors, soc-codes, fit-check
    sitemap.ts, robots.ts
  components/
    ui/                  # button, badge, card, input, skeleton, toast (shadcn-style)
    site-header.tsx, site-footer.tsx (persistent legal disclaimer)
    sponsor-card.tsx, cos-chart.tsx, fit-widget.tsx, stat-counter.tsx, pricing-cards.tsx …
  lib/
    mock-data.ts         # deterministic sponsor generator + search/filter/sort engine
    soc-data.ts          # 89 SOC occupations with 2026 rates
    fit.ts               # Sponsorship Fit scoring (OpenAI-swappable)
    types.ts, utils.ts, pricing.ts
  hooks/
    use-saved.ts         # client-side saved-sponsor persistence
```

---

## ⚖️ Disclaimer

SponsorAtlas is an informational research platform. It does **not** provide
immigration advice, legal advice, or guarantee visa sponsorship or employment.
All sponsor data derives from publicly available UK government records under the
[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
The figures in this demo are illustrative mock data.

---

## 🔭 Next steps to production

1. **Auth** — add NextAuth with Google + email; replace the demo user in the dashboard with the session.
2. **Database** — push the Prisma schema, seed, and replace mock-data reads with Prisma queries (pg_trgm for fuzzy search).
3. **Stripe** — add checkout sessions + a `/api/webhooks/stripe` route to flip `subscriptionTier`/`subscriptionStatus`.
4. **OpenAI** — swap the heuristic in `api/fit-check` for a structured chat completion (validate with zod).
5. **Resend + cron** — schedule alert delivery against `OpportunityAlert` rows.
6. **Real data** — replace the generator with the Home Office "Register of licensed sponsors: workers" CSV.
```
