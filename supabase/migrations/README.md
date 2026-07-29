# Migrasiya Tarixçəsi

Bu layihə birbaşa Supabase MCP (`apply_migration`) vasitəsilə canlı layihəyə (`restoran`,
ref: `qrbfpujqhrjtyvkrjygo`, region: eu-central-1) tətbiq olunub.

## Tam SQL-i yerli mühitə çəkmək üçün

```bash
supabase login
supabase link --project-ref qrbfpujqhrjtyvkrjygo
supabase db pull
```

Bu, bütün 15 migrasiyanın tam SQL-ini `supabase/migrations/`-a yazacaq və bu qovluqdakı
referans faylları əvəz edəcək.

## Cari sxem (Faza 2 sonu etibarilə)

**Tenant / Platform:** restaurants, branches, profiles, staff_members, platform_admins
**Menyu:** menu_categories, menu_items, menu_item_variants, menu_item_modifiers
**Masa/Rezervasiya:** restaurant_tables, reservations
**Sifariş:** orders, order_items, payments
**Anbar:** inventory_items, inventory_transactions, suppliers, purchase_orders
**Müştəri:** customers, loyalty_transactions, reviews
**AI:** ai_conversations, ai_recommendations, menu_item_embeddings (pgvector)
**Sistem:** notifications, audit_logs, subscriptions, invoices

Bütün cədvəllərdə RLS aktivdir. Əsas prinsip: `is_staff_of(restaurant_id)` funksiyası
istifadəçinin həmin restoranın sahibi və ya aktiv işçisi olduğunu yoxlayır — yalnız o halda
giriş verilir. Menyu cədvəlləri (`menu_categories`, `menu_items` və s.) əlavə olaraq public
SELECT icazəsinə malikdir ki, QR menyu autentifikasiyasız oxuna bilsin.
