-- Запрет пересекающихся записей у одного барбера + длительность услуг.
-- Выполнить один раз в Supabase SQL Editor. Можно запускать повторно.

create extension if not exists btree_gist;

-- Старое правило блокировало повторную запись на время отменённой брони
alter table public.bookings drop constraint if exists bookings_barber_id_starts_at_key;

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (barber_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('confirmed', 'completed'));

update public.services set duration_min = 45 where slug = 'haircut';
update public.services set duration_min = 60 where slug = 'haircut-beard';
update public.services set duration_min = 30 where slug = 'beard';
update public.services set duration_min = 30 where slug = 'camouflage';
update public.services set duration_min = 30 where slug = 'kids';
update public.services set duration_min = 90 where slug = 'full';
