-- Faza 3: çatdırılma və özün-apar. Bazaya MCP ilə tətbiq olunub (order_flow_phase3_delivery).
alter table orders
  add column if not exists picked_up_at timestamptz,
  add column if not exists delivered_at timestamptz;

-- get_order_tracking(uuid) eyni sütunlarla yenidən yaradıldı, əlavə olaraq picked_up_at qaytarır.
