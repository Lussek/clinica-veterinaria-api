-- =====================================================================
-- API Clínica Veterinária — estrutura do banco (Supabase / PostgreSQL)
-- Execute no SQL Editor do Supabase. O script é idempotente: pode ser
-- executado novamente sem apagar dados existentes.
-- =====================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Tutores
-- ---------------------------------------------------------------------
create table if not exists public.owners (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(120) not null,
    email       varchar(160) not null unique,
    phone       varchar(30),
    active      boolean      not null default true,
    created_at  timestamptz  not null default now()
);

-- ---------------------------------------------------------------------
-- Pets (N:1 com tutores)
-- ---------------------------------------------------------------------
create table if not exists public.pets (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid         not null references public.owners (id) on delete restrict,
    name        varchar(80)  not null,
    species     varchar(40)  not null,
    breed       varchar(80),
    birth_date  date,
    active      boolean      not null default true,
    created_at  timestamptz  not null default now()
);

create index if not exists idx_pets_owner_id on public.pets (owner_id);

-- ---------------------------------------------------------------------
-- Consultas (N:1 com pets)
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
    id            uuid primary key default gen_random_uuid(),
    pet_id        uuid          not null references public.pets (id) on delete restrict,
    scheduled_at  timestamptz   not null,
    veterinarian  varchar(120)  not null,
    reason        varchar(255)  not null,
    status        varchar(20)   not null default 'agendada'
                  check (status in ('agendada', 'concluida', 'cancelada')),
    price         numeric(10,2) not null default 0 check (price >= 0),
    notes         text,
    created_at    timestamptz   not null default now()
);

create index if not exists idx_appointments_pet_id       on public.appointments (pet_id);
create index if not exists idx_appointments_scheduled_at on public.appointments (scheduled_at);

-- ---------------------------------------------------------------------
-- Segurança: RLS ligado e sem políticas públicas. A API acessa o banco
-- com a secret key (service role), que ignora o RLS; a chave pública
-- (anon) não consegue ler nem gravar nada.
-- ---------------------------------------------------------------------
alter table public.owners       enable row level security;
alter table public.pets         enable row level security;
alter table public.appointments enable row level security;
