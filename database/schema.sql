-- Execute este script no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

-- Tutores (donos dos pets)
create table if not exists owners (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    email      text not null unique,
    phone      text,
    active     boolean not null default true,
    created_at timestamptz not null default now()
);

-- Pets (cada pet pertence a um tutor)
create table if not exists pets (
    id         uuid primary key default gen_random_uuid(),
    owner_id   uuid not null references owners(id) on delete restrict,
    name       text not null,
    species    text not null,
    breed      text,
    birth_date date,
    active     boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists pets_owner_id_idx on pets(owner_id);

-- RLS ativo e sem policies: apenas a secret key (usada pelo back-end) acessa os dados.
alter table owners enable row level security;
alter table pets enable row level security;
