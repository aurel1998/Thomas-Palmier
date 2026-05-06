-- ============================================================
-- Table "contents" - a coller dans Supabase (SQL Editor)
-- ============================================================
-- Cree la table principale des contenus (video / article / audio),
-- ses index et ses policies RLS.
-- Idempotent : peut etre re-execute sans erreur.
-- ============================================================

-- Extension UUID (presente par defaut sur Supabase)
create extension if not exists "uuid-ossp";

-- Table categories (classification dynamique)
create table if not exists public.categories (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null unique,
  description text        not null default '',
  position    integer     not null default 100,
  created_at  timestamptz not null default now()
);

alter table public.categories
  add column if not exists position integer not null default 100;

-- Profil journaliste (singleton : id = true)
create table if not exists public.journalist_profile (
  id         boolean     primary key default true check (id = true),
  image_url  text        not null default '',
  updated_at timestamptz not null default now()
);

insert into public.journalist_profile (id)
values (true)
on conflict (id) do nothing;

-- Table principale
create table if not exists public.contents (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  type        text        not null check (type in ('video', 'article', 'audio')),
  content     text        not null default '',
  image_url   text        not null default '',
  tags        text[]      not null default '{}',
  category_id uuid        null references public.categories(id) on delete set null,
  is_featured boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Migration douce pour bases existantes (si la table existe deja)
alter table public.contents
  add column if not exists category_id uuid,
  add column if not exists is_featured boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contents_category_id_fkey'
      and conrelid = 'public.contents'::regclass
  ) then
    alter table public.contents
      add constraint contents_category_id_fkey
      foreign key (category_id)
      references public.categories(id)
      on delete set null;
  end if;
end $$;

-- Garantit un seul contenu "a la une" en base (si plusieurs existent deja, on garde le plus recent).
with ranked_featured as (
  select
    id,
    row_number() over (order by created_at desc, id desc) as rn
  from public.contents
  where is_featured = true
)
update public.contents c
set is_featured = false
from ranked_featured rf
where c.id = rf.id
  and rf.rn > 1;

-- Index
create index if not exists categories_created_at_idx on public.categories (created_at desc);
create index if not exists categories_name_idx       on public.categories (name);
create index if not exists categories_position_idx   on public.categories (position asc, name asc);
create index if not exists contents_created_at_idx on public.contents (created_at desc);
create index if not exists contents_type_idx       on public.contents (type);
create index if not exists contents_tags_idx       on public.contents using gin (tags);
create index if not exists contents_category_id_idx on public.contents (category_id);
create index if not exists contents_is_featured_idx on public.contents (is_featured);
create unique index if not exists contents_single_featured_idx
  on public.contents (is_featured)
  where is_featured = true;

-- Row Level Security
alter table public.categories enable row level security;
alter table public.contents enable row level security;
alter table public.journalist_profile enable row level security;

drop policy if exists "categories_public_read" on public.categories;
drop policy if exists "categories_auth_insert" on public.categories;
drop policy if exists "categories_auth_update" on public.categories;
drop policy if exists "categories_auth_delete" on public.categories;
drop policy if exists "contents_public_read" on public.contents;
drop policy if exists "contents_auth_insert" on public.contents;
drop policy if exists "contents_auth_update" on public.contents;
drop policy if exists "contents_auth_delete" on public.contents;
drop policy if exists "journalist_profile_public_read" on public.journalist_profile;
drop policy if exists "journalist_profile_auth_update" on public.journalist_profile;

create policy "categories_public_read"
  on public.categories for select
  using (true);

create policy "categories_auth_insert"
  on public.categories for insert
  to authenticated
  with check (true);

create policy "categories_auth_update"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

create policy "categories_auth_delete"
  on public.categories for delete
  to authenticated
  using (true);

create policy "journalist_profile_public_read"
  on public.journalist_profile for select
  using (true);

create policy "journalist_profile_auth_update"
  on public.journalist_profile for update
  to authenticated
  using (true)
  with check (true);

-- Lecture publique (site public)
create policy "contents_public_read"
  on public.contents for select
  using (true);

-- Ecriture reservee aux utilisateurs authentifies (admin Supabase Auth)
create policy "contents_auth_insert"
  on public.contents for insert
  to authenticated
  with check (true);

create policy "contents_auth_update"
  on public.contents for update
  to authenticated
  using (true)
  with check (true);

create policy "contents_auth_delete"
  on public.contents for delete
  to authenticated
  using (true);

-- ============================================================
-- (Optionnel) Insertion de test - decommente si besoin
-- ============================================================
-- insert into public.categories (name, description)
-- values
--   ('Analyse', 'Decryptage et lecture tactique des matchs'),
--   ('Enquete', 'Investigations et coulisses du sport'),
--   ('Coulisses', 'Immersion terrain et portraits'),
--   ('Interview', 'Entretiens avec les acteurs du sport')
-- on conflict (name) do nothing;
--
-- insert into public.contents (title, type, content, image_url, tags)
-- values ('Test ligue 1', 'article', 'Premier contenu.', '', array['football','ligue1']);
