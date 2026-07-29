# RESTORAN — AI Restoran İdarəetmə Platforması
## Proqram Arxitekturası Sənədi (Software Architecture Document) — v1.0

**Repo:** github.com/Samir210-az/restoran
**Status:** Təsdiq gözlənilir — kod yazılmayıb
**Hazırladı:** Lead Architect (Claude) — Samir üçün

---

## 1. İcmal

Restoran, çox-restoranlı (multi-tenant) SaaS platformasıdır. Yəni bir kod bazası, bir infrastruktur üzərində **onlarla, yüzlərlə fərqli restoran** öz məlumatları bir-birindən tam təcrid olunmuş şəkildə idarə edə bilir. Hər restoran öz menyusunu, işçilərini, sifarişlərini görür — başqasının məlumatına heç vaxt çıxışı olmur.

Platformanın iki qatı var:

- **B2B qat** — restoran sahibləri platformaya abunə olur, öz biznesini idarə edir (panel, kassa, mətbəx ekranı, anbar, işçilər).
- **B2C qat** — restoranın öz müştəriləri QR menyu, onlayn sifariş, AI Ofisiant ilə qarşılaşır.

Bu sənəd hər iki qatın texniki təməlini müəyyən edir.

---

## 2. Əskik Xüsusiyyətlər və Təkliflər

İlkin sənəddə (AI Restaurant SaaS) çox güclü funksional siyahı var idi, amma bir neçə **kommersiya SaaS üçün həyati** element yox idi. Bunları əlavə etmək təklif edirəm:

| # | Nə çatışmır | Niyə vacibdir |
|---|---|---|
| 1 | **Multi-tenancy / məlumat təcridi** | Bir restoranın işçisi başqa restoranın sifarişini görməməlidir. Bu, təhlükəsizliyin əsasıdır, sonradan əlavə etmək demək olar ki, mümkün deyil — indi qurulmalıdır. |
| 2 | **SaaS abunə/billinq sistemi** | Restoranlar sənə necə pul ödəyəcək? Aylıq plan (Free/Pro/Enterprise), limit (məs. sifariş sayı, filial sayı) olmalıdır. |
| 3 | **Restoran onboarding axını** | Yeni restoran qeydiyyatdan keçəndə addım-addım quraşdırma sarğısı (menyu yükləmə, masa sayı, filial) lazımdır. |
| 4 | **Filial (çoxsaylı restoran yeri) dəstəyi** | Bir sahibin 3 filialı ola bilər — bu, verilənlər bazasında nəzərə alınmalıdır. |
| 5 | **Bildiriş sistemi (Notifications)** | Push/SMS/email — sifariş qəbul olundu, masa hazırdır, stok azalıb və s. |
| 6 | **Audit log** | Kim, nə vaxt, nəyi dəyişdi — mübahisə/sui-istifadə halında lazım olur. |
| 7 | **Offline dəstək (PWA)** | Restoranda internet kəsilə bilər — kassa və ofisiant tətbiqi qismən offline işləməlidir. |
| 8 | **Ödəniş qatı üçün lokal inteqrasiya** | Azərbaycan bazarı üçün Payriff / Kapital Bank kimi lokal gateway, xaricdə Stripe. |
| 9 | **Fraud/təhlükəsizlik monitorinqi** | Anormal sifariş/geri qaytarma nümunələri aşkarlanmalıdır. |
| 10 | **Rol əsaslı incə icazə sistemi (RBAC)** | Sadəcə "Manager" rolu kifayət etmir — "hansı manager hansı filialı idarə edir" səviyyəsində olmalıdır. |
| 11 | **Data export/backup** | Restoran sahibi öz məlumatını istənilən vaxt çıxara bilməlidir (GDPR-vari tələb). |

**Vanilla JavaScript barədə fikrim:** İlkin sənəddə frontend Vanilla JS planlaşdırılıb. Bu, kiçik layihə üçün münasib olsa da, 6+ ayrı interfeys (admin panel, kassa, mətbəx ekranı, ofisiant tətbiqi, müştəri tətbiqi) olan kommersiya SaaS üçün **uzunmüddətdə saxlanma xərcini çox artırır**. Component-based framework (React/Next.js, TypeScript ilə) təklif edirəm — səbəbini bölmə 11-də izah edirəm. Bu, sənin təsdiqini gözləyən açıq məsələdir.

---

## 3. Sistem Arxitekturası

### 3.1 Yüksək səviyyəli baxış

```
                    ┌─────────────────────────┐
                    │   Supabase (Backend)     │
                    │  Postgres + Auth + RLS   │
                    │  Realtime + Storage       │
                    │  Edge Functions (AI/işgüzar) │
                    └───────────┬───────────────┘
                                │
        ┌───────────┬──────────┼──────────┬────────────┐
        │            │          │          │            │
   Admin Panel   Kassa (POS) Mətbəx      Ofisiant     Müştəri
   (Owner/       Cashier     Ekranı      Tətbiqi      Tətbiqi
   Manager)                  (KDS)       (Waiter)     (QR Menu,
                                                        Sifariş)
```

### 3.2 Əsas prinsiplər

- **Multi-tenant təcrid:** Hər cədvəldə `restaurant_id` sütunu, Supabase Row Level Security (RLS) ilə server səviyyəsində qorunur — tətbiq kodu səhv yazılsa belə, məlumat sızması mümkün olmur.
- **Modul əsaslı monorepo:** Hər interfeys ayrı tətbiqdir, amma ortaq komponent və məntiq paketlərini paylaşır.
- **Edge Functions üçün işgüzar məntiq:** Supabase-in avtomatik yaratdığı CRUD API-dən əlavə, sifariş hesablama, ödəniş, AI çağırışları kimi mürəkkəb məntiq təhlükəsiz server tərəfində (Edge Function) işləyir — brauzerdə deyil.
- **Realtime hər yerdə:** Sifariş statusu, mətbəx ekranı, masa vəziyyəti — hamısı Supabase Realtime kanalları ilə canlı yenilənir, səhifə yeniləməyə ehtiyac yoxdur.
- **AI qat ayrıdır:** AI Ofisiant və Biznes Kəşfiyyatı ayrıca paket kimi qurulur ki, gələcəkdə model dəyişdirmək (OpenAI → Claude, və ya əksinə) bütün sistemi sarsıtmasın.

---

## 4. Qovluq Strukturu

Monorepo (pnpm workspaces + Turborepo) yanaşması:

```
restoran/
├── apps/
│   ├── admin-panel/          # Sahib/Menecer paneli
│   ├── pos-cashier/          # Kassa interfeysi
│   ├── kitchen-display/      # Mətbəx ekranı (KDS)
│   ├── waiter-app/           # Ofisiant planşet tətbiqi
│   ├── customer-app/         # QR menyu + onlayn sifariş (müştəri)
│   └── landing-page/         # Platformanın özünün marketinq saytı
│
├── packages/
│   ├── ui/                   # Ortaq komponentlər (button, card, modal...)
│   ├── types/                # Ortaq TypeScript tipləri
│   ├── supabase-client/      # Supabase bağlantı konfiqurasiyası
│   ├── ai-engine/            # AI Ofisiant + BI məntiqi (client tərəfi)
│   ├── i18n/                 # AZ/EN/RU tərcümələr
│   └── utils/                # Ortaq köməkçi funksiyalar
│
├── supabase/
│   ├── migrations/           # Verilənlər bazası dəyişiklik tarixçəsi
│   ├── functions/            # Edge Functions (server məntiqi, AI çağırışları)
│   ├── policies/             # RLS təhlükəsizlik qaydaları
│   └── seed/                 # Test/demo məlumatı
│
├── docs/                     # Bu sənəd və digər sənədləşdirmə
└── infra/                    # Deployment konfiqurasiyası
```

**Niyə monorepo:** 6 ayrı tətbiq eyni dizayn sistemini, eyni tipləri, eyni Supabase müştərisini paylaşır. Ayrı repolarda saxlasaq, hər dəyişiklikdə 6 yerdə eyni işi təkrar etmək lazım gələr — bu, sui-istifadəyə açıq xəta mənbəyidir.

---

## 5. Verilənlər Bazası Sxemi (Supabase / Postgres)

Aşağıda cədvəllər **dizayn səviyyəsində** verilir (kod yazılmayıb, tələb olunduğu kimi).

### 5.1 Platforma səviyyəsi

**`restaurants`** (əsas tenant cədvəli)
| Sütun | Tip | Qeyd |
|---|---|---|
| id | uuid, PK | |
| owner_id | uuid, FK → auth.users | |
| name | text | |
| slug | text, unique | QR/URL üçün (məs. restoran.app/menu/slug) |
| subscription_plan | enum(free, pro, enterprise) | |
| subscription_status | enum(active, trial, suspended, cancelled) | |
| default_language | enum(az, en, ru) | |
| timezone | text | |
| created_at | timestamptz | |

**`branches`** (filiallar)
| Sütun | Tip | Qeyd |
|---|---|---|
| id | uuid, PK | |
| restaurant_id | uuid, FK | |
| name, address, phone | text | |
| lat, lng | numeric | Xəritə üçün |
| is_active | boolean | |

**`subscriptions`** / **`invoices`** — SaaS billinq (plan, dövr, məbləğ, status, ödəniş provayderi ID-si).

### 5.2 İstifadəçi və rollar

**`profiles`** (auth.users-in genişlənməsi)
| Sütun | Tip |
|---|---|
| id | uuid, PK = auth.users.id |
| full_name, phone, avatar_url | text |
| preferred_language | enum(az,en,ru) |

**`staff_members`** (kim hansı restoranda hansı roldadır)
| Sütun | Tip |
|---|---|
| id | uuid, PK |
| user_id | FK → profiles |
| restaurant_id | FK |
| branch_id | FK, nullable (null = bütün filiallara giriş) |
| role | enum(owner, manager, cashier, chef, waiter) |
| is_active | boolean |
| hired_at | date |

### 5.3 Menyu

**`menu_categories`** → id, restaurant_id, name (jsonb — çoxdilli: {az,en,ru}), sort_order, is_active

**`menu_items`** → id, category_id, restaurant_id, name (jsonb), description (jsonb), price, image_url, is_available, prep_time_minutes, calories, allergens (array), tags (vegan, spicy və s.)

**`menu_item_variants`** → id, menu_item_id, name (məs. "Böyük ölçü"), price_modifier

**`menu_item_modifiers`** → id, menu_item_id, name (məs. "Əlavə pendir"), price_modifier, group_name (məs. "Əlavələr")

### 5.4 Masalar və Rezervasiya

**`tables`** → id, branch_id, table_number, qr_code_url, capacity, status(free/occupied/reserved)

**`reservations`** → id, branch_id, table_id, customer_name, customer_phone, party_size, reserved_at, status(pending/confirmed/seated/cancelled/no_show), notes

### 5.5 Sifarişlər

**`orders`** → id, restaurant_id, branch_id, table_id (nullable — online sifariş üçün), customer_id (nullable), order_type(dine_in/takeaway/delivery), status(pending/confirmed/preparing/ready/served/completed/cancelled), subtotal, tax, total, placed_by(customer/waiter/ai_waiter), created_at

**`order_items`** → id, order_id, menu_item_id, variant_id, quantity, unit_price, selected_modifiers(jsonb), special_instructions, kitchen_status(queued/cooking/ready)

**`payments`** → id, order_id, amount, method(card/cash/online), provider(stripe/payriff), provider_ref, status

### 5.6 Anbar

**`inventory_items`** → id, restaurant_id, name, unit(kg/litr/ədəd), current_stock, low_stock_threshold

**`inventory_transactions`** → id, item_id, type(purchase/usage/waste/adjustment), quantity, related_order_id(nullable), created_by

**`suppliers`** → id, restaurant_id, name, contact_info

**`purchase_orders`** → id, supplier_id, status, total, items(jsonb ya ayrı cədvəl)

### 5.7 Müştəri & Loyallıq

**`customers`** → id, restaurant_id, full_name, phone, email, loyalty_points, total_spent, visit_count

**`loyalty_transactions`** → id, customer_id, points_change, reason, order_id

**`reviews`** → id, order_id, customer_id, rating(1-5), comment, sentiment(AI təhlili nəticəsi)

### 5.8 AI

**`ai_conversations`** → id, restaurant_id, customer_id(nullable), channel(qr_menu/whatsapp), messages(jsonb array), status(active/handed_off/completed)

**`ai_recommendations`** → id, restaurant_id, type(upsell/menu_optimization/inventory_forecast), payload(jsonb), created_at

**`menu_item_embeddings`** → id, menu_item_id, embedding(vector) — pgvector genişlənməsi ilə, AI-nin menyunu "anlaması" üçün

### 5.9 Sistem

**`notifications`** → id, user_id, restaurant_id, type, title, body, is_read, created_at

**`audit_logs`** → id, restaurant_id, user_id, action, entity_type, entity_id, old_value(jsonb), new_value(jsonb), created_at

---

## 6. İstifadəçi Rolları və İcazələr

| Rol | Əhatə | Əsas icazələr |
|---|---|---|
| **Platform Admin** | Bütün platforma | Bütün restoranları görmə (dəstək məqsədi ilə), abunəlikləri idarəetmə, platforma səviyyəsində analitika |
| **Owner (Sahib)** | Öz restoranı, bütün filiallar | Tam idarəetmə — işçi əlavə/silmə, menyu, maliyyə hesabatları, abunəlik |
| **Manager** | Təyin olunmuş filial(lar) | Menyu redaktə, işçi cədvəli, sifariş monitorinqi, hesabatlar (maliyyə xaric) |
| **Cashier (Kassir)** | Öz filialı | Sifariş yaratma/dəyişmə, ödəniş qəbulu, gün sonu hesabat |
| **Chef (Aşpaz)** | Öz filialı, mətbəx ekranı | Sifariş görmə, status dəyişmə (hazırlanır → hazırdır) |
| **Waiter (Ofisiant)** | Öz filialı, təyin olunmuş masalar | Sifariş qəbulu, masa statusu, müştəri ilə əlaqə |
| **Customer (Müştəri)** | Yalnız öz sifarişi/profili | Menyuya baxma, sifariş, rezervasiya, loyallıq balı görmə |

**Vacib qeyd:** Bütün icazələr həm tətbiq səviyyəsində (UI-da düymələri gizlətmək), həm də **verilənlər bazası səviyyəsində (RLS)** tətbiq olunacaq. Bu ikiqat qoruma — çünki UI-nı aldatmaq mümkündür, amma server-side RLS-i yox.

---

## 7. API Endpoint Dizaynı

Supabase əksər CRUD əməliyyatlarını avtomatik PostgREST vasitəsilə verir (`/rest/v1/orders` və s.). Aşağıdakılar isə **xüsusi Edge Function** tələb edən, işgüzar məntiqi olan endpointlərdir:

| Endpoint | Metod | Vəzifə |
|---|---|---|
| `/functions/onboard-restaurant` | POST | Yeni restoran qeydiyyatı — tenant yaratma, default məlumat |
| `/functions/place-order` | POST | Sifariş yaratma — qiymət hesablama, stok yoxlama, bildiriş göndərmə |
| `/functions/checkout` | POST | Ödəniş başlatma (Stripe/Payriff sessiyası) |
| `/functions/payment-webhook` | POST | Ödəniş provayderindən geri çağırış — sifariş statusunu yeniləmə |
| `/functions/ai-waiter-chat` | POST | AI Ofisiant söhbəti — mesaj alır, kontekst + menyu ilə cavab qaytarır |
| `/functions/ai-business-insight` | POST | "Bu ay ən çox satılan yemək nədir?" tipli təbii dil sorğusu → SQL + izah |
| `/functions/generate-report` | GET | PDF/Excel hesabat generasiyası |
| `/functions/send-notification` | POST | Push/SMS/email bildiriş göndərmə |
| `/functions/inventory-forecast` | GET | AI əsaslı stok proqnozu |
| `/functions/qr-generate` | POST | Masa üçün QR kod yaratma |

**Niyə hər şey avtomatik CRUD ilə deyil:** Sifariş yaratmaq sadə "insert" deyil — qiymət server tərəfində yenidən hesablanmalı (müştəri brauzerdən qiyməti dəyişə bilməz), stok yoxlanmalı, bildiriş tetiklənməlidir. Bu məntiq client-də olsa, sui-istifadəyə açıq olar.

---

## 8. AI Modulları

| Modul | Funksiya | Texnologiya təklifi |
|---|---|---|
| **AI Ofisiant** | Müştəri ilə söhbət, menyu tövsiyəsi, sifariş qəbulu (QR menyu daxilində chat) | Claude/OpenAI API + menyu üzrə embedding axtarışı (pgvector) — model yalnız restoranın öz menyusundan cavab verir, uydurma qiymət/yemək təklif etməsin deyə |
| **Ağıllı Tövsiyə (Upsell)** | "Bununla bu da yaxşı gedər" təklifi | Sifariş tarixçəsi + menyu əlaqəsi əsasında sadə qayda + AI birləşməsi |
| **Biznes Kəşfiyyatı (Natural Language BI)** | Sahib təbii dildə sual verir, sistem qrafik/rəqəm qaytarır | LLM → strukturlaşdırılmış sorğuya çevirmə → Postgres-dən nəticə → izahlı cavab |
| **Stok Proqnozu** | Hansı məhsul nə vaxt bitəcək, nə qədər sifariş vermək lazımdır | Tarixi istehlak məlumatı əsasında trend analizi |
| **Sentiment Analizi** | Rəylərdən məmnunluq səviyyəsini avtomatik qiymətləndirmə | LLM əsaslı təsnifat |
| **Tələb Proqnozu** | Sabah/həftə üçün gözlənilən sifariş həcmi (işçi planlaması üçün) | Tarixi məlumat + mövsümilik |

**Vacib prinsip:** AI heç vaxt birbaşa verilənlər bazasına yazmır. AI həmişə **təklif** verir, son təsdiqi insan (kassir, menecer) edir — xüsusilə ödəniş və stok dəyişikliklərində. Bu, həm təhlükəsizlik, həm etibarlılıq üçündür.

---

## 9. İnkişaf Yol Xəritəsi

| Faza | Məzmun | Çıxış nəticəsi |
|---|---|---|
| **Faza 0** | Arxitektura (bu sənəd) | Təsdiqlənmiş plan |
| **Faza 1** | Təməl: Auth, multi-tenancy, RLS, onboarding axını | Restoran qeydiyyatdan keçib panelə daxil ola bilir |
| **Faza 2** | Menyu idarəetməsi + QR Menyu (müştəri tərəfi) | Müştəri QR skan edib menyunu görür |
| **Faza 3** | Sifariş axını + Mətbəx Ekranı (realtime) | Sifariş verilir, mətbəxdə canlı görünür |
| **Faza 4** | Kassa (POS) interfeysi | Kassir sifarişi qəbul edir, ödəniş alır |
| **Faza 5** | Rezervasiya + Masa idarəetməsi | Masa bron edilə bilir |
| **Faza 6** | Ödəniş inteqrasiyası (Stripe/Payriff) | Real ödəniş axını |
| **Faza 7** | Anbar + Təchizatçı idarəetməsi | Stok izlənir |
| **Faza 8** | İşçi idarəetməsi (cədvəl, davamiyyət) | Növbələr planlaşdırılır |
| **Faza 9** | Loyallıq + Müştəri CRM | Bal sistemi işə düşür |
| **Faza 10** | AI Ofisiant | Söhbət əsaslı sifariş |
| **Faza 11** | AI Biznes Kəşfiyyatı + Hesabatlar | Təbii dil sorğuları |
| **Faza 12** | Çoxdillilik cilası (AZ/EN/RU) | Tam tərcümə örtüyü |
| **Faza 13** | PWA + Offline dəstək | İnternetsiz əsas funksiyalar |
| **Faza 14** | Təhlükəsizlik audit + yük testi | İstismara hazır |
| **Faza 15** | Buraxılış + Billinq canlı | İlk ödənişli müştərilər |

Hər fazanın sonunda mən sənə nəticəni göstərib növbəti fazaya keçmək üçün təsdiq istəyəcəm — bu yanaşma səhvləri erkən tutur.

---

## 10. UI/UX Struktur

### 10.1 Admin Panel (Sahib/Menecer)
Dashboard (KPI-lar) → Sifarişlər → Menyu İdarəetməsi → Masalar/Rezervasiya → Anbar → İşçilər → Müştərilər/Loyallıq → Hesabatlar/Analitika → AI Kəşfiyyat → Parametrlər/Abunəlik

### 10.2 Kassa (POS)
Sürətli sifariş ekranı → Masa seçimi → Ödəniş ekranı → Gün sonu hesabat

### 10.3 Mətbəx Ekranı (KDS)
Böyük, sadə kart görünüşü — Sıra (Queued) → Hazırlanır → Hazır — toxunma ilə status dəyişmə, səs siqnalı yeni sifarişdə

### 10.4 Ofisiant Tətbiqi
Masa xəritəsi → Sifariş götürmə → Mətbəxə göndərmə → Hesab təqdimatı

### 10.5 Müştəri Tətbiqi (QR Menyu)
QR skan → Menyu (kateqoriyalar, şəkillər, filtrlər) → AI Ofisiant chat düyməsi → Səbət → Sifariş/Ödəniş → Sifariş izləmə → Rəy bildirmə

Dizayn dilinə gəlincə — sənin istədiyin premium/glassmorphism/dark-light üslubu bütün bu interfeyslərdə saxlanacaq, amma **rol əsasında fərqləndiriləcək**: mətbəx ekranı və kassa üçün sürət və oxunaqlılıq prioritetdir (az bəzək, böyük düymələr), müştəri tətbiqi üçün isə tam premium təcrübə.

---

## 11. Texnologiya Tövsiyələri və Əsaslandırma

| Sahə | Tövsiyə | Səbəb |
|---|---|---|
| Frontend framework | **Next.js (React) + TypeScript** | Vanilla JS 6 ayrı tətbiqdə component təkrarını, tip xətalarını idarə etməyi çətinləşdirir. Next.js SSR/PWA dəstəyi, TypeScript isə production-da xəta sayını əhəmiyyətli azaldır. Sənin əvvəlki seçimin (Vanilla JS) kiçik layihə üçün məqbuldur, amma bu miqyasda tövsiyə etmirəm. |
| Backend | **Supabase** (artıq qərar verilib) | Postgres + Auth + Realtime + Storage + Edge Functions bir yerdə, RLS ilə multi-tenancy təbii dəstəklənir |
| Stil | **Tailwind CSS** | Component-based glassmorphism/dark-mode sistemini sürətlə qurmaq üçün ən effektiv yol |
| Ödəniş | **Stripe (beynəlxalq) + Payriff (Azərbaycan)** | Lokal bazarda kart ödənişləri üçün Payriff daha uyğun, xarici müştərilər üçün Stripe |
| AI | **Claude/OpenAI API + pgvector** | Embedding axtarışı ilə AI-ni yalnız restoranın öz məlumatına "bağlamaq" — uydurma cavabların qarşısını alır |
| Hosting (frontend) | **Vercel** | Next.js ilə ən yaxşı inteqrasiya, avtomatik SSL, sürətli CDN |
| Monorepo alət | **Turborepo + pnpm** | 6 tətbiqi ortaq paketlərlə idarə etmək üçün sənaye standartı |

---

## 12. Arxitektura Qərarlarının Əsaslandırılması (Xülasə)

- **Multi-tenant + RLS** seçildi, çünki tək restoran üçün ayrı-ayrı database qurmaq (single-tenant) miqyaslana bilməz — 100 restoran = 100 ayrı infrastruktur idarəetməsi deməkdir. RLS ilə tək bazada təhlükəsiz təcrid mümkündür.
- **Monorepo** seçildi, çünki 6 tətbiq arasında dizayn və tip ardıcıllığı əl ilə saxlanıla bilməz.
- **Edge Functions işgüzar məntiq üçün** seçildi, çünki qiymət/stok kimi həssas hesablamalar client-də edilərsə, sui-istifadəyə açıq olur.
- **AI-nin son sözü olmaması** prinsipi seçildi, çünki avtomatlaşdırılmış sistemlərdə etibar itkisi ən böyük risk amilidir — insan təsdiqi kritik əməliyyatlarda saxlanılır.

---

## 13. Təsdiq Tələb Olunan Açıq Məsələlər

Koda keçmədən əvvəl bu suallara cavabın lazımdır:

1. **Frontend framework:** Next.js + TypeScript ilə razısan, yoxsa Vanilla JS-də israr edirsən?
2. **Ödəniş provayderi:** Payriff/Kapital Bank inteqrasiyası indi lazımdır, yoxsa Faza 6-ya qədər gözləyə bilər?
3. **İlk fokus bazar:** Tək bir restoran üçün pilot, yoxsa birbaşa çox-restoranlı SaaS kimi qurulsun? (Cavab arxitekturanı dəyişmir, amma Faza 1-in əhatəsini müəyyən edir)
4. **AI provayderi:** Claude API, yoxsa OpenAI, yoxsa hər ikisi?

Bu sualların cavabından sonra Faza 1-ə başlayıram.

---

*By s_akhundoff — [Instagram](https://instagram.com/s_akhundoff)*
