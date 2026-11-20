create type public.prep_station as enum ('kitchen', 'bar');

alter table public.menu_items add column prep_station public.prep_station not null default 'kitchen';

alter table public.order_items
  add column station public.prep_station not null default 'kitchen',
  add column ready_at timestamptz;

alter table public.orders
  add column ready_at timestamptz,
  add column served_at timestamptz,
  add column served_by uuid,
  add column paid_at timestamptz,
  add column paid_by uuid,
  add column cancelled_at timestamptz,
  add column cancelled_by uuid,
  add column cancel_reason text;

create or replace function public.place_order(
  _restaurant_id uuid, _table_id uuid, _order_type order_type, _items jsonb,
  _payment_method payment_method default 'cash'::payment_method,
  _customer_phone text default null, _customer_name text default null,
  _placed_by order_placed_by default 'customer'::order_placed_by,
  _created_by uuid default null, _delivery_address text default null
)
returns table(order_id uuid, order_number integer, total numeric)
language plpgsql security definer set search_path to 'public'
as $function$
declare
  new_order_id uuid;
  new_order_number integer;
  restaurant_tz text;
  today_local date;
  computed_subtotal numeric := 0;
  item jsonb;
  unit_price numeric;
  item_station prep_station;
  variant_price numeric;
  modifiers_price numeric;
  item_qty int;
  line_total numeric;
  target_customer_id uuid;
  earned_points int;
begin
  select timezone into restaurant_tz
  from public.restaurants
  where id = _restaurant_id and subscription_status in ('active', 'trial');

  if restaurant_tz is null then
    raise exception 'RESTAURANT_UNAVAILABLE: restoran hazirda sifaris qebul etmir';
  end if;

  if _table_id is not null and not exists (
    select 1 from public.restaurant_tables where id = _table_id and restaurant_id = _restaurant_id
  ) then
    raise exception 'INVALID_TABLE: masa bu restorana aid deyil';
  end if;

  if _items is null or jsonb_array_length(_items) = 0 then
    raise exception 'EMPTY_ORDER: sifarisde en azi bir mehsul olmalidir';
  end if;

  if _order_type = 'delivery' then
    if _customer_phone is null or trim(_customer_phone) = '' then
      raise exception 'DELIVERY_PHONE_REQUIRED: evə çatdırılma üçün telefon nömrəsi tələb olunur';
    end if;
    if _delivery_address is null or trim(_delivery_address) = '' then
      raise exception 'DELIVERY_ADDRESS_REQUIRED: evə çatdırılma üçün ünvan tələb olunur';
    end if;
  end if;

  if _customer_phone is not null and trim(_customer_phone) <> '' then
    select id into target_customer_id
    from public.customers
    where restaurant_id = _restaurant_id and phone = trim(_customer_phone);

    if target_customer_id is null then
      insert into public.customers (restaurant_id, full_name, phone)
      values (_restaurant_id, nullif(trim(_customer_name), ''), trim(_customer_phone))
      returning id into target_customer_id;
    end if;
  end if;

  today_local := (now() at time zone coalesce(restaurant_tz, 'UTC'))::date;

  insert into public.restaurant_order_counters (restaurant_id, next_number, counter_date)
  values (_restaurant_id, 2, today_local)
  on conflict (restaurant_id) do update
    set next_number = case
          when restaurant_order_counters.counter_date = today_local then restaurant_order_counters.next_number + 1
          else 2
        end,
        counter_date = today_local
  returning next_number - 1 into new_order_number;

  insert into public.orders (restaurant_id, branch_id, table_id, customer_id, order_type, status, placed_by, created_by, subtotal, tax, total, order_number, delivery_address)
  select _restaurant_id, b.id, _table_id, target_customer_id, _order_type, 'pending', _placed_by, _created_by, 0, 0, 0, new_order_number, nullif(trim(_delivery_address), '')
  from public.branches b
  where b.restaurant_id = _restaurant_id and b.is_active = true
  order by b.created_at asc
  limit 1
  returning id into new_order_id;

  if new_order_id is null then
    raise exception 'NO_ACTIVE_BRANCH: restoranin aktiv filiali tapilmadi';
  end if;

  for item in select * from jsonb_array_elements(_items)
  loop
    item_qty := coalesce((item->>'quantity')::int, 1);
    if item_qty < 1 then
      raise exception 'INVALID_QUANTITY: miqdar 1-den az ola bilmez';
    end if;

    select price, prep_station into unit_price, item_station
    from public.menu_items
    where id = (item->>'menu_item_id')::uuid
      and restaurant_id = _restaurant_id
      and is_available = true;

    if unit_price is null then
      raise exception 'ITEM_UNAVAILABLE: secilmis mehsul movcud deyil';
    end if;

    variant_price := 0;
    if item->>'variant_id' is not null then
      select price_modifier into variant_price
      from public.menu_item_variants
      where id = (item->>'variant_id')::uuid and menu_item_id = (item->>'menu_item_id')::uuid;
      variant_price := coalesce(variant_price, 0);
    end if;

    modifiers_price := 0;
    if item ? 'modifier_ids' and jsonb_array_length(item->'modifier_ids') > 0 then
      select coalesce(sum(price_modifier), 0) into modifiers_price
      from public.menu_item_modifiers
      where id in (select jsonb_array_elements_text(item->'modifier_ids')::uuid)
        and menu_item_id = (item->>'menu_item_id')::uuid;
    end if;

    line_total := (unit_price + variant_price + modifiers_price) * item_qty;
    computed_subtotal := computed_subtotal + line_total;

    insert into public.order_items (
      order_id, restaurant_id, menu_item_id, variant_id, quantity, unit_price,
      selected_modifiers, special_instructions, kitchen_status, station
    ) values (
      new_order_id, _restaurant_id, (item->>'menu_item_id')::uuid,
      nullif(item->>'variant_id', '')::uuid, item_qty, unit_price + variant_price + modifiers_price,
      coalesce(item->'modifier_ids', '[]'::jsonb), item->>'special_instructions', 'queued', item_station
    );
  end loop;

  update public.orders
  set subtotal = computed_subtotal, total = computed_subtotal
  where id = new_order_id;

  insert into public.payments (order_id, restaurant_id, amount, method, status)
  values (new_order_id, _restaurant_id, computed_subtotal, _payment_method, 'pending');

  if target_customer_id is not null then
    earned_points := floor(computed_subtotal)::int;

    update public.customers
    set total_spent = total_spent + computed_subtotal,
        visit_count = visit_count + 1,
        loyalty_points = loyalty_points + earned_points
    where id = target_customer_id;

    insert into public.loyalty_transactions (restaurant_id, customer_id, points_change, reason, order_id)
    values (_restaurant_id, target_customer_id, earned_points, 'Sifariş', new_order_id);
  end if;

  return query select new_order_id, new_order_number, computed_subtotal;
end;
$function$;

create or replace function public.stamp_order_item_ready()
returns trigger language plpgsql set search_path to 'public'
as $$
begin
  if new.kitchen_status = 'ready' and old.kitchen_status is distinct from 'ready' then
    new.ready_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_stamp_order_item_ready
before update on public.order_items
for each row execute function public.stamp_order_item_ready();

create or replace function public.notify_order_ready()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
declare
  table_label text;
begin
  if new.status = 'ready' and old.status is distinct from 'ready' then
    new.ready_at := now();
    if new.table_id is not null then
      select table_number into table_label from public.restaurant_tables where id = new.table_id;
    end if;
    insert into public.notifications (restaurant_id, user_id, type, title, body)
    values (
      new.restaurant_id, null, 'order_ready',
      'Sifariş #' || new.order_number || ' hazırdır',
      case new.order_type
        when 'dine_in' then 'Masa ' || coalesce(table_label, '') || ': stola aparın'
        when 'delivery' then 'Çatdırılma: kuryer götürə bilər'
        else 'Özün apar: müştəri kassadan götürə bilər'
      end
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_order_ready
before update on public.orders
for each row execute function public.notify_order_ready();
