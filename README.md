# Restoran — AI Restoran İdarəetmə Platforması

Çox-restoranlı (multi-tenant) SaaS platforması. Tam memarlıq qərarları üçün bax: [`docs/RESTORAN-SAD-v1.md`](./docs/RESTORAN-SAD-v1.md).

## Stack

- **Backend:** Supabase (Postgres + Auth + RLS + Realtime) — layihə: `restoran` (ref: `qrbfpujqhrjtyvkrjygo`, `eu-central-1`)
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI:** Claude (əsas) + OpenAI (fallback) — Faza 10-da qoşulacaq
- **Monorepo:** Turborepo + pnpm workspaces

## Struktur

```
apps/
  admin-panel/     — Sahib/Menecer paneli (port 3000)
  customer-app/    — QR menyu, onlayn sifariş (port 3001)
packages/
  ui/              — Dizayn sistemi
  types/           — Ortaq TypeScript tipləri
  utils/           — logger, error handling, cn(), slugify
  supabase-client/ — Supabase browser/server/service müştəriləri + real DB tipləri
supabase/
  migrations/      — DB dəyişiklik tarixçəsi (Supabase MCP ilə tətbiq olunub)
docs/
  RESTORAN-SAD-v1.md — Software Architecture Document
```

## Verilənlər bazası (canlı)

8 cədvəl aktivdir, hamısında RLS aktivdir: `profiles`, `restaurants`, `branches`, `staff_members`, `menu_categories`, `menu_items`, `menu_item_variants`, `menu_item_modifiers`.

RPC funksiyaları: `onboard_restaurant` (qeydiyyat zamanı tenant yaratma), `get_public_restaurant_by_slug` (QR menyu üçün ictimai axtarış), `is_staff_of` / `can_manage_menu` (RLS köməkçiləri).

## Başlamaq üçün

```bash
pnpm install
pnpm dev:admin     # http://localhost:3000
pnpm dev:customer  # http://localhost:3001
```

`.env.local` faylları hər iki app-da artıq real Supabase açarları ilə hazırdır (yerli mühit üçün; `.gitignore`-da olduğu üçün repoya push olunmayıb).

## Status

- **Faza 1 — Təməl:** tamamlandı
- **Faza 2 — Menyu idarəetməsi + QR Menyu:** tamamlandı
  - Real Supabase Auth (qeydiyyat → `onboard_restaurant` RPC → dashboard)
  - Admin paneldə tam işlək Menyu CRUD (kateqoriya + məhsul, real DB)
  - Müştəri tərəfdə real, dinamik `/[slug]` QR menyu səhifəsi
- **Faza 3 — Sifariş axını + Mətbəx Ekranı:** başlanmayıb, təsdiq gözlənilir

---

By [s_akhundoff](https://instagram.com/s_akhundoff)

_Son yenilənmə: Faza 4 tamamlandı, Platform Admin paneli əlavə olundu._
