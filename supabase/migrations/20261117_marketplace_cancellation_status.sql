alter table public.marketplace_orders drop constraint if exists marketplace_orders_status_check;
alter table public.marketplace_orders add constraint marketplace_orders_status_check
check(status in ('pending','paid','delivered','released','refunded','cancelled'));