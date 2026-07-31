# RESTORAN — HANDOFF.md
_Son yenilənmə: 2026-07-31, gecə sessiyası sonu_

## 🔴 HƏLL OLUNMAMIŞ, İLK NÖVBƏDƏ BAXILMALI PROBLEM

**customer-app-da Vercel deployment statusu qeyri-müəyyəndir.**

- DB (`restaurants` cədvəli) **3 dəfə yoxlanıldı — tam təmizdir (0 sətir)**
- Kod tərəfi (`app/page.tsx`, `get_public_restaurant_directory` RPC) yoxlanıldı — düzgündür, heç bir hardcoded/fallback data yoxdur
- Buna baxmayaraq, istifadəçi **incognito rejimində belə** silinmiş "Karvansaray" restoranının customer-app-ın ana səhifəsində göründüyünü bildirir
- Vercel Deployments siyahısında **"Status 6/7"** görünür — 7 deployment-dən 1-i filtrlə gizlənib, ehtimal ki bu, ən son commit-in (`aab42e8` — "Platform Admin: loqo yükləmə") **uğursuz build-idir**
- **Son addım:** istifadəçi Vercel-də "Status" filtrini açıb bütün statusları görünən edəcək, xəta olan deployment-in Build Logs-una baxacaq və nəticəni bildirəcək
- **Əgər build xətası aşkar olunsa** — çox güman ki, səbəb `apps/customer-app/next.config.js`-ə əlavə edilən `runtimeCaching` massividir (commit `d4dc5b9`) — lokal build keçsə də, Vercel-in build mühiti fərqli ola bilər

**Növbəti sessiyada BURADAN başla.**

---

## Texniki Əsas
- **Monorepo:** Turborepo + pnpm — GitHub: `Samir210-az/restoran` (main branch)
- **Backend:** Supabase `qrbfpujqhrjtyvkrjygo` (eu-central-1)
- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind
  - `apps/admin-panel` → https://restoran-admin-panel.vercel.app
  - `apps/customer-app` → https://restoran-customer-app.vercel.app
- **Hər iki tətbiq PWA-dır** (`next-pwa`, service worker, manifest, "Tətbiqi yüklə" düymələri)

---

## Bu sessiyada edilən əsas işlər (xronoloji)

### 1. Maliyyə/hesabat sistemi
- Tam `expenses` cədvəli (kateqoriyalar: inventory_purchase, salary, rent, utility, other, supplier_payment, tax)
- Anbar alışı → `record_supplier_purchase` RPC (mədaxil + xərc BİRLİKDƏ)
- İşçilər → "Maaş ödə" düyməsi (StaffRow.tsx)
- Ayrıca `/expenses` səhifəsi (təchizatçı ödənişi, kommunal, vergi, digər)
- `/reports` → yalnız görmə (Gəlir−Xərc=Qazanc kartları)

### 2. Kuryer sistemi
- Yeni `courier` staff_role
- `/orders`-da kuryer təyinatı (öz işçisi və ya ad-hoc)
- Kuryer roluna xüsusi Dashboard görünüşü

### 3. Ödəniş
- Payriff araşdırıldı (tövsiyə edildi, amma real API inteqrasiyası test açarları olmadan YAZILMADI)
- **Kartdan-karta (əl ilə) ödəniş** — dərhal işlək: `/settings`-də kart nömrəsi, müştəri sifariş izləmədə görür

### 4. QR kodlar
- `/tables`-da hər masa üçün avtomatik real QR kod (data URI PNG)

### 5. Sifariş axını düzəlişi (VACİB)
- Əvvəllər: "Ödəniş alındı" YALNIZ payments-i yeniləyirdi, sifariş HEÇ VAXT "Tamamlandı" olmurdu
- İndi: ödəniş qəbulu = sifarişin bağlanması (TEK əməliyyat)

### 6. Bug-lar tapıldı və düzəldildi
- `get_public_restaurant_tables`, `get_public_card_transfer_info` — `SECURITY DEFINER` çatışmırdı (RLS müştərini bloklayırdı)
- Realtime: `payments`, `reservations`, `notifications`, `restaurant_tables` heç canlı yayımda deyildi (`ALTER PUBLICATION` ilə əlavə olundu)
- Bir çox düymə `startTransition` ilə server action çağırırdı, amma `router.refresh()` etmirdi → nəticə görünmürdü (Rezervasiya/İşçilər/Menyu/Xərclər-də düzəldildi)
- Mobil ekranda düymə sıraları kənara çıxırdı (`flex-wrap` əskik idi)

### 7. Bildiriş sistemi
- Tam yeni: yeni sifariş/rezervasiya → DB trigger → `notifications` cədvəli → Topbar-da canlı zəng ikonu

### 8. Platform Admin
- Restoran adına klik → `/platform/[restaurantId]` detal səhifəsi (əvvəllər cədvəldəki kiçik düymə mobil-də görünmürdü)
- **"Sıfırla"** (yalnız test məlumatları) + **"Həmişəlik sil"** (restoranın özü) — ikisi də ayrıca, təsdiq tələb edən düymələr
- Restoran yaradanda indi loqo yükləmə sahəsi var

### 9. Vizual (customer-app)
- Ana səhifə + `[slug]` səhifəsinə tam-səhifə restoran foto fonu (fixed, glassmorphism kartlar)
- AI Ofisiant düyməsinə + söhbət başlığına animasiyalı (terpənən) robot maskotu
- Ana səhifə hero-suna qızılı kloş/qapaq ikonu (başlığın "qapağı" kimi)

### 10. PWA
- Hər iki tətbiq quraşdırıla bilən (manifest, service worker, "Tətbiqi yüklə")
- Platform Admin üçün app shortcut (uzun basma menyusu)
- **KRİTİK FIX:** `runtimeCaching` əlavə olundu ki, səhifə naviqasiyaları HEÇ VAXT keşlənməsin (yalnız statik fayllar keşlənir) — səbəb: PWA defolt keşi silinmiş restoranı göstərirdi

---

## Hazırkı vəziyyət
- **Restoranlar cədvəli boşdur** (Karvansaray tam silinib, test üçün təmiz vəziyyət)
- Samir-in hesabı (`samir.akhundoff@gmail.com`) heç bir restorana bağlı deyil → admin panelə girəndə `/onboarding`-ə düşəcək
- **XƏBƏRDARLIQ:** `/onboarding` formu ("Son bir addım qalıb") istənilən ad yazılanda YENİ restoran yaradır — buradan keçmə, əvəzinə birbaşa `/platform`-a get və "Yeni restoran + sahib hesabı yarat" formunu istifadə et

## Naviqasiya qeydləri
- Platform Admin girişi restoran-staff kontekstindən TAM ayrıdır (`requirePlatformAdmin` ≠ `getCurrentStaffContext`) — restoran silinsə/dayandırılsa belə `/platform`-a giriş açıq qalır
- Restoran "Dayandırılıb" olsa, işçilər `/suspended` səhifəsinə yönləndirilir (əvvəllər bu YOXLANMIRDI — düzəldildi)

## Təhlükəsizlik prinsipləri (davam edən)
- Heç vaxt `for select using (true)`
- Bütün YENİ public-facing RPC-lər `SECURITY DEFINER` olmalıdır (bu sessiyada 2 dəfə unudulub, hər ikisi tapılıb düzəldilib)
- Yeni cədvəl yaradılanda MÜTLƏQ Supabase Realtime publication-a əlavə et (unudulsa, canlı yenilənmə səssizcə işləməz)

## Növbəti sessiya üçün
1. **Vercel deployment problemini həll et** (yuxarıya bax)
2. İstifadəçi ilə birlikdə təzə, təmiz restoran yarat (loqo ilə)
3. Bütün əsas axınları (sifariş, rezervasiya, ödəniş, hesabat) yenidən sınaqdan keçir
