-- ЦЕХ barbershop — run this in Supabase SQL Editor (once).
-- After that: put URL + service role key into server/.env and run `npm run seed`.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('owner', 'manager', 'barber', 'client');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  email text unique,
  role public.app_role not null default 'client',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null,
  title text,
  bio text,
  years_experience int,
  avatar_letter text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  price_uzs int not null,
  duration_min int not null default 60,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('ru', 'uz', 'en')),
  tkey text not null,
  value text not null,
  unique (locale, tkey)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  barber_id uuid not null references public.barbers (id),
  service_id uuid not null references public.services (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_uzs int not null,
  status public.booking_status not null default 'confirmed',
  guest_name text,
  guest_phone text,
  created_at timestamptz not null default now(),
  unique (barber_id, starts_at)
);

create index if not exists bookings_client_idx on public.bookings (client_id, starts_at desc);
create index if not exists bookings_barber_idx on public.bookings (barber_id, starts_at desc);
create index if not exists bookings_starts_idx on public.bookings (starts_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.translations enable row level security;
alter table public.bookings enable row level security;

-- Public read of catalog/content; writes go through the Node API (service role).
drop policy if exists "public read barbers" on public.barbers;
create policy "public read barbers" on public.barbers for select using (true);

drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select using (true);

drop policy if exists "public read translations" on public.translations;
create policy "public read translations" on public.translations for select using (true);

-- Seed catalog (safe to re-run)
insert into public.services (slug, price_uzs, duration_min, sort_order)
values
  ('haircut', 80000, 45, 1),
  ('haircut-beard', 120000, 70, 2),
  ('beard', 50000, 30, 3),
  ('camouflage', 60000, 40, 4),
  ('kids', 60000, 30, 5),
  ('full', 150000, 90, 6)
on conflict (slug) do update set
  price_uzs = excluded.price_uzs,
  duration_min = excluded.duration_min,
  sort_order = excluded.sort_order;

insert into public.barbers (display_name, title, bio, years_experience, avatar_letter, sort_order)
select * from (values
  ('Даврон', 'Топ-барбер · 8 лет опыта', 'Фейды и классика. Чёткая окантовка — визитная карточка.', 8, 'Д', 1),
  ('Сардор', 'Барбер · 5 лет опыта', 'Борода любой сложности, камуфляж, уход за кожей.', 5, 'С', 2),
  ('Жасур', 'Барбер · 4 года опыта', 'Молодёжные стрижки, текстура, детские стрижки.', 4, 'Ж', 3)
) as v(display_name, title, bio, years_experience, avatar_letter, sort_order)
where not exists (select 1 from public.barbers);

-- After this file, run translations.sql in the same SQL Editor.
