# Restoran — AI Restoran İdarəetmə Platforması

Çox-restoranlı (multi-tenant) SaaS platforması. Tam memarlıq qərarları üçün bax: [`docs/RESTORAN-SAD-v1.md`](./docs/RESTORAN-SAD-v1.md).

## Stack

- **Backend:** Supabase (Postgres + Auth + RLS + Realtime + Edge Functions)
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI:** Claude (əsas) + OpenAI (fallback)
- **Monorepo:** Turborepo + pnpm workspaces

## Struktur

```
apps/
  admin-panel/     — Sahib/Menecer paneli (port 3000)
  customer-app/    — QR menyu, onlayn sifariş (port 3001)
packages/
  ui/              — Dizayn sistemi (Button, Card, Input, Modal, Table, tema)
  types/           — Ortaq TypeScript tipləri
  utils/           — logger, error handling, cn()
  supabase-client/ — Supabase browser/server/service müştəriləri
supabase/
  migrations/      — DB sxemi (Faza 2-də doldurulacaq)
  functions/       — Edge Functions (Faza 2-də doldurulacaq)
docs/
  RESTORAN-SAD-v1.md — Software Architecture Document
```

## Başlamaq üçün

```bash
pnpm install
cp .env.example .env.local   # hər iki app üçün .env.local yaradın və Supabase açarlarını doldurun
pnpm dev:admin     # http://localhost:3000
pnpm dev:customer  # http://localhost:3001
```

## Status

**Faza 1 — Təməl:** tamamlandı (dizayn sistemi, layout-lar, auth UI, dashboard UI, dark/light mode)
**Faza 2 — Biznes məntiqi:** başlanmayıb, təsdiq gözlənilir

---

By [s_akhundoff](https://instagram.com/s_akhundoff)
