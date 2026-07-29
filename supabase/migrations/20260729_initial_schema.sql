-- ============================================================
-- RESTORAN - Ilkin Sxem (Faza 2: Tenant + Kimlik + Menyu)
-- ============================================================
-- QEYD: Bu fayl canli Supabase layihesinde artiq tetbiq olunmus
-- sxemin SENEDLESDIRILMIS EKSIDIR (repo ile production-un sync
-- qalmasi ucun). Yerli inkishaf ucun: `supabase db reset` bu fayli
-- oxuyub eyni sxemi yerli mühitde qurar.
-- ============================================================

create extension if not exists "vector" with schema public;

-- ---------- ENUM TIPLERI ----------
create type public.supported_language as enum ('az', 'en', 'ru');
create type public.subscription_plan as enum ('free', 'pro', 'enterprise');
create type public.subscription_status as enum ('active', 'trial', 'suspended', 'cancelled');
create type public.staff_role as enum ('owner', 'manager', 'cashier', 'chef', 'waiter');

-- ---------- ORTAQ FUNKSIYALAR ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PLATFORMA VE TENANT CEDVELLERI
-- ============================================================

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique,
  subscription_plan public.subscription_plan not null default 'free',
  subscription_status public.subscription_status not null default 'trial',
  default_language public.supported_language not null default 'az',
  timezone text not null default 'Asia/Baku',
  created_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  lat numeric,
  lng numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language public.supported_language not null default 'az',
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'auth.users cedvelinin ictimai profil genislenmesi';

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  role public.staff_role not null,
  is_active boolean not null default true,
  hired_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

-- ============================================================
-- MENYU CEDVELLERI (coxdilli JSONB: {"az":"...","en":"...","ru":"..."})
-- ============================================================

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on column public.menu_categories.name is 'Coxdilli: {"az": "...", "en": "...", "ru": "..."}';

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  price numeric not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  prep_time_minutes integer,
  calories integer,
  allergens text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name jsonb not null default '{}'::jsonb,
  price_modifier numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  group_name text not null default 'Əlavələr',
  name jsonb not null default '{}'::jsonb,
  price_modifier numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS KOMEKCI FUNKSIYALARI (SECURITY DEFINER - postgres sahibli,
-- ona gore staff_members-i oxuyanda rekursiv RLS tetbiq olunmur)
-- ============================================================

create or replace function public.is_staff_of(_restaurant_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = _restaurant_id and r.owner_id = auth.uid()
  ) or exists (
    select 1 from public.staff_members sm
    where sm.restaurant_id = _restaurant_id
      and sm.user_id = auth.uid()
      and sm.is_active
  );
$$;

create or replace function public.can_manage_menu(target_restaurant_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = target_restaurant_id and r.owner_id = auth.uid()
  ) or exists (
    select 1 from public.staff_members sm
    where sm.restaurant_id = target_restaurant_id
      and sm.user_id = auth.uid()
      and sm.role = 'manager'
      and sm.is_active = true
  );
$$;

create or replace function public.is_platform_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- Yeni istifadeci qeydiyyatindan kecende profiles setrini avtomatik yaradir
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Restoran qeydiyyati: restaurants + branches + staff_members setrini
-- BIR tranzaksiyada, atomik seklide yaradir (SAD bolme 7-de tesvir olunan
-- /functions/onboard-restaurant Edge Function-unun DB-daxili ekvivalenti)
create or replace function public.onboard_restaurant(
  _name text,
  _slug text,
  _default_language text default 'az',
  _timezone text default 'Asia/Baku'
)
returns public.restaurants
language plpgsql security definer set search_path = public as $$
declare
  new_restaurant public.restaurants;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED: bu emeliyyat ucun daxil olmalisiniz';
  end if;

  insert into public.restaurants (owner_id, name, slug, default_language, timezone)
  values (auth.uid(), _name, _slug, _default_language::supported_language, _timezone)
  returning * into new_restaurant;

  insert into public.branches (restaurant_id, name, is_active)
  values (new_restaurant.id, _name, true);

  insert into public.staff_members (user_id, restaurant_id, role)
  values (auth.uid(), new_restaurant.id, 'owner');

  return new_restaurant;
end;
$$;

-- Musteri (public) tereden slug ile restoran axtarisi ucun - yalniz
-- aktiv/trial abunelikleri gosterir, hessas sutunlari (owner_id, plan) ifsa etmir
create or replace function public.get_public_restaurant_by_slug(_slug text)
returns table (id uuid, name text, slug text, default_language public.supported_language)
language sql stable as $$
  select r.id, r.name, r.slug, r.default_language
  from public.restaurants r
  where r.slug = _slug
    and r.subscription_status in ('active', 'trial');
$$;

-- ============================================================
-- RLS AKTIVLESDIRME VE SIYASETLER
-- ============================================================

alter table public.platform_admins enable row level security;
alter table public.restaurants enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_variants enable row level security;
alter table public.menu_item_modifiers enable row level security;

create policy platform_admins_select_self on public.platform_admins
  for select using (user_id = auth.uid());

create policy restaurants_insert_own on public.restaurants
  for insert with check (owner_id = auth.uid());
create policy restaurants_select_members on public.restaurants
  for select using (is_staff_of(id));
create policy restaurants_select_public_active on public.restaurants
  for select using (subscription_status = any (array['active','trial']::subscription_status[]));
create policy restaurants_update_owner on public.restaurants
  for update using (owner_id = auth.uid());

create policy branches_select_members on public.branches
  for select using (is_staff_of(restaurant_id));
create policy branches_write_members on public.branches
  for all using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));
create policy branches_write_owner on public.branches
  for all using (exists (select 1 from restaurants r where r.id = branches.restaurant_id and r.owner_id = auth.uid()));

create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

create policy staff_select_self on public.staff_members for select using (user_id = auth.uid());
create policy staff_select_colleagues on public.staff_members for select using (is_staff_of(restaurant_id));
create policy staff_select_by_owner on public.staff_members
  for select using (exists (select 1 from restaurants r where r.id = staff_members.restaurant_id and r.owner_id = auth.uid()));
create policy staff_write_owner on public.staff_members
  for all using (exists (select 1 from restaurants r where r.id = staff_members.restaurant_id and r.owner_id = auth.uid()));

create policy menu_categories_public_read on public.menu_categories
  for select using (is_active = true or is_staff_of(restaurant_id));
create policy menu_categories_write_staff on public.menu_categories
  for all using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));
create policy menu_categories_write_manager on public.menu_categories
  for all using (can_manage_menu(restaurant_id));

create policy menu_items_public_read on public.menu_items
  for select using (is_available = true or is_staff_of(restaurant_id));
create policy menu_items_write_staff on public.menu_items
  for all using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));
create policy menu_items_write_manager on public.menu_items
  for all using (can_manage_menu(restaurant_id));

create policy variants_public_read on public.menu_item_variants for select using (true);
create policy variants_write_staff on public.menu_item_variants
  for all using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

create policy modifiers_public_read on public.menu_item_modifiers for select using (true);
create policy modifiers_write_staff on public.menu_item_modifiers
  for all using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

-- ============================================================
-- INDEKSLER
-- ============================================================
create index idx_restaurants_owner on public.restaurants(owner_id);
create index idx_branches_restaurant on public.branches(restaurant_id);
create index idx_staff_restaurant on public.staff_members(restaurant_id);
create index idx_staff_user on public.staff_members(user_id);
create index idx_menu_categories_restaurant on public.menu_categories(restaurant_id);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_menu_items_category on public.menu_items(category_id);
